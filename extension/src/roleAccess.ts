export type LetopisRole = "GM" | "PLAYER";

export const COORDINATE_ROLES: LetopisRole[] = ["GM", "PLAYER"];
export const GM_ONLY_ROLES: LetopisRole[] = ["GM"];

export function canViewCoordinates(role: LetopisRole): boolean {
  return role === "GM" || role === "PLAYER";
}

export function canCalibrateMap(role: LetopisRole): boolean {
  return role === "GM";
}

export function canSyncMap(role: LetopisRole): boolean {
  return role === "GM";
}
