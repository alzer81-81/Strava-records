"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AutoSync({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("Syncing your latest activities...");

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const lastRunKey = "autoSync:lastQueued";
    const now = Date.now();
    const lastRun = window.sessionStorage.getItem(lastRunKey);
    if (lastRun && now - Number(lastRun) < 5 * 1000) return;
    window.sessionStorage.setItem(lastRunKey, String(now));

    async function run() {
      try {
        setSyncMessage("Syncing your latest activities...");
        setIsSyncing(true);
        const latestRes = await fetch("/api/sync/latest", { cache: "no-store" });
        if (!latestRes.ok) {
          setSyncMessage("Could not start sync. Showing saved data.");
          return;
        }
        const latest = (await latestRes.json()) as {
          latestJob?: { id: string; status: "PENDING" | "RUNNING" | "DONE" | "ERROR" } | null;
        };

        let jobId: string | null = null;
        if (latest.latestJob && (latest.latestJob.status === "PENDING" || latest.latestJob.status === "RUNNING")) {
          jobId = latest.latestJob.id;
          setSyncMessage("Finishing a sync already in progress...");
        } else {
          const startRes = await fetch("/api/sync/start?details=0&streams=0", {
            cache: "no-store"
          });
          if (!startRes.ok) {
            setSyncMessage("Could not start sync. Showing saved data.");
            return;
          }
          const started = (await startRes.json()) as { jobId: string };
          jobId = started.jobId;
        }

        if (!jobId) return;
        await pollUntilDone(jobId);
      } catch {
        setSyncMessage("Sync failed. Showing saved data.");
      } finally {
        if (!cancelled) {
          window.setTimeout(() => {
            if (!cancelled) setIsSyncing(false);
          }, 500);
        }
      }
    }

    async function pollUntilDone(jobId: string) {
      for (let i = 0; i < 90; i += 1) {
        if (cancelled) return;
        const res = await fetch(`/api/sync/status?id=${jobId}`, { cache: "no-store" });
        if (!res.ok) return;
        const status = (await res.json()) as { status: "PENDING" | "RUNNING" | "DONE" | "ERROR" };
        if (status.status === "DONE" || status.status === "ERROR") {
          router.refresh();
          if (status.status === "ERROR") {
            setSyncMessage("Sync failed. Showing saved data.");
          }
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      router.refresh();
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [enabled, router]);

  if (!isSyncing) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-[#F6F6F6]/96 backdrop-blur-[1px]">
      <div className="mx-auto flex h-full w-full max-w-6xl items-start px-6 pt-28 md:pt-32">
        <div className="w-full rounded-xl border border-black/10 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#FC5200]" />
            <p className="text-sm font-semibold text-slate-800 md:text-base">{syncMessage}</p>
          </div>
          <p className="mt-2 text-xs text-slate-500 md:text-sm">
            Pulling fresh activities from Strava before rendering the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
