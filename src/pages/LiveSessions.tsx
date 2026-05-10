import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { useDashboardSummary, useStations } from "@/lib/hooks";
import { sessionCost, sessionKwh, sessionStation, sessionDriver } from "@/lib/sessions";
import { formatNaira, maskDriver } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function useTick(ms = 1000) {
  const [, set] = useState(0);
  useEffect(() => {
    const i = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(i);
  }, [ms]);
}

const fmtDuration = (start?: string) => {
  if (!start) return "—";
  const ms = Date.now() - new Date(start).getTime();
  if (ms < 0) return "00:00:00";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
};

export default function LiveSessions() {
  useTick(1000);
  const { data: stations = [] } = useStations();
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [stationFilter, setStationFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<any>(null);
  const { data: summary, isLoading } = useDashboardSummary(
    period,
    stationFilter === "ALL" ? undefined : stationFilter,
    15000,
  );
  const active = summary?.activeSessions || [];
  const filtered = active.filter((s) => {
    if (statusFilter !== "ALL" && (s.status || "").toUpperCase() !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-xl border border-border p-4 flex flex-wrap items-center gap-3">
        <select
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
        >
          <option value="ALL">All Stations</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          {["ALL", "ACTIVE", "PENDING"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium",
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-2">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium",
                period === p ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground",
              )}
            >
              {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm font-medium bg-primary/15 text-primary px-3 py-1 rounded-full">
          {filtered.length} Active Sessions
        </span>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading sessions…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No active sessions at this time</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Session</th>
                  <th className="text-left px-4 py-3">Station</th>
                  <th className="text-left px-4 py-3">Bay</th>
                  <th className="text-left px-4 py-3">Driver</th>
                  <th className="text-left px-4 py-3">Started</th>
                  <th className="text-left px-4 py-3">Duration</th>
                  <th className="text-right px-4 py-3">kWh</th>
                  <th className="text-right px-4 py-3">Est. Cost</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-3 font-mono text-xs">{s.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">{sessionStation(s)}</td>
                    <td className="px-4 py-3">{s.bay?.label || s.bayId?.slice(0, 6) || "—"}</td>
                    <td className="px-4 py-3">{maskDriver(sessionDriver(s))}</td>
                    <td className="px-4 py-3">{s.startedAt ? format(new Date(s.startedAt), "p") : "—"}</td>
                    <td className="px-4 py-3 tabular">{fmtDuration(s.startedAt)}</td>
                    <td className="px-4 py-3 text-right tabular font-semibold">{sessionKwh(s).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right tabular font-semibold text-primary">{formatNaira(sessionCost(s))}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(s)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Session Details</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-3 text-sm">
              <Row k="Session ID" v={<span className="font-mono">{selected.id}</span>} />
              <Row k="Status" v={<StatusBadge status={selected.status} />} />
              <Row k="Station" v={sessionStation(selected)} />
              <Row k="Bay" v={selected.bay?.label || selected.bayId} />
              <Row k="Charger" v={selected.bay?.chargerType || selected.bay?.type || "—"} />
              <Row k="Max Power" v={`${selected.bay?.maxKw ?? selected.bay?.power ?? "—"} kW`} />
              <Row k="Driver" v={maskDriver(sessionDriver(selected))} />
              <Row k="Started" v={selected.startedAt ? format(new Date(selected.startedAt), "PPp") : "—"} />
              <Row k="Duration" v={fmtDuration(selected.startedAt)} />
              <Row k="kWh" v={sessionKwh(selected).toFixed(2)} />
              <Row k="Est. Cost" v={<span className="text-primary font-semibold">{formatNaira(sessionCost(selected))}</span>} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

const Row = ({ k, v }: { k: string; v: any }) => (
  <div className="flex justify-between border-b border-border pb-2">
    <span className="text-muted-foreground">{k}</span>
    <span className="font-medium text-right">{v}</span>
  </div>
);