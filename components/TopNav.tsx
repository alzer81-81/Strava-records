"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { WindowType } from "../lib/time";

const windowOptions: WindowType[] = ["WEEK", "MONTH", "LAST_2M", "LAST_6M", "YEAR", "ALL_TIME"];

const WINDOW_LABELS: Record<WindowType, string> = {
  WEEK: "This Week",
  MONTH: "This Month",
  LAST_2M: "2 Months",
  LAST_6M: "6 Months",
  YEAR: "This Year",
  LAST_YEAR: "Last Year",
  ALL_TIME: "All Time",
};

function normalizeWindow(value?: string): WindowType {
  if (!value) return "MONTH";
  const upper = value.toUpperCase();
  if (windowOptions.includes(upper as WindowType)) return upper as WindowType;
  return "MONTH";
}

export function TopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const current = useMemo(() => normalizeWindow(searchParams.get("window") ?? undefined), [searchParams]);
  const [nextValue, setNextValue] = useState<WindowType>(current);

  const showTimeframe = pathname === "/";

  function applyWindow(next: WindowType) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("window", next);
    router.push(`/?${params.toString()}`);
  }

  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-black text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="text-left">
          <p className="text-sm uppercase tracking-[0.3em] text-white/80">Strava Records</p>
        </div>
        {showTimeframe ? (
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">Timeframe</span>
            <div className="relative">
              <select
                value={nextValue}
                onChange={(event) => {
                  const value = event.target.value as WindowType;
                  setNextValue(value);
                  applyWindow(value);
                }}
                className="appearance-none rounded-full border border-white/20 bg-black px-4 py-2 pr-10 text-sm text-white"
                aria-label="Timeframe"
              >
                {windowOptions.map((option) => (
                  <option key={option} value={option}>
                    {WINDOW_LABELS[option]}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/70">▾</span>
            </div>
          </div>
        ) : (
          <Link href="/" className="rounded-full border border-white/20 px-4 py-2 text-sm text-white">
            Home
          </Link>
        )}
      </div>
    </header>
  );
}
