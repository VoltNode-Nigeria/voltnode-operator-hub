import { useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { Station, Session } from "./types";

export const useStations = () =>
  useQuery({
    queryKey: ["stations"],
    queryFn: async (): Promise<Station[]> => {
      const { data } = await api.get("/stations");
      return Array.isArray(data) ? data : data?.data || [];
    },
  });

export const useSessions = (refetchInterval?: number) =>
  useQuery({
    queryKey: ["sessions"],
    queryFn: async (): Promise<Session[]> => {
      const { data } = await api.get("/sessions");
      return Array.isArray(data) ? data : data?.data || [];
    },
    refetchInterval,
  });

export type DashboardSummary = {
  period: { start: string; end: string; label: string };
  overview: {
    activeSessionsCount: number;
    totalBays: number;
    availableBays: number;
    occupiedBays: number;
    totalStations: number;
  };
  revenue: {
    totalNaira: number;
    totalKwh: number;
    totalSessions: number;
    avgSessionValue: number;
    walletSessions: number;
    cardSessions: number;
  };
  activeSessions: Session[];
  faultAlerts: {
    bayId: string;
    bayLabel: string;
    status: string;
    stationId: string;
    stationName: string;
    lastSeen: string;
  }[];
  chartData: { day: string; date: string; sessions: number }[];
  revenueByStation: {
    stationId: string;
    stationName: string;
    sessions: number;
    kwhDispensed: number;
    revenue: number;
    avgSessionValue: number;
    percentOfTotal: number;
  }[];
};

export const useDashboardSummary = (
  period: "today" | "week" | "month" = "today",
  stationId?: string,
  refetchInterval?: number,
) =>
  useQuery({
    queryKey: ["dashboard", "summary", period, stationId],
    queryFn: async (): Promise<DashboardSummary> => {
      const params = new URLSearchParams({ period });
      if (stationId) params.append("stationId", stationId);
      const { data } = await api.get(`/dashboard/summary?${params}`);
      return data;
    },
    refetchInterval,
  });

export const useGlobalRate = () =>
  useQuery({
    queryKey: ["globalRate"],
    queryFn: async (): Promise<{ ratePerKwh: number; currency: string }> => {
      const { data } = await api.get("/wallet/rate");
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });