import { decodePolyline } from "../lib/polyline";

export function MapPreview({
  polyline,
  label,
  compact = false
}: {
  polyline: string | null | undefined;
  label: string;
  compact?: boolean;
}) {
  if (!polyline) {
    return compact ? (
      <div className="h-14 w-16 rounded-lg bg-sand/50" />
    ) : (
      <div className="mt-3 flex h-24 items-center justify-center rounded-xl bg-sand/50 text-xs text-slateish">
        Map preview unavailable
      </div>
    );
  }

  const points = decodePolyline(polyline);
  if (points.length < 2) {
    return compact ? (
      <div className="h-14 w-16 rounded-lg bg-sand/50" />
    ) : (
      <div className="mt-3 flex h-24 items-center justify-center rounded-xl bg-sand/50 text-xs text-slateish">
        Map preview unavailable
      </div>
    );
  }

  const xs = points.map((p) => p[1]);
  const ys = points.map((p) => p[0]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = Math.max(1e-6, maxX - minX);
  const height = Math.max(1e-6, maxY - minY);

  const padding = 4;
  const path = points
    .map(([lat, lng], idx) => {
      const x = ((lng - minX) / width) * 100;
      const y = (1 - (lat - minY) / height) * 100;
      return `${idx === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");

  if (compact) {
    return (
      <div className="h-14 w-16 rounded-lg bg-gradient-to-r from-ember/10 via-amber-100/40 to-white p-1.5">
        <svg viewBox={`-${padding} -${padding} ${100 + padding * 2} ${100 + padding * 2}`} className="h-full w-full">
          <path d={path} fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className="mt-3 h-24 rounded-xl bg-gradient-to-r from-ember/10 via-amber-100/40 to-white p-2">
      <svg viewBox={`-${padding} -${padding} ${100 + padding * 2} ${100 + padding * 2}`} className="h-full w-full">
        <path d={path} fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-slateish">{label}</div>
    </div>
  );
}
