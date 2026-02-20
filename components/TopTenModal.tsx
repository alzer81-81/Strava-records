"use client";

import { useState } from "react";

type TopTenRow = {
  rank: string;
  date: string;
  name: string;
  distance: string;
  pace: string;
  time: string;
  url: string;
};

export function TopTenModal({
  title,
  rows,
  rangeLabel
}: {
  title: string;
  rows: TopTenRow[];
  rangeLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-[#FC5200] transition-colors hover:text-[#d84800]"
      >
        View top 50
      </button>

      {open ? (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/35 p-4">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-black/10 bg-white shadow-card">
            <div className="sticky top-0 z-10 border-b border-black/10 bg-white px-4 py-3 md:px-6 md:py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-black md:text-2xl">{title} Top 50</h3>
                  {rangeLabel ? (
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 md:text-[11px]">
                      {rangeLabel}
                    </p>
                  ) : null}
                </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/10 text-slate-700 transition-colors hover:bg-slate-50"
              >
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M5 5L15 15M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              </div>
            </div>

            <div className="overflow-y-auto px-4 pb-4 pt-3 md:px-6 md:pb-6 md:pt-4">
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-separate border-spacing-y-1">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <th className="px-3 py-2">Rank</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Run</th>
                    <th className="px-3 py-2">Distance</th>
                    <th className="px-3 py-2">Pace</th>
                    <th className="px-3 py-2">Time</th>
                    <th className="px-3 py-2 text-right">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={`${row.url}-${index}`}
                      className={index % 2 === 0 ? "bg-slate-50/80" : "bg-white"}
                    >
                      <td className="px-3 py-4 text-sm font-semibold text-black">{row.rank}</td>
                      <td className="px-3 py-4 text-sm text-slate-700">{row.date}</td>
                      <td className="px-3 py-4 text-sm font-semibold text-black">{row.name}</td>
                      <td className="px-3 py-4 text-sm text-slate-700">{row.distance}</td>
                      <td className="px-3 py-4 text-sm text-slate-700">{row.pace}</td>
                      <td className="px-3 py-4 text-sm text-slate-700">{row.time}</td>
                      <td className="px-3 py-4 text-right">
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-[#FC5200] hover:text-[#d84800]"
                        >
                          View on Strava
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 grid gap-2 md:hidden">
              {rows.map((row, index) => (
                <article
                  key={`mobile-${row.url}-${index}`}
                  className={[
                    "rounded-lg border border-black/10 p-4",
                    index % 2 === 0 ? "bg-slate-50/80" : "bg-white"
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-black">{row.rank} • {row.name}</p>
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-[#FC5200]"
                  >
                      View on Strava
                    </a>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{row.date}</p>
                  <div className="mt-3 grid grid-cols-1 gap-1 text-xs text-slate-700">
                    <p className="flex items-center justify-between gap-3"><span className="font-semibold text-slate-900">Distance</span><span>{row.distance}</span></p>
                    <p className="flex items-center justify-between gap-3"><span className="font-semibold text-slate-900">Pace</span><span>{row.pace}</span></p>
                    <p className="flex items-center justify-between gap-3"><span className="font-semibold text-slate-900">Time</span><span>{row.time}</span></p>
                  </div>
                </article>
              ))}
            </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
