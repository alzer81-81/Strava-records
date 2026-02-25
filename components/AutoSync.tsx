"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoSync({ enabled }: { enabled: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const lastRunKey = "autoSync:lastQueued";
    const now = Date.now();
    const lastRun = window.sessionStorage.getItem(lastRunKey);
    if (lastRun && now - Number(lastRun) < 30 * 1000) return;
    window.sessionStorage.setItem(lastRunKey, String(now));

    async function run() {
      try {
        const latestRes = await fetch("/api/sync/latest", { cache: "no-store" });
        if (!latestRes.ok) return;
        const latest = (await latestRes.json()) as {
          latestJob?: { id: string; status: "PENDING" | "RUNNING" | "DONE" | "ERROR" } | null;
        };

        let jobId: string | null = null;
        if (latest.latestJob && (latest.latestJob.status === "PENDING" || latest.latestJob.status === "RUNNING")) {
          jobId = latest.latestJob.id;
        } else {
          const startRes = await fetch("/api/sync/start?details=0&streams=0", {
            cache: "no-store"
          });
          if (!startRes.ok) return;
          const started = (await startRes.json()) as { jobId: string };
          jobId = started.jobId;
        }

        if (!jobId) return;
        await pollUntilDone(jobId);
      } catch {
        // silent: autosync should never block usage
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

  return null;
}
