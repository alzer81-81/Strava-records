import assert from "node:assert/strict";
import test from "node:test";
import {
  backState,
  buildDistanceCacheKey,
  formatPaceFromSeconds,
  formatTimeClock,
  nextStateFromPoint,
  type DistancePoint
} from "./distanceSeriesUtils";

test("granularity transitions drill down correctly", () => {
  const point: DistancePoint = {
    start: "2026-01-06T00:00:00.000Z",
    valueKm: 20,
    label: "Week 1"
  };

  const monthToWeek = nextStateFromPoint({ granularity: "month" }, point);
  assert.equal(monthToWeek.granularity, "week");
  assert.equal(monthToWeek.month, "2026-01");

  const weekToDay = nextStateFromPoint({ granularity: "week", month: "2026-01" }, point);
  assert.equal(weekToDay.granularity, "day");
  assert.equal(weekToDay.weekStart, "2026-01-06");
});

test("cache key is stable for same input", () => {
  const keyA = buildDistanceCacheKey("u1", { granularity: "week", month: "2026-01" });
  const keyB = buildDistanceCacheKey("u1", { granularity: "week", month: "2026-01" });
  assert.equal(keyA, keyB);
});

test("back transitions are consistent", () => {
  const next = backState({ granularity: "activity", day: "2026-01-16" });
  assert.equal(next.granularity, "day");
  assert.equal(next.weekStart, "2026-01-12");
});

test("label formatters output expected values", () => {
  assert.equal(formatTimeClock(95), "1:35");
  assert.equal(formatTimeClock(3672), "1:01:12");
  assert.equal(formatPaceFromSeconds(1500, 5000, "km"), "5:00/km");
  assert.equal(formatPaceFromSeconds(1500, 5000, "mi"), "8:03/mi");
});
