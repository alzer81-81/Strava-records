import { PlanType } from "@prisma/client";
import { WindowType } from "./time";

export type Feature =
  | "WINDOW_LAST_6M"
  | "WINDOW_YEAR"
  | "DISTANCE_TARGETS_FULL"
  | "GROUPS_MULTI"
  | "GROUP_MEMBERS_10";

export function canAccess(plan: PlanType, feature: Feature) {
  return true;
}

export function isWindowAllowed(plan: PlanType, window: WindowType) {
  return true;
}

export const FREE_DISTANCE_TARGETS = [5000, 10000];

export const FULL_DISTANCE_TARGETS = [
  400,
  805,
  1000,
  1609,
  3219,
  5000,
  10000,
  15000,
  16093,
  20000,
  21097,
  42195
];
