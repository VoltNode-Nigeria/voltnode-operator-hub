import { useMemo, useState } from "react";
import { useDashboardSummary, useGlobalRate, useStations } from "@/lib/hooks";
import { formatNaira } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type Period = "today" | "week" | "month";

export default function Revenue() {
  const [period, setPeriod] = useState<Period>("today");
  const { data: summary } = useDashboardSummary(period);
  const { data: stations = [] } = useStations();
  const { data: globalRate } = useGlobalRate();

  const totalRevenue = summary?.revenue.totalNaira ?? 0;
  const totalKwh = summary?.revenue.totalKwh ?? 0;
  const totalSessions = summary?.revenue.totalSessions ?? 0;
  const avg = summary?.revenue.avgSessionValue ?? 0;
  const walletSessions = summary?.revenue.walletSessions ?? 0;
  const cardSessions = summary?.revenue.cardSessions ?? 0;

  const byStation = (summary?.revenueByStation || []).map((s) => ({
    id: s.stationId,
    name: s.stationName,
    sessions: s.sessions,
    kwh: s.kwhDispensed,
    revenue: s.revenue,
    avg: s.avgSessionValue,
    pct: s.percentOfTotal,
  }));

  const chartData = summary?.chartData || [];

  const gRate = globalRate?.ratePerKwh ?? 0;
  const stationRates = stations.map((s) => Number(s.pricingPerKwh ?? 0)).filter((n) => n > 0);
  const highest = stationRates.length ? Math.max(...stationRates) : 0;
  const lowest = stationRates.length ? Math.min(...stationRates) : 0;
  const highestStation = stations.find((s) => Number(s.pricingPerKwh) === highest)?.name || "—";
  const lowestStation = stations.find((s) => Number(s.pricingPerKwh) === lowest)?.name || "—";
  const yourAvg = stationRates.length ? stationRates.reduce((a, b) => a + b, 0) / stationRates.length : 0;
  const estAtGlobal = totalKwh * gRate;
  const diff = totalRevenue - estAtGlobal;

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
        <RevCard label="Total Sessions" value={totalSessions} color="text-navy" />
        <RevCard label="kWh Dispensed" value={`${totalKwh.toFixed(2)} kWh`} color="text-foreground" />
        <RevCard label="Avg. Session Value" value={formatNaira(avg)} color="text-foreground" />
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-success/15 text-success">
          Wallet Sessions: {walletSessions}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary">
          Card Sessions: {cardSessions}
        </span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-navy mb-3">Rate Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Global Rate</span><span className="text-navy font-semibold tabular">{formatNaira(gRate)}/kWh</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Highest Rate</span><span className="text-navy font-semibold tabular">{formatNaira(highest)}/kWh <span className="text-muted-foreground font-normal">({highestStation})</span></span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Lowest Rate</span><span className="text-navy font-semibold tabular">{formatNaira(lowest)}/kWh <span className="text-muted-foreground font-normal">({lowestStation})</span></span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Your Average</span><span className="text-navy font-semibold tabular">{formatNaira(yourAvg)}/kWh</span></div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="font-semibold text-navy mb-3">Revenue at Global Rate</h3>
          <div className="text-xs text-muted-foreground">Estimated at global rate:</div>
          <div className="text-2xl font-bold text-navy tabular">{formatNaira(estAtGlobal)}</div>
          <div className="text-xs text-muted-foreground mt-3">Actual earned:</div>
          <div className="text-2xl font-bold text-primary tabular">{formatNaira(totalRevenue)}</div>
          <div className="mt-3 text-sm">
            {Math.abs(diff) < 0.01 ? (
              <span className="text-muted-foreground">Matches global rate exactly</span>
            ) : diff > 0 ? (
              <span className="text-success font-medium">{formatNaira(diff)} more than global rate</span>
            ) : (
              <span className="text-warning font-medium">{formatNaira(Math.abs(diff))} less than global rate</span>
            )}
          </div>
        </div>
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