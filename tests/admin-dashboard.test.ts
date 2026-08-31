/**
 * Dashboard aggregation: the action queue and the business KPIs.
 *
 * These decide what an administrator sees first thing in the morning, so the
 * ordering rules and the range arithmetic are pinned down here rather than
 * eyeballed in the browser.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  buildActionCentre,
  buildKpis,
  compactMoney,
  formatDuration,
  groupActionItems,
  resolveRange,
  LEAD_FOLLOW_UP_DAYS,
} from "../src/lib/admin/dashboard.ts";
import { normalizeConfidence } from "../src/lib/quotation/confidence.ts";
import type { Lead, LeadStatus } from "../src/lib/admin/types.ts";
import type { QuotationRecord } from "../src/lib/quotation/types.ts";
import { clearedConfidence, record } from "./helpers/fixtures.ts";

const NOW = new Date("2026-08-29T12:00:00.000Z");
const NOW_MS = NOW.getTime();

function daysAgo(days: number): string {
  return new Date(NOW_MS - days * 86_400_000).toISOString();
}

function minutesFromNow(minutes: number): string {
  return new Date(NOW_MS + minutes * 60_000).toISOString();
}

function lead(overrides: Partial<Lead> = {}): Lead {
  const createdAt = overrides.createdAt ?? daysAgo(1);
  return {
    id: `ld_${Math.random().toString(36).slice(2, 10)}`,
    name: "Dilani Perera",
    email: "dilani@example.lk",
    company: "Ceylon Retail",
    projectType: "POS system",
    budget: "1m_2_5m",
    message: "We need a POS for twelve branches.",
    status: "new",
    assigneeId: null,
    notes: [],
    source: "Contact page",
    createdAt,
    updatedAt: overrides.updatedAt ?? createdAt,
    ...overrides,
  };
}

/** A quotation fixture anchored to the dashboard's fixed clock. */
function quotation(overrides: Partial<QuotationRecord> = {}): QuotationRecord {
  const createdAt = overrides.createdAt ?? daysAgo(1);
  return record({
    createdAt,
    updatedAt: createdAt,
    reviewDeadline: new Date(new Date(createdAt).getTime() + 10 * 60_000).toISOString(),
    ...overrides,
  });
}

/* --------------------------------------------------------- action centre */

test("a failed delivery outranks everything else in the queue", () => {
  const items = buildActionCentre(
    [lead()],
    [
      quotation({ id: "qt_a", status: "failed" }),
      quotation({ id: "qt_b", confidence: normalizeConfidence({ autoSend: false }) }),
    ],
    NOW_MS,
  );

  assert.equal(items[0].kind, "quotation_failed");
  assert.equal(items[0].severity, "critical");
  assert.deepEqual(items[0].verbs, ["review", "retry"]);
});

test("a withheld quotation is queued for approval with its reason", () => {
  const withheld = quotation({
    confidence: normalizeConfidence({
      autoSend: false,
      reviewReason: "Estimate is above the value ceiling for automatic sending.",
    }),
  });
  const [item] = buildActionCentre([], [withheld], NOW_MS);

  assert.equal(item.kind, "quotation_approval");
  assert.match(item.reason, /value ceiling/);
  assert.deepEqual(item.verbs, ["review", "approve", "hold"]);
  // Nothing is counting down; it waits indefinitely.
  assert.equal(item.deadline, null);
});

test("a cleared quotation only appears once its send is imminent", () => {
  const far = quotation({
    createdAt: NOW.toISOString(),
    reviewDeadline: minutesFromNow(45),
    confidence: clearedConfidence(),
  });
  assert.deepEqual(buildActionCentre([], [far], NOW_MS), []);

  const soon = quotation({ reviewDeadline: minutesFromNow(4), confidence: clearedConfidence() });
  const [item] = buildActionCentre([], [soon], NOW_MS);
  assert.equal(item.kind, "quotation_sending_soon");
  assert.equal(item.deadline, soon.reviewDeadline);
  assert.deepEqual(item.verbs, ["review", "hold", "send"]);
});

test("an overdue quotation still counts as sending soon", () => {
  const overdue = quotation({
    reviewDeadline: minutesFromNow(-30),
    confidence: clearedConfidence(),
  });
  const [item] = buildActionCentre([], [overdue], NOW_MS);
  assert.equal(item.kind, "quotation_sending_soon");
});

test("a sent, held or cancelled quotation is not queued", () => {
  for (const status of ["sent", "held", "cancelled", "sending"] as const) {
    const quiet = quotation({ status, confidence: clearedConfidence() });
    assert.deepEqual(buildActionCentre([], [quiet], NOW_MS), [], status);
  }
});

test("each quotation contributes at most one row", () => {
  // Withheld *and* past its deadline: the approval is the actionable fact.
  const both = quotation({
    reviewDeadline: minutesFromNow(-5),
    confidence: normalizeConfidence({ autoSend: false }),
  });
  const items = buildActionCentre([], [both], NOW_MS);
  assert.equal(items.length, 1);
  assert.equal(items[0].kind, "quotation_approval");
});

test("new leads are queued only while nobody owns them", () => {
  const unowned = lead({ status: "new", assigneeId: null });
  const owned = lead({ status: "new", assigneeId: "u_aakash" });

  const items = buildActionCentre([unowned, owned], [], NOW_MS);
  assert.equal(items.length, 1);
  assert.equal(items[0].kind, "lead_unassigned");
  assert.deepEqual(items[0].verbs, ["review", "assign"]);
});

test("a lead in progress is queued once it goes quiet", () => {
  const fresh = lead({ status: "contacted", updatedAt: daysAgo(1) });
  assert.deepEqual(buildActionCentre([fresh], [], NOW_MS), []);

  const quiet = lead({ status: "contacted", updatedAt: daysAgo(LEAD_FOLLOW_UP_DAYS) });
  const [item] = buildActionCentre([quiet], [], NOW_MS);
  assert.equal(item.kind, "lead_stale");
  assert.match(item.reason, new RegExp(`${LEAD_FOLLOW_UP_DAYS} days`));
});

test("closed leads are never chased", () => {
  for (const status of ["won", "lost"] as LeadStatus[]) {
    const closed = lead({ status, updatedAt: daysAgo(90) });
    assert.deepEqual(buildActionCentre([closed], [], NOW_MS), [], status);
  }
});

test("the queue is ordered by severity, then by how long it has waited", () => {
  const items = buildActionCentre(
    [lead({ id: "ld_new", status: "new", assigneeId: null, createdAt: daysAgo(1) })],
    [
      quotation({ id: "qt_recent", confidence: normalizeConfidence({ autoSend: false }) }),
      quotation({
        id: "qt_old",
        createdAt: daysAgo(9),
        confidence: normalizeConfidence({ autoSend: false }),
      }),
      quotation({ id: "qt_failed", status: "failed" }),
    ],
    NOW_MS,
  );

  assert.deepEqual(
    items.map((item) => item.kind),
    [
      "quotation_failed",
      "quotation_approval",
      "quotation_approval",
      "lead_unassigned",
    ],
  );
  // Oldest first inside the approval group: it has been waiting longest.
  assert.equal(items[1].targetId, "qt_old");
});

test("grouping keeps the urgency order and drops empty groups", () => {
  const groups = groupActionItems(
    buildActionCentre(
      [lead({ status: "new", assigneeId: null })],
      [quotation({ status: "failed" })],
      NOW_MS,
    ),
  );
  assert.deepEqual(
    groups.map((group) => group.kind),
    ["quotation_failed", "lead_unassigned"],
  );
});

/* ------------------------------------------------------------ date range */

test("range presets cover whole days up to the end of today", () => {
  const range = resolveRange({ range: "7d" }, NOW);
  assert.equal(range.days, 7);
  assert.equal(range.to, "2026-08-30T00:00:00.000Z");
  assert.equal(range.from, "2026-08-23T00:00:00.000Z");
});

test("an unknown or missing range falls back to thirty days", () => {
  for (const value of [undefined, "", "all-time", "7", "<script>"]) {
    assert.equal(resolveRange({ range: value }, NOW).key, "30d", String(value));
  }
});

test("a custom range is inclusive of its end day", () => {
  const range = resolveRange({ range: "custom", from: "2026-08-01", to: "2026-08-07" }, NOW);
  assert.equal(range.key, "custom");
  assert.equal(range.from, "2026-08-01T00:00:00.000Z");
  assert.equal(range.to, "2026-08-08T00:00:00.000Z");
  assert.equal(range.days, 7);
});

test("a malformed or inverted custom range falls back rather than erroring", () => {
  const cases = [
    { range: "custom", from: "not-a-date", to: "2026-08-07" },
    { range: "custom", from: "2026-08-07", to: "2026-08-01" },
    { range: "custom", from: "2026-08-01" },
    { range: "custom", from: "1900-01-01", to: "2026-08-01" },
  ];
  for (const params of cases) {
    assert.equal(resolveRange(params, NOW).key, "30d", JSON.stringify(params));
  }
});

/* ------------------------------------------------------------------ KPIs */

test("KPIs count only what falls inside the range", () => {
  const range = resolveRange({ range: "7d" }, NOW);
  const kpis = buildKpis(
    [lead({ createdAt: daysAgo(2) }), lead({ createdAt: daysAgo(40) })],
    [],
    range,
  );
  assert.equal(kpis.newLeads, 1);
});

test("sent quotations are counted by their send date, not their creation date", () => {
  const range = resolveRange({ range: "7d" }, NOW);
  const sentInside = quotation({
    id: "qt_1",
    createdAt: daysAgo(40),
    status: "sent",
    sentAt: daysAgo(2),
  });
  const sentOutside = quotation({
    id: "qt_2",
    createdAt: daysAgo(40),
    status: "sent",
    sentAt: daysAgo(30),
  });

  const kpis = buildKpis([], [sentInside, sentOutside], range);
  assert.equal(kpis.quotationsSent, 1);
  // Neither was raised in the range, so the average is not distorted by them.
  assert.equal(kpis.quotationsRaised, 0);
  assert.equal(kpis.averageValue, 0);
});

test("pending value is a snapshot of the whole pipeline, not the range", () => {
  const range = resolveRange({ range: "7d" }, NOW);
  const old = quotation({ id: "qt_old", createdAt: daysAgo(60), status: "pending_review" });
  const held = quotation({ id: "qt_held", createdAt: daysAgo(2), status: "held" });
  const sent = quotation({ id: "qt_sent", createdAt: daysAgo(2), status: "sent" });

  const kpis = buildKpis([], [old, held, sent], range);
  assert.equal(kpis.pendingCount, 2);
  assert.equal(
    kpis.pendingValue,
    old.document.totals.total + held.document.totals.total,
  );
});

test("conversion joins leads to quotations on email, case-insensitively", () => {
  const range = resolveRange({ range: "7d" }, NOW);
  const converted = lead({ id: "ld_1", email: "Dilani@Example.LK", createdAt: daysAgo(1) });
  const notConverted = lead({ id: "ld_2", email: "other@example.lk", createdAt: daysAgo(1) });
  const estimate = quotation({
    requirements: { ...quotation().requirements, email: "dilani@example.lk" },
  });

  const kpis = buildKpis([converted, notConverted], [estimate], range);
  assert.equal(kpis.convertedLeads, 1);
  assert.equal(kpis.conversionPct, 50);
});

test("conversion is unavailable rather than zero when there are no leads", () => {
  const kpis = buildKpis([], [], resolveRange({ range: "7d" }, NOW));
  assert.equal(kpis.conversionPct, null);
  assert.equal(kpis.averageResponseMinutes, null);
});

test("response time measures submission to the first administrator action", () => {
  const createdAt = daysAgo(1);
  const withAdmin = quotation({
    createdAt,
    activity: [
      { id: "a1", at: createdAt, actor: "Sahan Perera", action: "submitted" },
      {
        id: "a2",
        at: new Date(new Date(createdAt).getTime() + 90 * 60_000).toISOString(),
        actor: "System (confidence rules)",
        action: "held_for_approval",
      },
      {
        id: "a3",
        at: new Date(new Date(createdAt).getTime() + 120 * 60_000).toISOString(),
        actor: "Aakash",
        action: "status_approved",
      },
    ],
  });

  const kpis = buildKpis([], [withAdmin], resolveRange({ range: "7d" }, NOW));
  // The customer's own entry and the worker's are both ignored.
  assert.equal(kpis.averageResponseMinutes, 120);
  assert.equal(kpis.respondedCount, 1);
});

test("quotations nobody has touched are left out of the response average", () => {
  const createdAt = daysAgo(1);
  const untouched = quotation({
    createdAt,
    activity: [{ id: "a1", at: createdAt, actor: "Sahan Perera", action: "submitted" }],
  });
  const kpis = buildKpis([], [untouched], resolveRange({ range: "7d" }, NOW));
  assert.equal(kpis.averageResponseMinutes, null);
  assert.equal(kpis.respondedCount, 0);
});

/* ------------------------------------------------------------ formatting */

test("money is compacted for a tile without losing the currency", () => {
  assert.equal(compactMoney(1_887_500, "LKR"), "LKR 1.9M");
  assert.equal(compactMoney(24_000_000, "LKR"), "LKR 24M");
  assert.equal(compactMoney(240_000, "LKR"), "LKR 240k");
  assert.equal(compactMoney(950, "LKR"), "LKR 950");
  assert.equal(compactMoney(0, "LKR"), "LKR 0");
});

test("durations read naturally at every scale", () => {
  assert.equal(formatDuration(4), "4m");
  assert.equal(formatDuration(130), "2h 10m");
  assert.equal(formatDuration(120), "2h");
  assert.equal(formatDuration(60 * 24 * 3), "3d");
  assert.equal(formatDuration(60 * 24 * 3 + 120), "3d 2h");
});
