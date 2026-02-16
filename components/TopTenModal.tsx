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

export function TopTenModal({ title, rows }: { title: string; rows: TopTenRow[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-semibold text-[#FC5200] transition-colors hover:text-[#d84800]"
      >
        View top 10
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-black/10 bg-white p-4 shadow-card md:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-black md:text-2xl">{title} Top 10</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-black/10 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 hidden overflow-x-auto md:block">
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

            <div className="mt-4 grid gap-2 md:hidden">
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
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-700">
                    <p><span className="font-semibold text-slate-900">Dist:</span> {row.distance}</p>
                    <p><span className="font-semibold text-slate-900">Pace:</span> {row.pace}</p>
                    <p><span className="font-semibold text-slate-900">Time:</span> {row.time}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
