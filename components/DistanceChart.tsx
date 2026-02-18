"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceTick, type DistancePoint } from "../lib/distanceSeriesUtils";

type TooltipState = {
  x: number;
  y: number;
  point: DistancePoint;
} | null;

const CHART_HEIGHT = 300;
const ORANGE = "#FF4D00";

export function DistanceChart({
  points,
  scopeLabel
}: {
  points: DistancePoint[];
  scopeLabel: string;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const width = useElementWidth(wrapperRef);

  const yMax = useMemo(() => {
    const maxValue = Math.max(0, ...points.map((p) => p.valueKm));
    const step = maxValue <= 100 ? 25 : 50;
    return Math.max(step, Math.ceil(maxValue / step) * step);
  }, [points]);

  const chart = useMemo(() => {
    if (width <= 0 || points.length === 0) return null;
    return buildChartGeometry(points, width, CHART_HEIGHT, yMax);
  }, [points, width, yMax]);

  return (
    <section className="mt-8" aria-label="Distance ran chart">
      <div className="rounded-xl border border-black/10 bg-white p-4 shadow-card md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-2 font-semibold text-[#FF4D00]">
              <span className="h-0.5 w-8 bg-[#FF4D00]" />Distance
            </span>
            <span className="text-slate-400">Time</span>
            <span className="text-slate-400">Elevation</span>
          </div>
          <p className="text-sm font-medium text-slate-600">{scopeLabel}</p>
        </div>

        <div ref={wrapperRef} className="relative mt-4 min-h-[280px]">
          {!chart ? (
            <p className="py-14 text-center text-sm text-slate-500">No runs logged.</p>
          ) : (
            <div className="relative">
              <svg width={chart.width} height={chart.height} role="img" aria-label="Distance series chart" className="overflow-visible">
                {chart.yTicks.map((tick) => (
                  <g key={tick.value}>
                    <text x={tick.labelX} y={tick.y + 5} fontSize={12} fill="#6B7280" textAnchor="end">
                      {formatDistanceTick(tick.value)}
                    </text>
                    <line x1={chart.plotLeft} x2={chart.plotRight} y1={tick.y} y2={tick.y} stroke="#EEF0F3" strokeWidth={1} />
                  </g>
                ))}

                {chart.points.map((pt) => (
                  <line key={`v-${pt.key}`} x1={pt.x} x2={pt.x} y1={chart.plotTop} y2={chart.plotBottom} stroke="#E7EAF0" strokeWidth={1} />
                ))}

                <path d={chart.areaPath} fill={ORANGE} fillOpacity={0.12} />
                <path d={chart.linePath} fill="none" stroke={ORANGE} strokeWidth={2} />

                {chart.points.map((pt) => (
                  <g key={pt.key}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={6}
                      fill="#fff"
                      stroke={ORANGE}
                      strokeWidth={3}
                      onMouseEnter={() => setTooltip({ x: pt.x, y: pt.y, point: pt.raw })}
                      onMouseLeave={() => setTooltip(null)}
                      onFocus={() => setTooltip({ x: pt.x, y: pt.y, point: pt.raw })}
                      onBlur={() => setTooltip(null)}
                      role="button"
                      tabIndex={0}
                      aria-label={`${pt.raw.label}: ${pt.raw.valueKm.toFixed(1)} km`}
                    />
                    <text
                      x={pt.x + 5}
                      y={pt.y - 10}
                      fontSize={11}
                      fill="#2B2B2B"
                      transform={`rotate(-45 ${pt.x + 5} ${pt.y - 10})`}
                    >
                      {Math.round(pt.raw.valueKm)}
                    </text>
                    <text x={pt.x} y={chart.plotBottom + 22} fontSize={11} fill="#6B7280" textAnchor="middle">
                      {pt.xLabel}
                    </text>
                  </g>
                ))}
              </svg>

              {tooltip && (
                <div
                  className="pointer-events-none absolute z-10 rounded-md border border-black/10 bg-white px-3 py-2 text-xs shadow-md"
                  style={{ left: Math.min(tooltip.x + 14, chart.width - 180), top: Math.max(tooltip.y - 52, 8), width: 170 }}
                >
                  <p className="font-semibold text-black">{rangeLabel(tooltip.point)}</p>
                  <p className="text-slate-600">{tooltip.point.valueKm.toFixed(1)} km</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function rangeLabel(point: DistancePoint) {
  const start = new Date(point.start);
  const end = point.end ? new Date(point.end) : null;
  const fmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
  if (!end) return fmt.format(start);
  return `${fmt.format(start)} - ${fmt.format(new Date(end.getTime() - 1000))}`;
}

type ChartGeometry = {
  width: number;
  height: number;
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  plotBottom: number;
  yTicks: Array<{ value: number; y: number; labelX: number }>;
  linePath: string;
  areaPath: string;
  points: Array<{ key: string; x: number; y: number; xLabel: string; raw: DistancePoint }>;
};

function buildChartGeometry(points: DistancePoint[], width: number, height: number, yMax: number): ChartGeometry {
  const plotLeft = 64;
  const plotRight = width - 18;
  const plotTop = 16;
  const plotBottom = height - 38;
  const plotWidth = Math.max(1, plotRight - plotLeft);
  const plotHeight = Math.max(1, plotBottom - plotTop);

  const spacing = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth / 2;
  const mapped = points.map((point, index) => {
    const x = plotLeft + (points.length > 1 ? spacing * index : plotWidth / 2);
    const y = plotBottom - (point.valueKm / yMax) * plotHeight;

    return {
      key: `${point.start}-${index}`,
      x,
      y,
      xLabel: point.label,
      raw: point
    };
  });

  const linePath = mapped
    .map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x},${pt.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${mapped[mapped.length - 1]?.x ?? plotLeft},${plotBottom} L ${mapped[0]?.x ?? plotLeft},${plotBottom} Z`;

  const steps = yMax <= 100 ? 4 : 7;
  const yTicks = Array.from({ length: steps + 1 }, (_, i) => {
    const value = (yMax / steps) * i;
    const y = plotBottom - (value / yMax) * plotHeight;
    return { value, y, labelX: plotLeft - 8 };
  });

  return {
    width,
    height,
    plotLeft,
    plotRight,
    plotTop,
    plotBottom,
    yTicks,
    linePath,
    areaPath,
    points: mapped
  };
}

function useElementWidth(ref: React.RefObject<HTMLElement>) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
