"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WindowType } from "../lib/time";

export function AutoSync({
  enabled,
  windowType
}: {
  enabled: boolean;
  windowType?: WindowType;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const lastRunKey = "autoSync:lastLight";
    const lastRun = typeof window !== "undefined" ? window.sessionStorage.getItem(lastRunKey) : null;
    const now = Date.now();
    if (lastRun && now - Number(lastRun) < 2 * 60 * 1000) return;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(lastRunKey, String(now));
    }

    fetch("/api/sync")
      .then(() => router.refresh())
      .catch(() => {});
  }, [enabled, router]);

  useEffect(() => {
    if (!enabled) return;
    if (windowType !== "ALL_TIME") return;

    const lastRunKey = "autoSync:lastFullAllTime";
    const lastRun = typeof window !== "undefined" ? window.sessionStorage.getItem(lastRunKey) : null;
    const now = Date.now();
    if (lastRun && now - Number(lastRun) < 12 * 60 * 60 * 1000) return;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(lastRunKey, String(now));
    }

    let cancelled = false;

    async function startFullSync() {
      try {
        const startRes = await fetch("/api/sync/start?full=1&streams=1");
        if (!startRes.ok) return;
        const data = (await startRes.json()) as { jobId?: string };
        if (!data.jobId) return;

        for (let i = 0; i < 300; i += 1) {
          if (cancelled) return;
          const statusRes = await fetch(`/api/sync/status?id=${data.jobId}`);
          if (!statusRes.ok) return;
          const status = (await statusRes.json()) as { status?: string };
          if (status.status === "DONE") {
            router.refresh();
            return;
          }
          if (status.status === "ERROR") return;
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch {
        // no-op; dashboard still works with light sync
      }
    }

    startFullSync();
    return () => {
      cancelled = true;
    };
  }, [enabled, router, windowType]);

  return null;
}
