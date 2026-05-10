import { useState } from "react";
import { Zap, Grid3x3, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDashboardSummary, useGlobalRate, useStations } from "@/lib/hooks";
import { api, formatNaira, maskDriver } from "@/lib/api";
import { sessionKwh, sessionCost, sessionStation, sessionDriver } from "@/lib/sessions";
import { StatusBadge } from "@/components/StatusBadge";
import { VarianceBadge, computeVariance } from "@/components/VarianceBadge";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function StatCard({ icon: Icon, label, value, sub, accent = "primary" }: any) {
  const accents: Record<string, string> = {
    primary: "bg-primary/15 text-primary",
    navy: "bg-navy/10 text-navy",
    success: "bg-success/15 text-success",
  };
  const valueColor: Record<string, string> = {
    primary: "text-primary",
    navy: "text-navy",
    success: "text-success",
  };
  return (
    <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${accents[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className={`mt-4 text-3xl font-bold tabular ${valueColor[accent]}`}>{value}</div>
      <div className="text-sm font-medium text-foreground mt-1">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: sLoad } = useDashboardSummary("today", undefined, 15000);
  const { data: stations = [] } = useStations();
  const { data: globalRate } = useGlobalRate();
  const qc = useQueryClient();
  const [dismissed, setDismissed] = useState(false);

  const active = summary?.activeSessions || [];
  const overview = summary?.overview;
  const todaysRevenue = summary?.revenue.totalNaira ?? 0;
  const faultAlerts = summary?.faultAlerts || [];
  const firstFault = faultAlerts[0];
  const chartData = summary?.chartData || [];
  const gRate = globalRate?.ratePerKwh ?? 0;

  const resetToGlobal = async (stationId: string) => {
    if (!gRate) return;
    try {
      await api.put(`/admin/stations/${stationId}`, { pricingPerKwh: gRate });
      toast.success("Pricing reset to global rate");
      qc.invalidateQueries({ queryKey: ["stations"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to reset pricing");
    }
  };

  return (
    <div className="space-y-6">
      {firstFault && !dismissed && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            Alert: Bay {firstFault.bayLabel} at {firstFault.stationName} is {(firstFault.status || "").toUpperCase()} —
            <Link to="/alerts" className="underline ml-1">View</Link>
          </div>
          <button onClick={() => setDismissed(true)}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Zap} label="Active Sessions" value={overview?.activeSessionsCount ?? 0} sub="Right Now" accent="primary" />
        <StatCard icon={Grid3x3} label="Total Bays" value={overview?.totalBays ?? 0} sub="Across all stations" accent="navy" />
        <StatCard icon={CheckCircle2} label="Available Bays" value={overview?.availableBays ?? 0} sub="Ready to charge" accent="success" />
        <StatCard icon={Zap} label="Today's Revenue" value={formatNaira(todaysRevenue)} sub="So far today" accent="primary" />
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Global Baseline Rate</div>
            <div className="mt-2 text-[28px] font-bold text-navy tabular">{formatNaira(gRate)} <span className="text-base font-medium text-muted-foreground">/ kWh</span></div>
            <div className="mt-1 text-[11px] italic text-muted-foreground">Set by VoltNode Admin · Not editable here</div>
          </div>
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left py-2">Station</th>
                    <th className="text-right py-2">Your Rate</th>
                    <th className="text-left py-2 pl-4">vs Global</th>
                    <th className="text-right py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stations.length === 0 && (
                    <tr><td colSpan={4} className="py-3 text-center text-muted-foreground">No stations.</td></tr>
                  )}
                  {stations.map((st) => {
                    const v = computeVariance(st.pricingPerKwh, gRate);
                    const matches = Math.abs(v) < 0.05;
                    return (
                      <tr key={st.id} className="border-t border-border">
                        <td className="py-2 font-medium">{st.name}</td>
                        <td className="py-2 text-right tabular">{formatNaira(st.pricingPerKwh)}/kWh</td>
                        <td className="py-2 pl-4"><VarianceBadge stationRate={st.pricingPerKwh} globalRate={gRate} /></td>
                        <td className="py-2 text-right">
                          {matches ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <button onClick={() => resetToGlobal(st.id)} className="text-primary text-xs font-medium hover:underline">Reset</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-card rounded-xl shadow-sm border border-border">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-navy">Live Sessions</h2>
            <span className="text-xs text-muted-foreground">{active.length} active</span>
          </div>
          <div className="overflow-x-auto">
            {sLoad ? (
              <div className="p-8 text-center text-muted-foreground">Loading…</div>
            ) : active.length === 0 ? (
              <div className="p-10 text-center">
                <Zap className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">No active sessions right now</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3">Bay</th>
                    <th className="text-left px-4 py-3">Station</th>
                    <th className="text-left px-4 py-3">Driver</th>
                    <th className="text-left px-4 py-3">Started</th>
                    <th className="text-right px-4 py-3">kWh</th>
                    <th className="text-right px-4 py-3">Est. Cost</th>
                    <th className="text-left px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium">{s.bay?.label || s.bayId?.slice(0, 6) || "—"}</td>
                      <td className="px-4 py-3">{sessionStation(s)}</td>
                      <td className="px-4 py-3">{maskDriver(sessionDriver(s))}</td>
                      <td className="px-4 py-3">{s.startedAt ? format(new Date(s.startedAt), "p") : "—"}</td>
                      <td className="px-4 py-3 text-right tabular">{sessionKwh(s).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right tabular font-semibold text-primary">{formatNaira(sessionCost(s))}</td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold text-navy px-1">Stations</h2>
          {stations.length === 0 && (
            <div className="bg-card rounded-xl p-6 text-sm text-muted-foreground border border-border">No stations yet.</div>
          )}
          {stations.map((st) => {
            const bays = st.bays || [];
            const avail = bays.filter((b) => (b.status || "").toUpperCase() === "AVAILABLE").length;
            const fault = bays.some((b) => ["FAULT", "OFFLINE"].includes((b.status || "").toUpperCase()));
            const dot = fault ? "bg-destructive" : avail > 0 ? "bg-success" : "bg-warning";
            return (
              <div key={st.id} className="bg-card rounded-xl p-4 border border-border shadow-sm flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    <span className="font-semibold">{st.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {bays.length} bays · {avail} available
                  </div>
                </div>
                <Link to={`/stations/${st.id}/bays`} className="text-primary text-sm font-medium hover:underline">View</Link>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border p-5">
        <h2 className="font-semibold text-navy mb-4">Sessions This Week</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}