import { useDashboardSummary } from "@/lib/hooks";
import { api } from "@/lib/api";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Alerts() {
  const { data: summary } = useDashboardSummary("today", undefined, 30000);
  const qc = useQueryClient();
  const active = summary?.faultAlerts || [];

  const resolve = async (bayId: string) => {
    try {
      await api.patch(`/admin/bays/${bayId}/status`, { status: "AVAILABLE" });
      toast.success("Bay marked available");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["stations"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to resolve");
    }
  };

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
            {active.map((a) => (
              <div key={a.bayId} className={`bg-card rounded-xl border border-border border-l-4 ${a.status === "FAULT" ? "border-l-destructive" : "border-l-muted-foreground"} p-5 flex items-center justify-between`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${a.status === "FAULT" ? "text-destructive" : "text-muted-foreground"}`} />
                  <div>
                    <div className="font-semibold text-navy">{a.bayLabel} · {a.stationName}</div>
                    <span className={`text-xs font-semibold mt-1 inline-block px-2 py-0.5 rounded-full ${a.status === "FAULT" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>BAY {a.status}</span>
                    <div className="text-xs text-muted-foreground mt-1">Last seen: {a.lastSeen ? format(new Date(a.lastSeen), "PPp") : "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/stations/${a.stationId}/bays`} className="text-sm text-primary font-medium hover:underline">View Station</Link>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30" onClick={() => resolve(a.bayId)}>Mark as Resolved</Button>
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