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

type Section = {
  id: string;
  title: string;
  keys: string[];
};

const SECTION_CONFIG: Section[] = [
  {
    id: "short",
    title: "Short",
    keys: ["400m", "1k", "half_mile", "1_mile"]
  },
  {
    id: "mid",
    title: "Mid",
    keys: ["2_mile", "5k", "10k", "15k"]
  },
  {
    id: "long",
    title: "Long",
    keys: ["10_mile", "half_marathon", "marathon"]
  }
];

export function BestTimesGroupedList({
  records,
  onAddGoal
}: {
  records: PRRecord[];
  onAddGoal?: (record: PRRecord) => void;
}) {
  const sectionBuckets = useMemo(() => buildSections(records), [records]);

  return (
    <section aria-labelledby="best-times-title">
      <div className="flex items-center justify-between gap-3">
        <h3 id="best-times-title" className="font-[var(--font-fraunces)] text-2xl font-bold tracking-tight text-black">
          Best Times
        </h3>
      </div>

      <div className="mt-4 space-y-6">
        {sectionBuckets.map((section) => (
          <SectionTable key={section.id} section={section} onAddGoal={onAddGoal} />
        ))}
      </div>
    </section>
  );
}

function SectionTable({
  section,
  onAddGoal
}: {
  section: { id: string; title: string; rows: PRRecord[] };
  onAddGoal?: (record: PRRecord) => void;
}) {
  const normalization = normalizeTimes(section.rows);

  return (
    <section className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-card" aria-labelledby={`${section.id}-title`}>
      <header className="sticky top-0 z-10 border-b border-black/10 bg-white/95 px-4 py-3 backdrop-blur">
        <h4 id={`${section.id}-title`} className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">
          {section.title}
        </h4>
      </header>

      <ul role="list" className="divide-y divide-black/10">
        {section.rows.map((row) => {
          const pace = row.bestTimeSeconds ? formatPace(row.bestTimeSeconds, row.distanceMeters) : null;
          const achievedOn = row.achievedAt ? formatAchievedDate(row.achievedAt) : null;
          const score = getScore(row.bestTimeSeconds, normalization);

          if (row.activityId && row.bestTimeSeconds !== null) {
            return (
              <li key={row.id}>
                <a
                  href={`https://www.strava.com/activities/${row.activityId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FC5200] focus-visible:ring-inset"
                  aria-label={`${row.distanceLabel} best time ${formatClockTime(row.bestTimeSeconds)}. View on Strava in new tab.`}
                >
                  <div className="min-w-0">
                    <div className="grid items-center gap-2 sm:grid-cols-[minmax(9rem,1fr)_minmax(8rem,auto)_minmax(10rem,auto)]">
                      <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{row.distanceLabel}</p>
                      <div className="relative min-w-0">
                        <div
                          className="absolute inset-y-1 left-0 rounded-sm bg-slate-200/50"
                          style={{ width: `${score}%` }}
                          aria-hidden="true"
                        />
                        <p className="relative tabular-nums text-xl font-semibold leading-none text-black">{formatClockTime(row.bestTimeSeconds)}</p>
                      </div>
                      <p className="text-sm text-slate-500">
                        {pace}
                        {achievedOn ? ` • ${achievedOn}` : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                    aria-hidden="true"
                  >
                    <ChevronRightIcon />
                  </span>
                </a>
              </li>
            );
          }

          return (
            <li key={row.id}>
              <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-[minmax(9rem,1fr)_minmax(0,1fr)_auto] sm:items-center">
                <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{row.distanceLabel}</p>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700">No record yet</p>
                  <p className="text-xs text-slate-500">Log a run to set this PR.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddGoal?.(row)}
                  className="inline-flex items-center justify-center rounded-md border border-black/15 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-black/30 hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FC5200] focus-visible:ring-offset-1"
                  aria-label={`Set a goal for ${row.distanceLabel}`}
                >
                  Add goal
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function buildSections(records: PRRecord[]) {
  const byKey = new Map(records.map((record) => [record.distanceKey, record]));
  const sections = SECTION_CONFIG.map((section) => {
    const rows = section.keys
      .map((key) => byKey.get(key))
      .filter((row): row is PRRecord => Boolean(row))
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
    return { id: section.id, title: section.title, rows };
  });

  const knownKeys = new Set(SECTION_CONFIG.flatMap((section) => section.keys));
  const remaining = records
    .filter((record) => !knownKeys.has(record.distanceKey))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  if (remaining.length > 0) {
    sections.push({
      id: "remaining",
      title: "Additional",
      rows: remaining
    });
  }

  return sections.filter((section) => section.rows.length > 0);
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
  return `Achieved on ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date)}`;
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
