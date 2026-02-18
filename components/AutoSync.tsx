"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoSync({ enabled }: { enabled: boolean }) {
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

  return null;
}
