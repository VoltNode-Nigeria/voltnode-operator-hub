import { useMemo, useState } from "react";
import { useStations } from "@/lib/hooks";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function Alerts() {
  const { data: stations = [] } = useStations();
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const active = useMemo(() => {
    const list: any[] = [];
    for (const st of stations) {
      for (const b of st.bays || []) {
        const s = (b.status || "").toUpperCase();
        if ((s === "FAULT" || s === "OFFLINE") && !resolved.has(b.id)) {
          list.push({ bay: b, station: st, type: s });
        }
      }
    }
    return list;
  }, [stations, resolved]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-navy mb-3">Active Alerts</h2>
        {active.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-3" />
            <h3 className="font-bold text-navy text-lg">All systems operational</h3>
            <p className="text-sm text-muted-foreground mt-1">No active faults or offline bays</p>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map(({ bay, station, type }) => (
              <div key={bay.id} className={`bg-card rounded-xl border border-border border-l-4 ${type === "FAULT" ? "border-l-destructive" : "border-l-muted-foreground"} p-5 flex items-center justify-between`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${type === "FAULT" ? "text-destructive" : "text-muted-foreground"}`} />
                  <div>
                    <div className="font-semibold text-navy">{bay.label || bay.name} · {station.name}</div>
                    <span className={`text-xs font-semibold mt-1 inline-block px-2 py-0.5 rounded-full ${type === "FAULT" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>BAY {type}</span>
                    <div className="text-xs text-muted-foreground mt-1">Last seen: {bay.lastSeenAt ? format(new Date(bay.lastSeenAt), "PPp") : "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/stations/${station.id}/bays`} className="text-sm text-primary font-medium hover:underline">View Station</Link>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30" onClick={() => setResolved((s) => new Set([...s, bay.id]))}>Mark as Resolved</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-navy mb-3">Alert History</h2>
        <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">Alert history will appear here once incidents are resolved.</div>
      </div>
    </div>
  );
}