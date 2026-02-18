import { decodePolyline } from "../lib/polyline";

export function MapPreview({
  polyline,
  compact = false
}: {
  polyline: string | null | undefined;
  label?: string;
  compact?: boolean;
}) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const previewId = getPreviewId(polyline ?? "missing", compact);
  const gridId = `${previewId}-grid`;
  const glowId = `${previewId}-glow`;

  if (!polyline) {
    return compact ? (
      <div className="h-14 w-20 rounded-lg border border-black/5 bg-sand/50" />
    ) : (
      <div className="mt-3 flex h-24 items-center justify-center rounded-lg bg-sand/50 text-xs text-slateish">
        Map preview unavailable
      </div>
    );
  }

  const points = decodePolyline(polyline);
  if (points.length < 2) {
    return compact ? (
      <div className="h-14 w-20 rounded-lg border border-black/5 bg-sand/50" />
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
  const mapboxUrl = mapboxToken
    ? buildMapboxStaticUrl(polyline, compact ? 220 : 900, compact ? 140 : 220, mapboxToken)
    : null;

  if (compact) {
    if (mapboxUrl) {
      return (
        <div className="h-14 w-20 overflow-hidden rounded-lg border border-black/5 bg-sand/50">
          <img src={mapboxUrl} alt="Route map preview" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
        </div>
      );
    }
    return (
      <div className="h-14 w-20 overflow-hidden rounded-lg border border-black/5 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-1.5">
        <svg viewBox={`-${padding} -${padding} ${100 + padding * 2} ${100 + padding * 2}`} className="h-full w-full">
          <defs>
            <pattern id={gridId} width="14" height="14" patternUnits="userSpaceOnUse">
              <path d="M0 0H14M0 0V14" stroke="#475569" strokeOpacity="0.08" strokeWidth="0.8" />
            </pattern>
            <filter id={glowId}>
              <feGaussianBlur stdDeviation="0.9" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect x="-4" y="-4" width="108" height="108" fill={`url(#${gridId})`} />
          <path d={path} fill="none" stroke="#0f172a" strokeOpacity="0.18" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d={path} fill="none" stroke="#F97316" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowId})`} />
          <circle cx={startX} cy={startY} r="2.5" fill="white" stroke="#0f172a" strokeOpacity="0.5" strokeWidth="1" />
          <circle cx={endX} cy={endY} r="2.5" fill="#F97316" stroke="#0f172a" strokeOpacity="0.3" strokeWidth="0.8" />
        </svg>
      </div>
    );
  }

  if (mapboxUrl) {
    return (
      <div className="mt-3 h-24 overflow-hidden rounded-lg border border-black/5 bg-sand/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <img src={mapboxUrl} alt="Route map preview" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
      </div>
    );
  }

  return (
    <div className="mt-3 h-24 overflow-hidden rounded-lg border border-black/5 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
      <svg viewBox={`-${padding} -${padding} ${100 + padding * 2} ${100 + padding * 2}`} className="h-full w-full">
        <defs>
          <pattern id={gridId} width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M0 0H14M0 0V14" stroke="#475569" strokeOpacity="0.08" strokeWidth="0.8" />
          </pattern>
          <filter id={glowId}>
            <feGaussianBlur stdDeviation="0.9" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="-4" y="-4" width="108" height="108" fill={`url(#${gridId})`} />
        <path d={path} fill="none" stroke="#0f172a" strokeOpacity="0.18" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={path} fill="none" stroke="#F97316" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${glowId})`} />
        <circle cx={startX} cy={startY} r="2.5" fill="white" stroke="#0f172a" strokeOpacity="0.5" strokeWidth="1" />
        <circle cx={endX} cy={endY} r="2.5" fill="#F97316" stroke="#0f172a" strokeOpacity="0.3" strokeWidth="0.8" />
      </svg>
    </div>
  );
}

function getPreviewId(seed: string, compact: boolean) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return `map-${compact ? "c" : "f"}-${hash.toString(36)}`;
}

function buildMapboxStaticUrl(polyline: string, width: number, height: number, token: string) {
  const encodedPath = encodeURIComponent(polyline);
  return `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/path-4+fc5200-0.9(${encodedPath})/auto/${width}x${height}?padding=32&logo=false&attribution=false&access_token=${token}`;
}
