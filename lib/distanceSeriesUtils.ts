export type DistanceGranularity = "month" | "week" | "day" | "activity";

export type DistancePoint = {
  start: string;
  end?: string;
  valueKm: number;
  label: string;
};

export type DistanceQueryState = {
  granularity: DistanceGranularity;
  month?: string;
  weekStart?: string;
  day?: string;
};

export function buildDistanceCacheKey(userId: string, state: DistanceQueryState) {
  return JSON.stringify({ userId, ...state });
}

export function toMonthKey(dateIso: string) {
  const d = new Date(dateIso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function startOfIsoWeek(dateIso: string) {
  const d = new Date(dateIso);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function nextStateFromPoint(current: DistanceQueryState, point: DistancePoint): DistanceQueryState {
  if (current.granularity === "month") {
    return {
      granularity: "week",
      month: toMonthKey(point.start)
    };
  }

  if (current.granularity === "week") {
    return {
      granularity: "day",
      weekStart: point.start.slice(0, 10)
    };
  }

  if (current.granularity === "day") {
    return {
      granularity: "activity",
      day: point.start.slice(0, 10)
    };
  }

  return current;
}

export function backState(current: DistanceQueryState): DistanceQueryState {
  if (current.granularity === "activity" && current.day) {
    return {
      granularity: "day",
      weekStart: startOfIsoWeek(current.day)
    };
  }

  if (current.granularity === "day" && current.weekStart) {
    return {
      granularity: "week",
      month: toMonthKey(current.weekStart)
    };
  }

  if (current.granularity === "week") {
    return { granularity: "month" };
  }

  return current;
}

export function shiftRange(current: DistanceQueryState, direction: -1 | 1): DistanceQueryState {
  if (current.granularity === "week" && current.month) {
    const [year, month] = current.month.split("-").map(Number);
    const next = new Date(Date.UTC(year, month - 1 + direction, 1));
    return {
      granularity: "week",
      month: `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`
    };
  }

  if (current.granularity === "day" && current.weekStart) {
    const date = new Date(`${current.weekStart}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + direction * 7);
    return {
      granularity: "day",
      weekStart: date.toISOString().slice(0, 10)
    };
  }

  if (current.granularity === "activity" && current.day) {
    const date = new Date(`${current.day}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + direction);
    return {
      granularity: "activity",
      day: date.toISOString().slice(0, 10)
    };
  }

  return current;
}

export function formatTimeClock(totalSeconds: number) {
  const secs = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatPaceFromSeconds(totalSeconds: number, distanceMeters: number, unit: "km" | "mi" = "km") {
  if (distanceMeters <= 0 || totalSeconds <= 0) return "--";
  const metersPerUnit = unit === "mi" ? 1609.344 : 1000;
  const paceSeconds = totalSeconds / (distanceMeters / metersPerUnit);
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}/${unit}`;
}

export function formatDistanceTick(km: number) {
  return `${Math.round(km)} km`;
}
