import { useMemo, useState, Fragment } from "react";
import { useSessions, useStations } from "@/lib/hooks";
import { isCompleted, sessionCost, sessionKwh, sessionStation, sessionDriver } from "@/lib/sessions";
import { formatNaira, maskDriver, API_BASE } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ChevronDown, ChevronRight, Download } from "lucide-react";

export default function SessionHistory() {
  const { data: sessions = [], isLoading } = useSessions();
  const { data: stations = [] } = useStations();
  const [stationId, setStationId] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const perPage = 20;

  const filtered = useMemo(() => {
    return sessions.filter(isCompleted).filter((s) => {
      if (stationId !== "ALL" && (s.stationId || s.station?.id) !== stationId) return false;
      if (paymentStatus !== "ALL" && (s.paymentStatus || "").toUpperCase() !== paymentStatus) return false;
      if (from && s.startedAt && new Date(s.startedAt) < new Date(from)) return false;
      if (to && s.startedAt && new Date(s.startedAt) > new Date(to + "T23:59:59")) return false;
      if (search && !s.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [sessions, stationId, paymentStatus, from, to, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  const exportCsv = async () => {
    const params = new URLSearchParams();
    if (stationId !== "ALL") params.set("stationId", stationId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const token = localStorage.getItem("voltnode_token");
    const res = await fetch(`${API_BASE}/dashboard/export?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const b = await res.blob();
    const url = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voltnode-sessions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-xl border border-border p-4 flex flex-wrap items-end gap-3">
        <div><label className="text-xs text-muted-foreground block mb-1">From</label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" /></div>
        <div><label className="text-xs text-muted-foreground block mb-1">To</label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" /></div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Station</label>
          <select value={stationId} onChange={(e) => setStationId(e.target.value)} className="border border-border rounded-lg px-3 h-10 text-sm bg-background">
            <option value="ALL">All</option>
            {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Payment</label>
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="border border-border rounded-lg px-3 h-10 text-sm bg-background">
            <option value="ALL">All</option><option value="PAID">Paid</option><option value="FAILED">Failed</option><option value="PENDING">Pending</option>
          </select>
        </div>
        <div className="flex-1 min-w-48">
          <label className="text-xs text-muted-foreground block mb-1">Search Session ID</label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Session ID" />
        </div>
        <Button variant="outline" onClick={exportCsv} className="border-primary text-primary hover:bg-primary/10">
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="w-8"></th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Station</th>
                <th className="text-left px-4 py-3">Bay</th>
                <th className="text-left px-4 py-3">Driver</th>
                <th className="text-left px-4 py-3">Duration</th>
                <th className="text-right px-4 py-3">kWh</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Payment</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : pageRows.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No sessions match your filters.</td></tr>
              ) : pageRows.map((s) => {
                const open = expanded === s.id;
                const dur = s.startedAt && s.endedAt
                  ? Math.round((new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000) + " min"
                  : "—";
                return (
                  <Fragment key={s.id}>
                    <tr className="border-t border-border">
                      <td className="px-2"><button onClick={() => setExpanded(open ? null : s.id)} className="p-1">{open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button></td>
                      <td className="px-4 py-3">{s.startedAt ? format(new Date(s.startedAt), "MMM d, p") : "—"}</td>
                      <td className="px-4 py-3">{sessionStation(s)}</td>
                      <td className="px-4 py-3">{s.bay?.label || "—"}</td>
                      <td className="px-4 py-3">{maskDriver(sessionDriver(s))}</td>
                      <td className="px-4 py-3 tabular">{dur}</td>
                      <td className="px-4 py-3 text-right tabular">{sessionKwh(s).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right tabular font-semibold">{formatNaira(sessionCost(s))}</td>
                      <td className="px-4 py-3"><StatusBadge status={s.paymentStatus || "PENDING"} /></td>
                    </tr>
                    {open && (
                      <tr className="bg-muted/30 border-t border-border">
                        <td></td>
                        <td colSpan={8} className="px-4 py-3 text-xs space-y-1">
                          <div><span className="text-muted-foreground">Session ID: </span><span className="font-mono">{s.id}</span></div>
                          <div><span className="text-muted-foreground">Charger: </span>{s.bay?.chargerType || "—"}</div>
                          <div><span className="text-muted-foreground">Paystack Ref: </span>{s.paystackRef || "—"}</div>
                          <div><span className="text-muted-foreground">Started: </span>{s.startedAt ? format(new Date(s.startedAt), "PPpp") : "—"}</div>
                          <div><span className="text-muted-foreground">Ended: </span>{s.endedAt ? format(new Date(s.endedAt), "PPpp") : "—"}</div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Showing {filtered.length === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}