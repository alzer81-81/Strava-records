"use client";

import Link from "next/link";
import Image from "next/image";
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

export function TopNav({ avatarUrl, displayName }: { avatarUrl?: string | null; displayName?: string | null }) {
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
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/95 text-black backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center">
          <Image src="/BT_logo.png" alt="Best Times" width={200} height={60} className="h-auto w-[100px] md:w-[200px]" />
        </div>
        {showTimeframe ? (
          <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-2 py-1.5 shadow-soft md:gap-3 md:px-3">
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 md:inline">Timeframe</span>
            <div className="relative">
              <select
                value={nextValue}
                onChange={(event) => {
                  const value = event.target.value as WindowType;
                  setNextValue(value);
                  applyWindow(value);
                }}
                className="appearance-none rounded-full border border-black/10 bg-gradient-to-r from-white to-slate-50 px-3 py-2 pr-9 text-sm font-semibold text-black transition hover:border-black/30 md:px-4 md:pr-10"
                aria-label="Timeframe"
              >
                {windowOptions.map((option) => (
                  <option key={option} value={option}>
                    {WINDOW_LABELS[option]}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <Avatar avatarUrl={avatarUrl} displayName={displayName} />
          </div>
        ) : (
          <Link href="/" className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white">
            Home
          </Link>
        )}
      </div>
    </header>
  );
}

function getInitials(name?: string | null) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
}

function Avatar({ avatarUrl, displayName }: { avatarUrl?: string | null; displayName?: string | null }) {
  const initials = getInitials(displayName);
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName ?? "User"}
        className="h-9 w-9 rounded-full border border-black/10 object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-slate-100 text-xs font-bold text-slate-700">
      {initials}
    </div>
  );
}
