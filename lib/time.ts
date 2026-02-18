import { addDays, endOfMonth, endOfYear, startOfMonth, startOfWeek, startOfYear, subMonths } from "./timeUtils";

export type WindowType = "WEEK" | "MONTH" | "LAST_2M" | "LAST_6M" | "LAST_365" | "YEAR" | "LAST_YEAR" | "ALL_TIME";

type Range = { start: Date; end: Date; key: string };

export function getWindowRange(type: WindowType, now: Date, tzOffsetMinutes = 0): Range {
  // TODO: Prefer athlete timezone offset from Strava profile once stored on user.
  const local = shiftByMinutes(now, tzOffsetMinutes);

  switch (type) {
    case "WEEK": {
      const start = startOfWeek(local);
      const end = addDays(start, 7);
      return { start: unshiftByMinutes(start, tzOffsetMinutes), end: unshiftByMinutes(end, tzOffsetMinutes), key: weekKey(start) };
    }
    case "MONTH": {
      const start = startOfMonth(local);
      const end = endOfMonth(local);
      const endExclusive = addDays(end, 1);
      return { start: unshiftByMinutes(start, tzOffsetMinutes), end: unshiftByMinutes(endExclusive, tzOffsetMinutes), key: monthKey(start) };
    }
    case "LAST_2M": {
      const start = startOfMonth(subMonths(local, 1));
      const end = endOfMonth(local);
      const endExclusive = addDays(end, 1);
      return { start: unshiftByMinutes(start, tzOffsetMinutes), end: unshiftByMinutes(endExclusive, tzOffsetMinutes), key: `rolling-2m-${monthKey(start)}` };
    }
    case "LAST_6M": {
      const start = startOfMonth(subMonths(local, 5));
      const end = endOfMonth(local);
      const endExclusive = addDays(end, 1);
      return { start: unshiftByMinutes(start, tzOffsetMinutes), end: unshiftByMinutes(endExclusive, tzOffsetMinutes), key: `rolling-6m-${monthKey(start)}` };
    }
    case "LAST_365": {
      const start = new Date(local);
      start.setDate(start.getDate() - 364);
      start.setHours(0, 0, 0, 0);
      const end = addDays(local, 1);
      return {
        start: unshiftByMinutes(start, tzOffsetMinutes),
        end: unshiftByMinutes(end, tzOffsetMinutes),
        key: `rolling-365d-${start.toISOString().slice(0, 10)}`
      };
    }
    case "YEAR": {
      const start = startOfYear(local);
      const end = endOfYear(local);
      const endExclusive = addDays(end, 1);
      return { start: unshiftByMinutes(start, tzOffsetMinutes), end: unshiftByMinutes(endExclusive, tzOffsetMinutes), key: `${start.getFullYear()}` };
    }
    case "LAST_YEAR": {
      const lastYearDate = new Date(local);
      lastYearDate.setFullYear(lastYearDate.getFullYear() - 1);
      const start = startOfYear(lastYearDate);
      const end = endOfYear(lastYearDate);
      const endExclusive = addDays(end, 1);
      return { start: unshiftByMinutes(start, tzOffsetMinutes), end: unshiftByMinutes(endExclusive, tzOffsetMinutes), key: `${start.getFullYear()}` };
    }
    case "ALL_TIME": {
      const start = new Date(0);
      const end = addDays(local, 1);
      return { start, end: unshiftByMinutes(end, tzOffsetMinutes), key: "all-time" };
    }
  }
}

export function getRollingRange(days: number, now: Date) {
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return { start, end: now, key: `rolling-${days}d` };
}

function shiftByMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function unshiftByMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() - minutes * 60 * 1000);
}

function monthKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function weekKey(date: Date) {
  const weekStart = startOfWeek(date);
  const month = String(weekStart.getMonth() + 1).padStart(2, "0");
  const day = String(weekStart.getDate()).padStart(2, "0");
  return `${weekStart.getFullYear()}-${month}-${day}`;
}
