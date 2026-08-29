import test from "node:test";
import assert from "node:assert/strict";
import {
  createMemoryQuotationStore,
  formatQuotationNumber,
  isQuotationId,
} from "../src/lib/quotation/store.ts";
import { DEFAULT_PRICING_CONFIG } from "../src/lib/quotation/pricing-config.ts";
import { createInput } from "./helpers/fixtures.ts";

test("issues sequential, human-readable quotation numbers", async () => {
  const store = createMemoryQuotationStore();

  const first = await store.create(createInput());
  const second = await store.create(createInput());
  const third = await store.create(createInput());

  assert.equal(first.number, "VZQ-2026-0001");
  assert.equal(second.number, "VZQ-2026-0002");
  assert.equal(third.number, "VZQ-2026-0003");
});

test("numbers restart per calendar year", async () => {
  const store = createMemoryQuotationStore();
  await store.create(createInput({ createdAt: "2026-12-31T18:00:00.000Z" }));
  const next = await store.create(createInput({ createdAt: "2027-01-01T04:00:00.000Z" }));
  assert.equal(next.number, "VZQ-2027-0001");
});

test("pads the sequence to four digits", () => {
  assert.equal(formatQuotationNumber(2026, 1), "VZQ-2026-0001");
  assert.equal(formatQuotationNumber(2026, 42), "VZQ-2026-0042");
  assert.equal(formatQuotationNumber(2026, 12_345), "VZQ-2026-12345");
});

test("assigns a unique id and stamps timestamps", async () => {
  const store = createMemoryQuotationStore();
  const first = await store.create(createInput());
  const second = await store.create(createInput());

  assert.notEqual(first.id, second.id);
  assert.ok(isQuotationId(first.id));
  assert.equal(first.createdAt, first.updatedAt);
});

test("rejects ids that do not match the storage key format", () => {
  assert.equal(isQuotationId("qt_11111111-2222-3333-4444-555555555555"), true);
  assert.equal(isQuotationId("../../etc/passwd"), false);
  assert.equal(isQuotationId("qt_short"), false);
  assert.equal(isQuotationId(""), false);
});

test("does not read or write through an invalid id", async () => {
  const store = createMemoryQuotationStore();
  assert.equal(await store.get("../secrets"), null);
  assert.equal(await store.update("../secrets", (record) => record), null);
});

test("returns a copy, so a caller cannot mutate stored state by reference", async () => {
  const store = createMemoryQuotationStore();
  const created = await store.create(createInput());

  const loaded = await store.get(created.id);
  assert.ok(loaded);
  loaded.status = "cancelled";
  loaded.document.totals.total = 1;

  const reloaded = await store.get(created.id);
  assert.equal(reloaded?.status, "pending_review");
  assert.notEqual(reloaded?.document.totals.total, 1);
});

test("update runs the mutator on the freshest record and refreshes updatedAt", async () => {
  const store = createMemoryQuotationStore();
  const created = await store.create(createInput());

  const updated = await store.update(created.id, (record) => ({
    ...record,
    adminNotes: "Reviewed by Aakash",
  }));

  assert.equal(updated?.adminNotes, "Reviewed by Aakash");
  assert.ok(new Date(updated!.updatedAt).getTime() >= new Date(created.updatedAt).getTime());
});

test("a mutator returning null aborts the write", async () => {
  const store = createMemoryQuotationStore();
  const created = await store.create(createInput({ adminNotes: "original" }));

  const result = await store.update(created.id, () => null);
  assert.equal(result, null);
  assert.equal((await store.get(created.id))?.adminNotes, "original");
});

test("lists quotations newest first", async () => {
  const store = createMemoryQuotationStore();
  const older = await store.create(createInput({ createdAt: "2026-08-01T10:00:00.000Z" }));
  const newer = await store.create(createInput({ createdAt: "2026-08-20T10:00:00.000Z" }));

  const listed = await store.list();
  assert.deepEqual(
    listed.map((record) => record.id),
    [newer.id, older.id],
  );
});

test("dueForDispatch only returns records past their deadline that may still send", async () => {
  const store = createMemoryQuotationStore();
  const past = "2026-08-29T09:00:00.000Z";
  const cutoff = new Date("2026-08-29T09:20:00.000Z").getTime();

  const due = await store.create(createInput({ createdAt: past }));
  const held = await store.create(createInput({ createdAt: past, status: "held" }));
  const cancelled = await store.create(createInput({ createdAt: past, status: "cancelled" }));
  const sent = await store.create(createInput({ createdAt: past, status: "sent" }));
  const future = await store.create(createInput({ createdAt: "2026-08-29T09:19:00.000Z" }));

  const ids = (await store.dueForDispatch(cutoff)).map((record) => record.id);

  assert.deepEqual(ids, [due.id]);
  for (const excluded of [held.id, cancelled.id, sent.id, future.id]) {
    assert.equal(ids.includes(excluded), false);
  }
});

test("a record leaves the due queue as soon as it is held", async () => {
  const store = createMemoryQuotationStore();
  const created = await store.create(createInput({ createdAt: "2026-08-29T09:00:00.000Z" }));
  const cutoff = new Date("2026-08-29T09:20:00.000Z").getTime();

  assert.equal((await store.dueForDispatch(cutoff)).length, 1);
  await store.update(created.id, (record) => ({ ...record, status: "held" }));
  assert.equal((await store.dueForDispatch(cutoff)).length, 0);
});

test("serves the default rate card until one is stored, then the stored one", async () => {
  const store = createMemoryQuotationStore();
  assert.deepEqual(await store.getPricingConfig(), DEFAULT_PRICING_CONFIG);

  const saved = await store.savePricingConfig({
    ...DEFAULT_PRICING_CONFIG,
    taxPct: 0.15,
  });

  assert.equal(saved.taxPct, 0.15);
  assert.equal(saved.version, DEFAULT_PRICING_CONFIG.version + 1, "saving bumps the version");
  assert.equal((await store.getPricingConfig()).taxPct, 0.15);
});

test("rate limiting counts hits per bucket within the window", async () => {
  const store = createMemoryQuotationStore();

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    assert.equal(await store.isRateLimited("submit:1.2.3.4", 3, 900), false, `hit ${attempt}`);
  }
  assert.equal(await store.isRateLimited("submit:1.2.3.4", 3, 900), true);
  // A different client is unaffected.
  assert.equal(await store.isRateLimited("submit:5.6.7.8", 3, 900), false);
});
