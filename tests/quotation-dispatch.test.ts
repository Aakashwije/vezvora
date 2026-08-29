import test from "node:test";
import assert from "node:assert/strict";
import {
  canDispatch,
  dispatchDueQuotations,
  dispatchQuotation,
  type DispatchDeps,
} from "../src/lib/quotation/dispatch.ts";
import type { Mailer, SendResult } from "../src/lib/quotation/email.ts";
import { createMemoryQuotationStore, type QuotationStore } from "../src/lib/quotation/store.ts";
import type { QuotationRecord, QuotationStatus } from "../src/lib/quotation/types.ts";
import { createInput, record } from "./helpers/fixtures.ts";

const CREATED_AT = "2026-08-29T09:00:00.000Z";
/** Ten minutes and one second after submission — the review window has closed. */
const AFTER_DEADLINE = new Date("2026-08-29T09:10:01.000Z").getTime();
const BEFORE_DEADLINE = new Date("2026-08-29T09:05:00.000Z").getTime();

class FakeMailer implements Mailer {
  sends: { number: string; idempotencyKey: string; bytes: number }[] = [];
  adminNotifications = 0;
  failNext = 0;

  async sendQuotation(
    quotation: QuotationRecord,
    pdf: Uint8Array,
    idempotencyKey: string,
  ): Promise<SendResult> {
    if (this.failNext > 0) {
      this.failNext -= 1;
      return { ok: false, error: "Provider rejected the message", retryable: true };
    }
    this.sends.push({
      number: quotation.number,
      idempotencyKey,
      bytes: pdf.byteLength,
    });
    return { ok: true, provider: "fake", messageId: `msg_${this.sends.length}` };
  }

  async notifyAdmin(): Promise<SendResult> {
    this.adminNotifications += 1;
    return { ok: true, provider: "fake", messageId: "admin" };
  }
}

/** Stand-in for the real renderer; PDF output is covered by its own suite. */
async function renderPdf() {
  return { bytes: new Uint8Array([1, 2, 3, 4]), hash: "deadbeef" };
}

async function setup(
  overrides: Partial<QuotationRecord> = {},
): Promise<{ store: QuotationStore; mailer: FakeMailer; id: string; deps: DispatchDeps }> {
  const store = createMemoryQuotationStore();
  const mailer = new FakeMailer();
  const created = await store.create(createInput({ createdAt: CREATED_AT, ...overrides }));
  const deps: DispatchDeps = { store, mailer, renderPdf, now: () => AFTER_DEADLINE };
  return { store, mailer, id: created.id, deps };
}

/* ------------------------------------------------------ the decision matrix */

test("canDispatch allows an auto send only after the review deadline", () => {
  const pending = record();
  assert.deepEqual(canDispatch(pending, "auto", BEFORE_DEADLINE), {
    ok: false,
    reason: "not_due",
  });
  assert.deepEqual(canDispatch(pending, "auto", AFTER_DEADLINE), { ok: true });
});

test("canDispatch refuses to auto-send held, cancelled, sent or in-flight quotations", () => {
  const cases: [QuotationStatus, string][] = [
    ["held", "not_sendable"],
    ["cancelled", "not_sendable"],
    ["sent", "already_sent"],
    ["sending", "in_flight"],
    ["failed", "not_sendable"],
  ];
  for (const [status, reason] of cases) {
    assert.deepEqual(
      canDispatch(record({ status }), "auto", AFTER_DEADLINE),
      { ok: false, reason },
      `status ${status}`,
    );
  }
});

test("canDispatch still auto-sends a quotation an administrator edited or approved", () => {
  for (const status of ["updated", "approved"] as QuotationStatus[]) {
    assert.deepEqual(canDispatch(record({ status }), "auto", AFTER_DEADLINE), { ok: true });
  }
});

test("an administrator may send before the deadline, and from a hold", () => {
  assert.deepEqual(canDispatch(record(), "manual", BEFORE_DEADLINE), { ok: true });
  assert.deepEqual(canDispatch(record({ status: "held" }), "manual", BEFORE_DEADLINE), { ok: true });
  assert.deepEqual(canDispatch(record({ status: "cancelled" }), "manual", BEFORE_DEADLINE), {
    ok: false,
    reason: "not_sendable",
  });
});

test("retry only applies to a failed send, or one abandoned mid-flight", () => {
  assert.deepEqual(canDispatch(record({ status: "failed" }), "retry", AFTER_DEADLINE), { ok: true });
  assert.deepEqual(canDispatch(record({ status: "pending_review" }), "retry", AFTER_DEADLINE), {
    ok: false,
    reason: "not_sendable",
  });

  const stuck = record({
    status: "sending",
    sendClaimedAt: new Date(AFTER_DEADLINE - 10 * 60_000).toISOString(),
  });
  assert.deepEqual(canDispatch(stuck, "retry", AFTER_DEADLINE), { ok: true });

  const justStarted = record({
    status: "sending",
    sendClaimedAt: new Date(AFTER_DEADLINE - 5_000).toISOString(),
  });
  assert.deepEqual(canDispatch(justStarted, "retry", AFTER_DEADLINE), {
    ok: false,
    reason: "in_flight",
  });
});

/* ---------------------------------------------------------- the full worker */

test("sends automatically once the review window has closed", async () => {
  const { store, mailer, id, deps } = await setup();

  const result = await dispatchQuotation(deps, { id, trigger: "auto" });

  assert.equal("sent" in result && result.sent, true);
  assert.equal(mailer.sends.length, 1);

  const saved = await store.get(id);
  assert.equal(saved?.status, "sent");
  assert.equal(saved?.email.state, "sent");
  assert.equal(saved?.email.provider, "fake");
  assert.equal(saved?.email.messageId, "msg_1");
  assert.ok(saved?.sentAt);
  assert.equal(saved?.pdfHash, "deadbeef");
  assert.ok(saved?.activity.some((entry) => entry.action === "sent"));
});

test("does not send before the review window closes", async () => {
  const { store, mailer, id } = await setup();

  const result = await dispatchQuotation(
    { store, mailer, renderPdf, now: () => BEFORE_DEADLINE },
    { id, trigger: "auto" },
  );

  assert.deepEqual(result, {
    sent: false,
    skipped: "not_due",
    record: (await store.get(id))!,
  });
  assert.equal(mailer.sends.length, 0);
  assert.equal((await store.get(id))?.status, "pending_review");
});

test("a held quotation is never sent automatically", async () => {
  const { store, mailer, id, deps } = await setup({ status: "held" });

  const result = await dispatchQuotation(deps, { id, trigger: "auto" });

  assert.equal("skipped" in result && result.skipped, "not_sendable");
  assert.equal(mailer.sends.length, 0);
  assert.equal((await store.get(id))?.status, "held");
});

test("a cancelled quotation is never sent automatically", async () => {
  const { store, mailer, id, deps } = await setup({ status: "cancelled" });

  const result = await dispatchQuotation(deps, { id, trigger: "auto" });

  assert.equal("skipped" in result && result.skipped, "not_sendable");
  assert.equal(mailer.sends.length, 0);
  assert.equal((await store.get(id))?.status, "cancelled");
});

test("a duplicated job execution sends exactly one email", async () => {
  const { mailer, id, deps } = await setup();

  const first = await dispatchQuotation(deps, { id, trigger: "auto" });
  const second = await dispatchQuotation(deps, { id, trigger: "auto" });
  const third = await dispatchQuotation(deps, { id, trigger: "auto" });

  assert.equal("sent" in first && first.sent, true);
  assert.equal("skipped" in second && second.skipped, "already_sent");
  assert.equal("skipped" in third && third.skipped, "already_sent");
  assert.equal(mailer.sends.length, 1);
});

test("concurrent workers cannot both claim the same send", async () => {
  const { mailer, id, deps } = await setup();

  const results = await Promise.all([
    dispatchQuotation(deps, { id, trigger: "auto" }),
    dispatchQuotation(deps, { id, trigger: "auto" }),
    dispatchQuotation(deps, { id, trigger: "auto" }),
  ]);

  const sent = results.filter((result) => "sent" in result && result.sent);
  assert.equal(sent.length, 1, "exactly one worker may win the claim");
  assert.equal(mailer.sends.length, 1);
});

test("an administrator sending manually blocks the later automatic send", async () => {
  const { store, mailer, id, deps } = await setup();

  await dispatchQuotation(
    { ...deps, now: () => BEFORE_DEADLINE },
    { id, trigger: "manual", actor: "Aakash" },
  );
  const auto = await dispatchQuotation(deps, { id, trigger: "auto" });

  assert.equal(mailer.sends.length, 1);
  assert.equal("skipped" in auto && auto.skipped, "already_sent");
  assert.equal((await store.get(id))?.status, "sent");
});

test("records the failure and allows a retry that then succeeds", async () => {
  const { store, mailer, id, deps } = await setup();
  mailer.failNext = 1;

  const failed = await dispatchQuotation(deps, { id, trigger: "auto" });
  assert.equal("failed" in failed && failed.failed, true);

  const afterFailure = await store.get(id);
  assert.equal(afterFailure?.status, "failed");
  assert.equal(afterFailure?.email.state, "failed");
  assert.equal(afterFailure?.email.attempts, 1);
  assert.match(afterFailure?.email.lastError ?? "", /Provider rejected/);

  const retried = await dispatchQuotation(deps, { id, trigger: "retry", actor: "Aakash" });
  assert.equal("sent" in retried && retried.sent, true);

  const afterRetry = await store.get(id);
  assert.equal(afterRetry?.status, "sent");
  assert.equal(afterRetry?.email.attempts, 2);
  assert.equal(afterRetry?.email.lastError, null);
  assert.equal(mailer.sends.length, 1);
});

test("a retry uses a fresh idempotency key so the provider does not dedupe it away", async () => {
  const { mailer, id, deps } = await setup();
  mailer.failNext = 1;

  await dispatchQuotation(deps, { id, trigger: "auto" });
  await dispatchQuotation(deps, { id, trigger: "retry" });

  assert.equal(mailer.sends.length, 1);
  assert.match(mailer.sends[0].idempotencyKey, /:r0:a2$/);
});

test("the idempotency key is stable for a given revision and attempt", async () => {
  const { mailer, id, deps } = await setup();
  await dispatchQuotation(deps, { id, trigger: "auto" });
  assert.match(mailer.sends[0].idempotencyKey, /^qt_[0-9a-f-]+:r0:a1$/);
});

test("a quotation that no longer exists is skipped, not crashed on", async () => {
  const store = createMemoryQuotationStore();
  const result = await dispatchQuotation(
    { store, mailer: new FakeMailer(), renderPdf, now: () => AFTER_DEADLINE },
    { id: "qt_00000000-0000-0000-0000-000000000000", trigger: "auto" },
  );
  assert.equal("skipped" in result && result.skipped, "not_found");
});

/* --------------------------------------------------------------- the sweep */

test("the cron sweep sends every due quotation and leaves the rest alone", async () => {
  const store = createMemoryQuotationStore();
  const mailer = new FakeMailer();

  const due = await store.create(createInput({ createdAt: CREATED_AT }));
  const held = await store.create(createInput({ createdAt: CREATED_AT, status: "held" }));
  const cancelled = await store.create(createInput({ createdAt: CREATED_AT, status: "cancelled" }));
  const future = await store.create(createInput({ createdAt: "2026-08-29T09:09:00.000Z" }));

  const summary = await dispatchDueQuotations({
    store,
    mailer,
    renderPdf,
    now: () => AFTER_DEADLINE,
  });

  assert.equal(summary.sent, 1);
  assert.equal(summary.failed, 0);
  assert.equal(mailer.sends.length, 1);
  assert.equal((await store.get(due.id))?.status, "sent");
  assert.equal((await store.get(held.id))?.status, "held");
  assert.equal((await store.get(cancelled.id))?.status, "cancelled");
  assert.equal((await store.get(future.id))?.status, "pending_review");
});

test("running the sweep twice does not send anything twice", async () => {
  const store = createMemoryQuotationStore();
  const mailer = new FakeMailer();
  await store.create(createInput({ createdAt: CREATED_AT }));
  const deps: DispatchDeps = { store, mailer, renderPdf, now: () => AFTER_DEADLINE };

  const first = await dispatchDueQuotations(deps);
  const second = await dispatchDueQuotations(deps);

  assert.equal(first.sent, 1);
  assert.equal(second.examined, 0, "a sent quotation leaves the due queue");
  assert.equal(mailer.sends.length, 1);
});
