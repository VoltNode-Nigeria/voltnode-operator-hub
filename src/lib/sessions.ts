import type { Session } from "./types";

export const sessionKwh = (s: Session) => Number(s.energyKwh ?? s.kwh ?? 0);
export const sessionCost = (s: Session) => Number(s.amount ?? s.cost ?? 0);
export const sessionStation = (s: Session) => s.station?.name || s.stationId || "—";
export const sessionDriver = (s: Session) => s.driverId || s.userId || "";
export const isActive = (s: Session) => {
  const st = (s.status || "").toUpperCase();
  return st === "ACTIVE" || st === "PENDING" || st === "IN_PROGRESS";
};
export const isCompleted = (s: Session) => {
  const st = (s.status || "").toUpperCase();
  return st === "COMPLETED" || st === "ENDED" || !!s.endedAt;
};