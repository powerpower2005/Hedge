import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterPickRangeBars,
  filterDetailTradingBars,
  pickRangeStartDate,
} from "./chartBars.js";

describe("pickRangeStartDate", () => {
  it("prefers close_session_date", () => {
    assert.equal(
      pickRangeStartDate({ entry: { date: "2026-06-27", close_session_date: "2026-06-26" } }),
      "2026-06-26",
    );
  });
});

describe("filterPickRangeBars", () => {
  const bars = [
    { date: "2026-06-25", open: 1, high: 1, low: 1, close: 1 },
    { date: "2026-06-26", open: 1, high: 1, low: 1, close: 1 },
  ];

  it("falls back when entry date is ahead of the last synced bar", () => {
    const pick = { entry: { date: "2026-06-27" }, created_at: "2026-06-25T00:00:00Z" };
    assert.equal(filterPickRangeBars(bars, pick).length, 2);
    assert.equal(filterDetailTradingBars(bars).length, 2);
  });

  it("does not return full instrument history during sync lag", () => {
    const longBars = [];
    const start = new Date("2025-01-02T00:00:00Z");
    for (let i = 0; i < 248; i += 1) {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + i);
      longBars.push({
        date: d.toISOString().slice(0, 10),
        open: 1,
        high: 1,
        low: 1,
        close: 1,
      });
    }
    longBars.push(
      { date: "2026-06-25", open: 1, high: 1, low: 1, close: 1 },
      { date: "2026-06-26", open: 1, high: 1, low: 1, close: 1 },
    );
    const pick = { entry: { date: "2026-06-27" }, created_at: "2026-06-25T00:00:00Z" };
    assert.equal(filterPickRangeBars(longBars, pick).length, 2);
  });

  it("filters from close_session_date when set", () => {
    const pick = { entry: { date: "2026-06-27", close_session_date: "2026-06-26" } };
    assert.deepEqual(filterPickRangeBars(bars, pick).map((b) => b.date), ["2026-06-26"]);
  });

  it("filters from entry date when bars exist on or after it", () => {
    const pick = { entry: { date: "2026-06-25" } };
    assert.equal(filterPickRangeBars(bars, pick).length, 2);
  });
});
