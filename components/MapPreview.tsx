import { decodePolyline } from "../lib/polyline";

export function MapPreview({
  polyline,
  compact = false
}: {
  polyline: string | null | undefined;
  label?: string;
  compact?: boolean;
}) {
  if (!polyline) {
    return compact ? (
      <div className="h-14 w-16 rounded-lg bg-sand/50" />
    ) : (
      <div className="mt-3 flex h-24 items-center justify-center rounded-lg bg-sand/50 text-xs text-slateish">
        Map preview unavailable
      </div>
    );
  }

  const points = decodePolyline(polyline);
  if (points.length < 2) {
    return compact ? (
      <div className="h-14 w-16 rounded-lg bg-sand/50" />
    ) : (
      <div className="mt-3 flex h-24 items-center justify-center rounded-lg bg-sand/50 text-xs text-slateish">
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
  const first = points[0];
  const last = points[points.length - 1];
  const startX = ((first[1] - minX) / width) * 100;
  const startY = (1 - (first[0] - minY) / height) * 100;
  const endX = ((last[1] - minX) / width) * 100;
  const endY = (1 - (last[0] - minY) / height) * 100;

  if (compact) {
    return (
      <div className="h-14 w-16 overflow-hidden rounded-lg border border-black/5 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-1.5">
        <svg viewBox={`-${padding} -${padding} ${100 + padding * 2} ${100 + padding * 2}`} className="h-full w-full">
          <path d={path} fill="none" stroke="#0f172a" strokeOpacity="0.2" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d={path} fill="none" stroke="#F97316" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={startX} cy={startY} r="2.2" fill="white" stroke="#F97316" strokeWidth="1.2" />
          <circle cx={endX} cy={endY} r="2.2" fill="#F97316" />
        </svg>
      </div>
    );
  }

  return (
    <div className="mt-3 h-24 overflow-hidden rounded-lg border border-black/5 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <svg viewBox={`-${padding} -${padding} ${100 + padding * 2} ${100 + padding * 2}`} className="h-full w-full">
        <path d={path} fill="none" stroke="#0f172a" strokeOpacity="0.2" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d={path} fill="none" stroke="#F97316" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={startX} cy={startY} r="2.2" fill="white" stroke="#F97316" strokeWidth="1.2" />
        <circle cx={endX} cy={endY} r="2.2" fill="#F97316" />
      </svg>
    </div>
  );
}
