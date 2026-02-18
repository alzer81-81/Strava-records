import type { DistanceGranularity, DistancePoint } from "./distanceSeriesUtils";

const monthSeries: DistancePoint[] = [
  { start: "2025-11-01T00:00:00.000Z", end: "2025-12-01T00:00:00.000Z", valueKm: 324, label: "Nov" },
  { start: "2025-12-01T00:00:00.000Z", end: "2026-01-01T00:00:00.000Z", valueKm: 295, label: "Dec" },
  { start: "2026-01-01T00:00:00.000Z", end: "2026-02-01T00:00:00.000Z", valueKm: 156, label: "Jan" },
  { start: "2026-02-01T00:00:00.000Z", end: "2026-03-01T00:00:00.000Z", valueKm: 237, label: "Feb" },
  { start: "2026-03-01T00:00:00.000Z", end: "2026-04-01T00:00:00.000Z", valueKm: 210, label: "Mar" },
  { start: "2026-04-01T00:00:00.000Z", end: "2026-05-01T00:00:00.000Z", valueKm: 166, label: "Apr" },
  { start: "2026-05-01T00:00:00.000Z", end: "2026-06-01T00:00:00.000Z", valueKm: 203, label: "May" },
  { start: "2026-06-01T00:00:00.000Z", end: "2026-07-01T00:00:00.000Z", valueKm: 224, label: "Jun" },
  { start: "2026-07-01T00:00:00.000Z", end: "2026-08-01T00:00:00.000Z", valueKm: 240, label: "Jul" },
  { start: "2026-08-01T00:00:00.000Z", end: "2026-09-01T00:00:00.000Z", valueKm: 264, label: "Aug" },
  { start: "2026-09-01T00:00:00.000Z", end: "2026-10-01T00:00:00.000Z", valueKm: 99, label: "Sep" }
];

const weekSeries: Record<string, DistancePoint[]> = {
  "2026-08": [
    { start: "2026-07-28T00:00:00.000Z", end: "2026-08-04T00:00:00.000Z", valueKm: 62, label: "Week 1" },
    { start: "2026-08-04T00:00:00.000Z", end: "2026-08-11T00:00:00.000Z", valueKm: 71, label: "Week 2" },
    { start: "2026-08-11T00:00:00.000Z", end: "2026-08-18T00:00:00.000Z", valueKm: 46, label: "Week 3" },
    { start: "2026-08-18T00:00:00.000Z", end: "2026-08-25T00:00:00.000Z", valueKm: 55, label: "Week 4" },
    { start: "2026-08-25T00:00:00.000Z", end: "2026-09-01T00:00:00.000Z", valueKm: 30, label: "Week 5" }
  ]
};

const daySeries: Record<string, DistancePoint[]> = {
  "2026-08-04": [
    { start: "2026-08-04T00:00:00.000Z", valueKm: 10.4, label: "Mon 4" },
    { start: "2026-08-05T00:00:00.000Z", valueKm: 0, label: "Tue 5" },
    { start: "2026-08-06T00:00:00.000Z", valueKm: 12.1, label: "Wed 6" },
    { start: "2026-08-07T00:00:00.000Z", valueKm: 8.6, label: "Thu 7" },
    { start: "2026-08-08T00:00:00.000Z", valueKm: 13.2, label: "Fri 8" },
    { start: "2026-08-09T00:00:00.000Z", valueKm: 14.3, label: "Sat 9" },
    { start: "2026-08-10T00:00:00.000Z", valueKm: 12.4, label: "Sun 10" }
  ]
};

const activitySeries: Record<string, DistancePoint[]> = {
  "2026-08-08": [
    { start: "2026-08-08T07:20:00.000Z", valueKm: 6.2, label: "07:20" },
    { start: "2026-08-08T18:40:00.000Z", valueKm: 7.0, label: "18:40" }
  ]
};

export function getMockDistanceSeries(granularity: DistanceGranularity, range?: string): DistancePoint[] {
  if (granularity === "month") return monthSeries;
  if (granularity === "week") return weekSeries[range ?? ""] ?? [];
  if (granularity === "day") return daySeries[range ?? ""] ?? [];
  if (granularity === "activity") return activitySeries[range ?? ""] ?? [];
  return [];
}
