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
  onAddGoal
}: {
  records: PRRecord[];
  onAddGoal?: (record: PRRecord) => void;
}) {
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => a.distanceMeters - b.distanceMeters),
    [records]
  );
  const normalization = useMemo(() => normalizeTimes(sortedRecords), [sortedRecords]);

  return (
    <section aria-labelledby="best-times-title">
      <div className="flex items-center justify-between gap-3">
        <h3 id="best-times-title" className="font-[var(--font-fraunces)] text-2xl font-bold tracking-tight text-black">
          Best Times
        </h3>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-black/10 bg-white shadow-card">
        <div className="hidden md:block">
          <table className="w-full table-fixed" aria-label="Personal records by distance">
            <thead className="border-b border-black/10 bg-slate-50/70 text-left">
              <tr>
                <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Distance
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Time
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Pace
                </th>
                <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Achieved
                </th>
                <th scope="col" className="w-12 px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                  Open
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {sortedRecords.map((row) => (
                <BestTimesTableRow
                  key={row.id}
                  row={row}
                  normalization={normalization}
                  onAddGoal={onAddGoal}
                />
              ))}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-black/10 md:hidden" role="list" aria-label="Personal records by distance">
          {sortedRecords.map((row) => (
            <BestTimesMobileRow
              key={row.id}
              row={row}
              normalization={normalization}
              onAddGoal={onAddGoal}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function BestTimesTableRow({
  row,
  normalization,
  onAddGoal
}: {
  row: PRRecord;
  normalization: { min: number; max: number } | null;
  onAddGoal?: (record: PRRecord) => void;
}) {
  const pace = row.bestTimeSeconds ? formatPace(row.bestTimeSeconds, row.distanceMeters) : "No pace yet";
  const achievedOn = row.achievedAt ? formatAchievedDate(row.achievedAt) : "-";
  const score = getScore(row.bestTimeSeconds, normalization);

  if (row.activityId && row.bestTimeSeconds !== null) {
    return (
      <tr
        tabIndex={0}
        role="link"
        onClick={() => window.open(`https://www.strava.com/activities/${row.activityId}`, "_blank", "noopener,noreferrer")}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            window.open(`https://www.strava.com/activities/${row.activityId}`, "_blank", "noopener,noreferrer");
          }
        }}
        className="group cursor-pointer transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FC5200]"
      >
        <td className="px-4 py-3 text-sm font-medium text-slate-700">{row.distanceLabel}</td>
        <td className="px-4 py-3">
          <div className="relative inline-block min-w-[7rem]">
            <div className="absolute inset-y-0 left-0 rounded-sm bg-slate-200/45" style={{ width: `${score}%` }} aria-hidden="true" />
            <span className="relative tabular-nums text-2xl font-semibold leading-none text-black">{formatClockTime(row.bestTimeSeconds)}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-slate-500">{pace}</td>
        <td className="px-4 py-3 text-sm text-slate-500">{achievedOn}</td>
        <td className="px-4 py-3 text-right text-slate-400">
          <span className="inline-flex opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <ChevronRightIcon />
          </span>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="px-4 py-3 text-sm font-medium text-slate-700">{row.distanceLabel}</td>
      <td className="px-4 py-3">
        <span className="text-sm font-medium text-slate-700">No record yet</span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-500">Log a run to set this PR.</td>
      <td className="px-4 py-3 text-sm text-slate-500">-</td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onAddGoal?.(row)}
          className="inline-flex items-center justify-center rounded-md border border-black/15 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-black/30 hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FC5200] focus-visible:ring-offset-1"
          aria-label={`Set a goal for ${row.distanceLabel}`}
        >
          Add goal
        </button>
      </td>
    </tr>
  );
}

function BestTimesMobileRow({
  row,
  normalization,
  onAddGoal
}: {
  row: PRRecord;
  normalization: { min: number; max: number } | null;
  onAddGoal?: (record: PRRecord) => void;
}) {
  const pace = row.bestTimeSeconds ? formatPace(row.bestTimeSeconds, row.distanceMeters) : "No pace yet";
  const achievedOn = row.achievedAt ? formatAchievedDate(row.achievedAt) : "-";
  const score = getScore(row.bestTimeSeconds, normalization);

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
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{row.distanceLabel}</p>
            <span className="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <ChevronRightIcon />
            </span>
          </div>
          <div className="mt-2 relative inline-block min-w-[7rem]">
            <div className="absolute inset-y-0 left-0 rounded-sm bg-slate-200/45" style={{ width: `${score}%` }} aria-hidden="true" />
            <p className="relative tabular-nums text-2xl font-semibold leading-none text-black">{formatClockTime(row.bestTimeSeconds)}</p>
          </div>
          <p className="mt-2 text-sm text-slate-500">{pace}</p>
          <p className="mt-1 text-xs text-slate-500">{achievedOn}</p>
        </a>
      </li>
    );
  }

  return (
    <li className="px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{row.distanceLabel}</p>
      <p className="mt-2 text-sm font-medium text-slate-700">No record yet</p>
      <p className="mt-1 text-xs text-slate-500">Log a run to set this PR.</p>
      <button
        type="button"
        onClick={() => onAddGoal?.(row)}
        className="mt-2 inline-flex items-center justify-center rounded-md border border-black/15 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-black/30 hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FC5200] focus-visible:ring-offset-1"
        aria-label={`Set a goal for ${row.distanceLabel}`}
      >
        Add goal
      </button>
    </li>
  );
}

function normalizeTimes(rows: PRRecord[]) {
  const values = rows
    .map((row) => row.bestTimeSeconds)
    .filter((value): value is number => value !== null);

  if (values.length === 0) return null;

  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

function getScore(bestTimeSeconds: number | null, normalization: { min: number; max: number } | null) {
  if (bestTimeSeconds === null || !normalization) return 0;
  if (normalization.min === normalization.max) return 100;
  const ratio = (normalization.max - bestTimeSeconds) / (normalization.max - normalization.min);
  return Math.round(30 + ratio * 70);
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

export function formatPace(totalSeconds: number, distanceMeters: number) {
  if (!distanceMeters || distanceMeters <= 0) return "-";
  const secondsPerKm = totalSeconds / (distanceMeters / 1000);
  const secondsPerMi = totalSeconds / (distanceMeters / 1609.344);
  return `${formatPaceUnit(secondsPerKm)}/km • ${formatPaceUnit(secondsPerMi)}/mi`;
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
