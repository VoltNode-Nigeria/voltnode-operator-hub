import { useMemo, useState } from "react";
import { useSessions, useStations } from "@/lib/hooks";
import { sessionCost, sessionKwh } from "@/lib/sessions";
import { formatNaira } from "@/lib/api";
import { cn } from "@/lib/utils";
import { startOfDay, startOfWeek, startOfMonth, isAfter, subDays, format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Period = "today" | "week" | "month";

export default function Revenue() {
  const { data: sessions = [] } = useSessions();
  const { data: stations = [] } = useStations();
  const [period, setPeriod] = useState<Period>("today");

  const cutoff = useMemo(() => {
    const now = new Date();
    if (period === "today") return startOfDay(now);
    if (period === "week") return startOfWeek(now);
    return startOfMonth(now);
  }, [period]);

  const filtered = useMemo(
    () => sessions.filter((s) => s.startedAt && isAfter(new Date(s.startedAt), cutoff)),
    [sessions, cutoff]
  );

  const totalRevenue = filtered.reduce((sum, s) => sum + sessionCost(s), 0);
  const totalKwh = filtered.reduce((sum, s) => sum + sessionKwh(s), 0);
  const avg = filtered.length ? totalRevenue / filtered.length : 0;
  const paid = filtered.filter((s) => (s.paymentStatus || "").toUpperCase() === "PAID").length;
  const failed = filtered.filter((s) => (s.paymentStatus || "").toUpperCase() === "FAILED").length;
  const pending = filtered.filter((s) => !s.paymentStatus || s.paymentStatus.toUpperCase() === "PENDING").length;

  const byStation = stations.map((st) => {
    const ss = filtered.filter((s) => (s.stationId || s.station?.id) === st.id);
    const rev = ss.reduce((sum, s) => sum + sessionCost(s), 0);
    return {
      id: st.id, name: st.name, sessions: ss.length,
      kwh: ss.reduce((sum, s) => sum + sessionKwh(s), 0),
      revenue: rev, avg: ss.length ? rev / ss.length : 0,
      pct: totalRevenue ? (rev / totalRevenue) * 100 : 0,
    };
  });

  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => startOfDay(subDays(new Date(), 6 - i)));
    return days.map((d) => ({
      day: format(d, "EEE"),
      sessions: sessions.filter((s) => s.startedAt && startOfDay(new Date(s.startedAt)).getTime() === d.getTime()).length,
    }));
  }, [sessions]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-1">
        {(["today", "week", "month"] as Period[]).map((p) => (
          <button key={p} onClick={() => setPeriod(p)}
            className={cn("px-4 py-2 rounded-full text-sm font-medium", period === p ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground")}>
            {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RevCard label="Total Revenue" value={formatNaira(totalRevenue)} color="text-primary" />
        <RevCard label="Total Sessions" value={filtered.length} color="text-navy" />
        <RevCard label="kWh Dispensed" value={`${totalKwh.toFixed(2)} kWh`} color="text-foreground" />
        <RevCard label="Avg. Session Value" value={formatNaira(avg)} color="text-foreground" />
      </div>
      <div className="bg-card border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border font-semibold text-navy">Revenue by Station</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr>
              <th className="text-left px-4 py-3">Station</th><th className="text-right px-4 py-3">Sessions</th>
              <th className="text-right px-4 py-3">kWh</th><th className="text-right px-4 py-3">Revenue</th>
              <th className="text-right px-4 py-3">Avg</th><th className="text-left px-4 py-3 w-48">% of Total</th>
            </tr></thead>
            <tbody>
              {byStation.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No data.</td></tr>}
              {byStation.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-right tabular">{s.sessions}</td>
                  <td className="px-4 py-3 text-right tabular">{s.kwh.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right tabular font-semibold text-primary">{formatNaira(s.revenue)}</td>
                  <td className="px-4 py-3 text-right tabular">{formatNaira(s.avg)}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${s.pct}%` }} /></div>
                    <span className="text-xs tabular w-10 text-right">{s.pct.toFixed(0)}%</span>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <RevCard label="Successful Payments" value={paid} color="text-success" />
        <RevCard label="Failed Payments" value={failed} color="text-destructive" />
        <RevCard label="Pending" value={pending} color="text-warning" />
      </div>
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-navy mb-4">Sessions This Week</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const RevCard = ({ label, value, color }: any) => (
  <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
    <div className={`text-2xl font-bold tabular ${color}`}>{value}</div>
    <div className="text-sm text-muted-foreground mt-1">{label}</div>
  </div>
);