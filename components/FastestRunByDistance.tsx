"use client";

import { useMemo, useState } from "react";
import { MapPreview } from "./MapPreview";
import { TopTenModal } from "./TopTenModal";

type RunRow = {
  id: string;
  date: string;
  name: string;
  distance: string;
  pace: string;
  time: string;
  summaryPolyline: string | null;
};

type DistanceGroup = {
  key: string;
  label: string;
  runs: RunRow[];
};

export function FastestRunByDistance({ groups }: { groups: DistanceGroup[] }) {
  const [selected, setSelected] = useState(groups[0]?.key ?? "");

  const current = useMemo(
    () => groups.find((group) => group.key === selected) ?? groups[0] ?? null,
    [groups, selected]
  );

  if (!current) return null;

  const topThree = current.runs.slice(0, 3);
  const modalRows = current.runs.map((run, index) => ({
    rank: rankLabel(index),
    date: run.date,
    name: run.name,
    distance: run.distance,
    pace: run.pace,
    time: run.time,
    url: `https://www.strava.com/activities/${run.id}`
  }));

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-xl font-extrabold tracking-tight text-black md:text-2xl">Fastest Run</h3>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {groups.map((group) => {
            const active = group.key === current.key;
            return (
              <button
                key={group.key}
                type="button"
                onClick={() => setSelected(group.key)}
                className={[
                  "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors",
                  active
                    ? "border-[#FC5200] bg-[#FC5200] text-white"
                    : "border-black/10 bg-white text-slate-600 hover:border-[#FC5200]/50 hover:text-black"
                ].join(" ")}
              >
                {group.label}
              </button>
            );
          })}
          <TopTenModal title={`Fastest Run (${current.label})`} rows={modalRows} />
        </div>
      </div>

      {topThree.length > 0 ? (
        <div className="-mx-6 mt-4 overflow-x-auto pb-2 pl-6 pr-2 md:mx-0 md:pl-0 md:pr-0">
          <div className="flex gap-3 px-0 md:grid md:grid-cols-3 md:gap-4 md:px-0">
            {topThree.map((run, index) => (
              <article
                key={run.id}
                className="min-w-[84%] overflow-hidden rounded-xl border border-black/10 bg-white p-4 shadow-card sm:min-w-[70%] md:min-w-0"
              >
                <p className="text-xs font-medium text-slate-500">
                  {run.date} • {rankLabel(index)}
                </p>
                <p className="mt-2 text-xl font-black leading-tight text-black sm:text-2xl">{run.name || "Run"}</p>
                <div className="mt-4 grid grid-cols-3 divide-x divide-black/10">
                  <div className="pr-3">
                    <p className="text-sm text-slate-600">Distance</p>
                    <p className="mt-1 whitespace-nowrap text-[17px] font-semibold leading-tight text-black">{run.distance}</p>
                  </div>
                  <div className="px-3">
                    <p className="text-sm text-slate-600">Pace</p>
                    <p className="mt-1 whitespace-nowrap text-[17px] font-semibold leading-tight text-black">{run.pace}</p>
                  </div>
                  <div className="pl-3">
                    <p className="text-sm text-slate-600">Time</p>
                    <p className="mt-1 whitespace-nowrap text-[17px] font-semibold leading-tight text-black">{run.time}</p>
                  </div>
                </div>
                <MapPreview polyline={run.summaryPolyline} label="Route" />
                <a
                  href={`https://www.strava.com/activities/${run.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex font-semibold text-[#FC5200]"
                >
                  View on Strava
                </a>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">No runs found for {current.label} in this window.</p>
      )}
    </section>
  );
}

function rankLabel(index: number) {
  if (index === 0) return "1st";
  if (index === 1) return "2nd";
  if (index === 2) return "3rd";
  return `${index + 1}th`;
}
