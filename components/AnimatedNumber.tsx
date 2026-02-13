"use client";

import { useEffect, useState } from "react";

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix
}: {
  value: number | null;
  decimals?: number;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === null || !Number.isFinite(value)) return;

    const durationMs = 420;
    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  if (value === null || !Number.isFinite(value)) {
    return <span>--</span>;
  }

  return (
    <span>
      {display.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
      {suffix ? ` ${suffix}` : ""}
    </span>
  );
}
