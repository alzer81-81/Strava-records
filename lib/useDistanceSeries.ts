"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  backState,
  buildDistanceCacheKey,
  nextStateFromPoint,
  shiftRange,
  type DistancePoint,
  type DistanceQueryState
} from "./distanceSeriesUtils";

type Status = "idle" | "loading" | "ready" | "error";

type SeriesResponse = {
  points: DistancePoint[];
};

export type Breadcrumb = {
  key: "month" | "week" | "day" | "activity";
  label: string;
  state: DistanceQueryState;
};

export function useDistanceSeries(userId: string) {
  const [state, setState] = useState<DistanceQueryState>({ granularity: "month" });
  const [points, setPoints] = useState<DistancePoint[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, DistancePoint[]>>(new Map());

  const fetchSeries = useCallback(async (query: DistanceQueryState) => {
    const cacheKey = buildDistanceCacheKey(userId, query);
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setPoints(cached);
      setStatus("ready");
      return;
    }

    setStatus("loading");
    setError(null);

    const params = new URLSearchParams({ userId, granularity: query.granularity });
    if (query.month) params.set("month", query.month);
    if (query.weekStart) params.set("weekStart", query.weekStart);
    if (query.day) params.set("day", query.day);

    try {
      const res = await fetch(`/api/distance?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const payload = (await res.json()) as SeriesResponse;
      cacheRef.current.set(cacheKey, payload.points);
      setPoints(payload.points);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unable to load distance data");
    }
  }, [userId]);

  useEffect(() => {
    void fetchSeries(state);
  }, [state, fetchSeries]);

  const drillDown = useCallback((point: DistancePoint) => {
    setState((current) => nextStateFromPoint(current, point));
  }, []);

  const goBackTo = useCallback((target: DistanceQueryState) => {
    setState(target);
  }, []);

  const goUp = useCallback(() => {
    setState((current) => backState(current));
  }, []);

  const stepRange = useCallback((direction: -1 | 1) => {
    setState((current) => shiftRange(current, direction));
  }, []);

  const breadcrumbs = useMemo<Breadcrumb[]>(() => {
    const list: Breadcrumb[] = [
      { key: "month", label: "All time", state: { granularity: "month" } }
    ];

    if (state.month) {
      list.push({
        key: "week",
        label: formatMonthLabel(state.month),
        state: { granularity: "week", month: state.month }
      });
    }

    if (state.weekStart) {
      list.push({
        key: "day",
        label: `Week of ${formatShortDate(state.weekStart)}`,
        state: { granularity: "day", weekStart: state.weekStart }
      });
    }

    if (state.day) {
      list.push({
        key: "activity",
        label: formatShortDate(state.day),
        state: { granularity: "activity", day: state.day }
      });
    }

    return list;
  }, [state]);

  return {
    state,
    points,
    status,
    error,
    breadcrumbs,
    drillDown,
    goBackTo,
    goUp,
    stepRange,
    canStep: state.granularity !== "month"
  };
}

function formatMonthLabel(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthIndex - 1, 1));
  return new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(date);
}

function formatShortDate(day: string) {
  const date = new Date(`${day}T00:00:00.000Z`);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}
