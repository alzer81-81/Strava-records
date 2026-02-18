"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WindowType } from "../lib/time";

const windowOptions = ["WEEK", "MONTH", "LAST_2M", "LAST_6M", "LAST_365", "YEAR", "ALL_TIME"] as const satisfies readonly WindowType[];

const WINDOW_LABELS: Record<(typeof windowOptions)[number], string> = {
  WEEK: "This Week",
  MONTH: "This Month",
  LAST_2M: "2 Months",
  LAST_6M: "6 Months",
  LAST_365: "Last 365 Days",
  YEAR: "This Year",
  ALL_TIME: "All Time"
};

type WindowOption = (typeof windowOptions)[number];
type SyncStatus = "PENDING" | "RUNNING" | "DONE" | "ERROR";
type SyncJobStatus = {
  status?: SyncStatus;
  phase?: string | null;
  processedSteps?: number | null;
  totalSteps?: number | null;
  totalActivities?: number | null;
  detailFetched?: number | null;
  errorMessage?: string | null;
};

function normalizeWindow(value?: string): WindowType {
  if (!value) return "MONTH";
  const upper = value.toUpperCase();
  if (windowOptions.includes(upper as WindowOption)) return upper as WindowOption;
  return "MONTH";
}

const FULL_SYNC_JOB_KEY = "bt_full_sync_job_id";
const LAST_SYNCED_KEY = "bt_last_synced_at";

export function TopNav({ avatarUrl, displayName }: { avatarUrl?: string | null; displayName?: string | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const current = useMemo(() => normalizeWindow(searchParams.get("window") ?? undefined), [searchParams]);
  const [isSyncingQuick, setIsSyncingQuick] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [allTimeReady, setAllTimeReady] = useState(false);
  const [allTimeStateLoaded, setAllTimeStateLoaded] = useState(false);
  const [showAllTimeConfirm, setShowAllTimeConfirm] = useState(false);
  const [fullSyncJobId, setFullSyncJobId] = useState<string | null>(null);
  const [fullSyncStatus, setFullSyncStatus] = useState<SyncJobStatus | null>(null);
  const [isStartingFullSync, setIsStartingFullSync] = useState(false);
  const pollIntervalRef = useRef<number | null>(null);

  const showTimeframe = pathname === "/";
  const currentWindowValue = current === "ALL_TIME" && !allTimeReady ? "WEEK" : current;

  useEffect(() => {
    const saved = window.localStorage.getItem(LAST_SYNCED_KEY);
    if (saved) setLastSyncedAt(saved);
    const savedJobId = window.localStorage.getItem(FULL_SYNC_JOB_KEY);
    if (savedJobId) setFullSyncJobId(savedJobId);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        const res = await fetch("/api/sync/latest", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          allTimeReady?: boolean;
          latestAllTimeSyncedAt?: string | null;
        };
        if (cancelled) return;
        setAllTimeReady(Boolean(data.allTimeReady));
        setAllTimeStateLoaded(true);
        if (data.latestAllTimeSyncedAt) {
          setLastSyncedAt(data.latestAllTimeSyncedAt);
          window.localStorage.setItem(LAST_SYNCED_KEY, data.latestAllTimeSyncedAt);
        }
      } catch {
        if (!cancelled) setAllTimeStateLoaded(true);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!fullSyncJobId) return;
    let cancelled = false;

    async function poll() {
      try {
        const statusRes = await fetch(`/api/sync/status?id=${fullSyncJobId}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });
        if (!statusRes.ok) return;
        const statusJson = (await statusRes.json()) as SyncJobStatus;
        if (cancelled) return;
        setFullSyncStatus(statusJson);

        if (statusJson.status === "DONE") {
          setAllTimeReady(true);
          const nowIso = new Date().toISOString();
          setLastSyncedAt(nowIso);
          window.localStorage.setItem(LAST_SYNCED_KEY, nowIso);
          window.localStorage.removeItem(FULL_SYNC_JOB_KEY);
          setFullSyncJobId(null);
          router.refresh();
          return;
        }
        if (statusJson.status === "ERROR") {
          setSyncError(statusJson.errorMessage || "All-time sync failed");
          window.localStorage.removeItem(FULL_SYNC_JOB_KEY);
          setFullSyncJobId(null);
          return;
        }
      } catch {
        // no-op
      }
    }

    poll();
    pollIntervalRef.current = window.setInterval(poll, 2000);

    return () => {
      cancelled = true;
      if (pollIntervalRef.current !== null) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [fullSyncJobId, router]);

  const applyWindow = useCallback((next: WindowType) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("window", next);
    router.push(`/?${params.toString()}`);
  }, [router, searchParams]);

  useEffect(() => {
    if (!showTimeframe) return;
    if (!allTimeStateLoaded) return;
    if (allTimeReady) return;
    if (current !== "ALL_TIME") return;
    applyWindow("WEEK");
  }, [allTimeReady, allTimeStateLoaded, applyWindow, current, showTimeframe]);

  async function syncNowQuick() {
    if (isSyncingQuick) return;
    setIsSyncingQuick(true);
    setSyncError(null);
    try {
      const startRes = await fetch("/api/sync/start?full=0&details=0", {
        method: "GET",
        credentials: "include",
        cache: "no-store"
      });
      if (!startRes.ok) {
        throw new Error("Could not start sync");
      }
      const startJson = (await startRes.json()) as { jobId?: string };
      if (!startJson.jobId) throw new Error("Missing sync job id");

      const deadline = Date.now() + 8 * 60 * 1000;
      let done = false;
      while (!done && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const statusRes = await fetch(`/api/sync/status?id=${startJson.jobId}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store"
        });
        if (!statusRes.ok) continue;
        const statusJson = (await statusRes.json()) as SyncJobStatus;
        if (statusJson.status === "DONE") {
          done = true;
          break;
        }
        if (statusJson.status === "ERROR") {
          throw new Error(statusJson.errorMessage || "Sync failed");
        }
      }
      if (!done) throw new Error("Sync timed out. Try again.");

      const now = new Date().toISOString();
      setLastSyncedAt(now);
      window.localStorage.setItem(LAST_SYNCED_KEY, now);
      router.refresh();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSyncingQuick(false);
    }
  }

  async function startAllTimeSync() {
    if (isStartingFullSync) return;
    setIsStartingFullSync(true);
    setSyncError(null);
    try {
      const startRes = await fetch("/api/sync/start?full=1&details=1&streams=1", {
        method: "GET",
        credentials: "include",
        cache: "no-store"
      });
      if (!startRes.ok) throw new Error("Could not start all-time sync");
      const startJson = (await startRes.json()) as { jobId?: string };
      if (!startJson.jobId) throw new Error("Missing sync job id");

      window.localStorage.setItem(FULL_SYNC_JOB_KEY, startJson.jobId);
      setFullSyncJobId(startJson.jobId);
      setFullSyncStatus({
        status: "RUNNING",
        phase: "Starting",
        processedSteps: 0,
        totalSteps: 0
      });
      setShowAllTimeConfirm(false);
      applyWindow("WEEK");
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "All-time sync failed");
    } finally {
      setIsStartingFullSync(false);
    }
  }

  const fullProgress =
    fullSyncStatus?.totalSteps && fullSyncStatus.totalSteps > 0
      ? Math.min(100, Math.round(((fullSyncStatus.processedSteps ?? 0) / fullSyncStatus.totalSteps) * 100))
      : 0;
  const hasRunningFullSync = Boolean(fullSyncJobId);

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
                value={currentWindowValue}
                onChange={(event) => {
                  const value = event.target.value as WindowType;
                  if (value === "ALL_TIME" && !allTimeReady) {
                    setShowAllTimeConfirm(true);
                    return;
                  }
                  applyWindow(value);
                }}
                className="appearance-none rounded-full border border-black/10 bg-gradient-to-r from-white to-slate-50 px-3 py-2 pr-9 text-sm font-semibold text-black transition hover:border-black/30 md:px-4 md:pr-10"
                aria-label="Timeframe"
              >
                {windowOptions.map((option) => (
                  <option key={option} value={option} disabled={option === "ALL_TIME" && !allTimeReady}>
                    {WINDOW_LABELS[option]}
                    {option === "ALL_TIME" && !allTimeReady ? " (Sync required)" : ""}
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
            <div className="group relative">
              <button
                type="button"
                onClick={syncNowQuick}
                disabled={isSyncingQuick}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-slate-600 transition hover:border-black/20 hover:text-black disabled:cursor-wait disabled:opacity-70"
                aria-label="Sync now"
              >
                <svg className={`h-4 w-4 ${isSyncingQuick ? "animate-spin" : ""}`} viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M16 10a6 6 0 10-1.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M16 4v4h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="pointer-events-none absolute right-0 top-11 z-30 hidden w-56 rounded-lg border border-black/10 bg-white px-3 py-2 text-xs text-slate-600 shadow-soft group-hover:block group-focus-within:block">
                <p className="font-semibold text-black">Sync now</p>
                <p className="mt-1">Quick refresh (recent activities)</p>
                <p className="mt-1">
                  Last synced:{" "}
                  {lastSyncedAt
                    ? new Intl.DateTimeFormat(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit"
                      }).format(new Date(lastSyncedAt))
                    : "Never"}
                </p>
                {syncError ? <p className="mt-1 text-[#FC5200]">{syncError}</p> : null}
              </div>
            </div>
            <Avatar avatarUrl={avatarUrl} displayName={displayName} />
          </div>
        ) : (
          <Link href="/" className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white">
            Home
          </Link>
        )}
      </div>

      {hasRunningFullSync ? (
        <div className="border-t border-black/10 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">All-time sync in progress</p>
              <p className="truncate text-sm text-slate-700">{fullSyncStatus?.phase || "Running..."}</p>
            </div>
            <span className="rounded-full border border-black/10 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">{fullProgress}%</span>
          </div>
        </div>
      ) : null}

      {showAllTimeConfirm ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-black">Sync all-time data?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This may take some time. If you continue, we will run it in the background and keep you on This Week.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAllTimeConfirm(false)}
                className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={startAllTimeSync}
                disabled={isStartingFullSync}
                className="rounded-full bg-[#FC5200] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isStartingFullSync ? "Starting..." : "Start all-time sync"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
