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