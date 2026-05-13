import { useMemo, useState } from "react";
import { useOperatorSessions, useStations } from "@/lib/hooks";
import { formatNaira, maskDriver } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@components/ui/input";
import { format } from "date-fns";

function PaymentMethodBadge({ method }: { method?: string }) {
  const m = (method || "").toUpperCase();
  if (m === "WALLET") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800">
        WALLET
      </span>
    );
  }
  if (m === "CARD") {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-white">
        CARD
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
      {m || "—"}
    </span>
  );
}

export default function SessionHistory() {
  const { data: stations = [] } = useStations();
  const [stationId, setStationId] = useState("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useOperatorSessions({
    page,
    stationId: stationId === "ALL" ? undefined : stationId,
    from: from || undefined,
    to: to || undefined,
  });

  const sessions = data?.data ?? [];
  const meta = data?.meta;

  const filtered = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter((s) => s.id.toLowerCase().startsWith(q));
  }, [sessions, search]);

  const total = meta?.total ?? 0;
  const currentPage = meta?.page ?? 1;
  const limit = meta?.limit ?? 20;
  const totalPages = meta?.totalPages ?? 1;
  const start = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, total);

  return (
    <div className="space-y-5">
      <div className="bg-card rounded-xl border border-border p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">From</label>
          <Input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">To</label>
          <Input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className="w-40"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Station</label>
          <select
            value={stationId}
            onChange={(e) => {
              setStationId(e.target.value);
              setPage(1);
            }}
            className="border border-border rounded-lg px-3 h-10 text-sm bg-background"
          >
            <option value="ALL">All</option>
            {stations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-48">
          <label className="text-xs text-muted-foreground block mb-1">Search Session ID</label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Session ID"
          />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
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
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No sessions found for the selected filters
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const dur =
                    s.startedAt && s.endedAt
                      ? Math.round(
                          (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000
                        ) + " min"
                      : "—";
                  const kwh = s.kwhDispensed ?? s.energyKwh ?? s.kwh ?? 0;
                  const amount = s.costNaira ?? s.amount ?? s.cost ?? 0;
                  return (
                    <tr key={s.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        {s.startedAt ? format(new Date(s.startedAt), "MMM d, p") : "—"}
                      </td>
                      <td className="px-4 py-3">{s.station?.name || s.stationId || "—"}</td>
                      <td className="px-4 py-3">{s.bay?.label || "—"}</td>
                      <td className="px-4 py-3">{maskDriver(s.driverId || s.userId)}</td>
                      <td className="px-4 py-3 tabular-nums">{dur}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{Number(kwh).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">
                        {formatNaira(amount)}
                      </td>
                      <td className="px-4 py-3">
                        <PaymentMethodBadge method={s.paymentMethod} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {start}–{end} of {total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
