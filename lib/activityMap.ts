import { SportType } from "@prisma/client";

export function mapSportType(stravaType: string): SportType {
  const lower = stravaType.toLowerCase();
  if (lower.includes("run")) return "RUN";
  if (lower.includes("ride") || lower.includes("bike") || lower.includes("cycling")) return "RIDE";
  return "OTHER";
}
