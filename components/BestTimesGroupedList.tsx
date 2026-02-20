"use client";

import { useMemo } from "react";

export type KnownDistanceKey =
  | "400m"
  | "1k"
  | "half_mile"
  | "1_mile"
  | "2_mile"
  | "5k"
  | "10k"
  | "15k"
  | "10_mile"
  | "half_marathon"
  | "marathon";

export type PRRecord = {
  id: string;
  distanceKey: KnownDistanceKey | (string & {});
  distanceLabel: string;
  distanceMeters: number;
  bestTimeSeconds: number | null;
  activityId?: string;
  achievedAt?: string;
};

export function BestTimesGroupedList({
  records,
  distanceUnit = "km"
}: {
  records: PRRecord[];
  distanceUnit?: "km" | "mi";
}) {
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => a.distanceMeters - b.distanceMeters),
    [records]
  );

  return (
    <section aria-labelledby="best-times-title">
      <div className="flex items-center justify-between gap-3">
        <h3 id="best-times-title" className="pt-5 font-[var(--font-fraunces)] text-2xl font-bold tracking-tight text-black">
          Best Times
        </h3>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-black/10 bg-white shadow-card">
        <div className="overflow-x-auto">
          <div className={`hidden min-w-[760px] border-b border-black/10 bg-slate-50/70 px-4 py-3 md:grid ${DESKTOP_GRID} md:items-center md:gap-4`}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Distance</p>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Time</p>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Pace</p>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Achieved</p>
            <p className="text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-600"> </p>
          </div>

          <ul className="divide-y divide-black/10" role="list" aria-label="Personal records by distance">
            {sortedRecords.map((row) => (
              <BestTimesRow
                key={row.id}
                row={row}
                distanceUnit={distanceUnit}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function BestTimesRow({
  row,
  distanceUnit
}: {
  row: PRRecord;
  distanceUnit: "km" | "mi";
}) {
  const pace = row.bestTimeSeconds ? formatPace(row.bestTimeSeconds, row.distanceMeters, distanceUnit) : "-";
  const achievedOn = row.achievedAt ? formatAchievedDate(row.achievedAt) : "-";

  if (row.activityId && row.bestTimeSeconds !== null) {
    return (
      <li>
        <a
          href={`https://www.strava.com/activities/${row.activityId}`}
          target="_blank"
          rel="noreferrer"
          className="group block px-4 py-3 transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FC5200]"
          aria-label={`${row.distanceLabel} best time ${formatClockTime(row.bestTimeSeconds)}. View on Strava in new tab.`}
        >
          <div className="flex items-center justify-between gap-3 md:hidden">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">PR Entry</p>
            <span className="text-slate-400">
              <ChevronRightIcon />
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-3 md:hidden">
            <MobileMetric label="Distance" value={row.distanceLabel} />
            <MobileMetric label="Time" value={formatClockTime(row.bestTimeSeconds)} tabular />
            <MobileMetric label="Pace" value={pace} tabular />
            <MobileMetric label="Achieved" value={achievedOn} />
          </div>

          <div className={`mt-3 hidden min-w-[760px] md:grid ${DESKTOP_GRID} md:items-center md:gap-4`}>
            <p className="text-sm font-medium text-slate-700 md:whitespace-nowrap">{row.distanceLabel}</p>
            <p className="tabular-nums text-sm font-medium text-slate-700 md:whitespace-nowrap">{formatClockTime(row.bestTimeSeconds)}</p>
            <p className="tabular-nums text-sm font-medium text-slate-700 md:whitespace-nowrap">{pace}</p>
            <p className="text-sm font-medium text-slate-700 md:whitespace-nowrap">{achievedOn}</p>
            <span className="justify-self-end text-slate-400">
              <ChevronRightIcon />
            </span>
          </div>
        </a>
      </li>
    );
  }

  return (
    <li className="px-4 py-3">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 md:hidden">
        <MobileMetric label="Distance" value={row.distanceLabel} />
        <MobileMetric label="Time" value="No record yet" />
        <MobileMetric label="Pace" value="-" />
        <MobileMetric label="Achieved" value="-" />
      </div>
      <div className={`mt-2 hidden min-w-[760px] md:grid ${DESKTOP_GRID} md:items-center md:gap-4`}>
        <p className="text-sm font-medium text-slate-700">{row.distanceLabel}</p>
        <p className="text-sm font-medium text-slate-700">No record yet</p>
        <p className="text-sm font-medium text-slate-500">-</p>
        <p className="text-sm text-slate-500">-</p>
        <span className="justify-self-end text-slate-300">
          <ChevronRightIcon />
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">Log a run to set this PR.</p>
    </li>
  );
}

const DESKTOP_GRID =
  "md:grid-cols-[minmax(120px,1.1fr)_minmax(92px,1fr)_minmax(120px,1.2fr)_minmax(120px,1fr)_28px]";

function MobileMetric({
  label,
  value,
  tabular = false
}: {
  label: string;
  value: string;
  tabular?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-0.5 text-sm font-medium text-slate-700 ${tabular ? "tabular-nums" : ""}`}>{value}</p>
    </div>
  );
}

function formatAchievedDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M7.5 4.5L12.5 10L7.5 15.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function formatClockTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function formatPace(totalSeconds: number, distanceMeters: number, unit: "km" | "mi" = "km") {
  if (!distanceMeters || distanceMeters <= 0) return "-";
  const metersPerUnit = unit === "mi" ? 1609.344 : 1000;
  const secondsPerUnit = totalSeconds / (distanceMeters / metersPerUnit);
  return `${formatPaceUnit(secondsPerUnit)}/${unit}`;
}

function formatPaceUnit(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (secs === 60) return `${mins + 1}:00`;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export const samplePRData: PRRecord[] = [
  {
    id: "pr-400m",
    distanceKey: "400m",
    distanceLabel: "400m",
    distanceMeters: 400,
    bestTimeSeconds: 86,
    activityId: "1234567890",
    achievedAt: "2026-01-12T08:11:00.000Z"
  },
  {
    id: "pr-1k",
    distanceKey: "1k",
    distanceLabel: "1K",
    distanceMeters: 1000,
    bestTimeSeconds: 228,
    activityId: "2234567890",
    achievedAt: "2025-10-01T06:28:00.000Z"
  },
  {
    id: "pr-half-mile",
    distanceKey: "half_mile",
    distanceLabel: "1/2 mile",
    distanceMeters: 805,
    bestTimeSeconds: null
  },
  {
    id: "pr-1-mile",
    distanceKey: "1_mile",
    distanceLabel: "1 mile",
    distanceMeters: 1609,
    bestTimeSeconds: 405,
    activityId: "3234567890"
  },
  {
    id: "pr-2-mile",
    distanceKey: "2_mile",
    distanceLabel: "2 mile",
    distanceMeters: 3219,
    bestTimeSeconds: 878,
    activityId: "4234567890",
    achievedAt: "2024-04-27T11:18:00.000Z"
  },
  {
    id: "pr-5k",
    distanceKey: "5k",
    distanceLabel: "5K",
    distanceMeters: 5000,
    bestTimeSeconds: 1196,
    activityId: "5234567890",
    achievedAt: "2023-07-14T09:04:00.000Z"
  },
  {
    id: "pr-10k",
    distanceKey: "10k",
    distanceLabel: "10K",
    distanceMeters: 10000,
    bestTimeSeconds: null
  },
  {
    id: "pr-15k",
    distanceKey: "15k",
    distanceLabel: "15K",
    distanceMeters: 15000,
    bestTimeSeconds: null
  },
  {
    id: "pr-10-mile",
    distanceKey: "10_mile",
    distanceLabel: "10 mile",
    distanceMeters: 16093,
    bestTimeSeconds: 4509,
    activityId: "6234567890"
  },
  {
    id: "pr-hm",
    distanceKey: "half_marathon",
    distanceLabel: "Half Marathon",
    distanceMeters: 21097,
    bestTimeSeconds: 6002,
    activityId: "7234567890",
    achievedAt: "2022-09-18T07:22:00.000Z"
  },
  {
    id: "pr-marathon",
    distanceKey: "marathon",
    distanceLabel: "Marathon",
    distanceMeters: 42195,
    bestTimeSeconds: null
  }
];
