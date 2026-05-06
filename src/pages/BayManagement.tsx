import { useParams, Link } from "react-router-dom";
import { useStations } from "@/lib/hooks";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Bay } from "@/lib/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const borderColor: Record<string, string> = {
  AVAILABLE: "border-l-success",
  OCCUPIED: "border-l-primary",
  FAULT: "border-l-destructive",
  OFFLINE: "border-l-muted-foreground",
  MAINTENANCE: "border-l-warning",
};
const dotColor: Record<string, string> = {
  AVAILABLE: "bg-success",
  OCCUPIED: "bg-primary",
  FAULT: "bg-destructive",
  OFFLINE: "bg-muted-foreground",
  MAINTENANCE: "bg-warning",
};

export default function BayManagement() {
  const { id } = useParams();
  const { data: stations = [] } = useStations();
  const station = stations.find((s) => s.id === id);
  const qc = useQueryClient();
  const [confirmBay, setConfirmBay] = useState<Bay | null>(null);
  const [reason, setReason] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newBay, setNewBay] = useState({ label: "", chargerType: "AC_TYPE2" });
  const [creating, setCreating] = useState(false);

  const updateStatus = async (bayId: string, status: string) => {
    try {
      await api.patch(`/admin/bays/${bayId}/status`, { status });
      toast.success(`Bay marked as ${status}`);
      qc.invalidateQueries({ queryKey: ["stations"] });
      setConfirmBay(null);
      setReason("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update bay");
    }
  };

  const createBay = async () => {
    if (!id) return;
    if (!newBay.label.trim() || !newBay.chargerType.trim()) {
      toast.error("Label and charger type are required");
      return;
    }
    setCreating(true);
    try {
      await api.post(`/admin/stations/${id}/bays`, {
        label: newBay.label.trim(),
        chargerType: newBay.chargerType.trim(),
      });
      toast.success("Bay created");
      setAddOpen(false);
      setNewBay({ label: "", chargerType: "AC_TYPE2" });
      qc.invalidateQueries({ queryKey: ["stations"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create bay");
    } finally {
      setCreating(false);
    }
  };

  if (!station) return <div className="bg-card p-8 rounded-xl text-center">Station not found.</div>;

  return (
    <div className="space-y-5">
      <Link to="/stations" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to stations
      </Link>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy">{station.name}</h2>
          <p className="text-sm text-muted-foreground">{station.address}</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Add Bay
        </Button>
      </div>

      {(station.bays || []).length === 0 ? (
        <div className="bg-card p-8 rounded-xl text-center text-muted-foreground border border-border">
          No bays configured. Click "Add Bay" to create the first one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(station.bays || []).map((b) => {
            const st = (b.status || "OFFLINE").toUpperCase();
            return (
              <div key={b.id} className={`bg-card border border-border border-l-4 ${borderColor[st] || "border-l-muted"} rounded-xl p-5 shadow-sm`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-navy">{b.label || b.name || b.id.slice(0, 6)}</h3>
                    <div className="text-xs text-muted-foreground mt-1">{b.chargerType || b.type || "Charger"}</div>
                    <div className="text-xs font-semibold mt-1">{b.maxKw ?? b.power ?? "—"} kW</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${dotColor[st] || "bg-muted"}`} />
                    <span className="text-xs font-semibold">{st}</span>
                  </div>
                </div>
                {st === "FAULT" && (
                  <div className="mt-3 text-destructive text-xs flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Fault detected
                  </div>
                )}
                <div className="text-[11px] text-muted-foreground mt-3">
                  Last seen: {b.lastSeenAt ? format(new Date(b.lastSeenAt), "PPp") : "—"}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "AVAILABLE")}>Available</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(b.id, "OCCUPIED")}>Occupied</Button>
                  <Button size="sm" variant="outline" className="text-destructive border-destructive/30" onClick={() => updateStatus(b.id, "FAULT")}>Fault</Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmBay(b)}>Offline</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!confirmBay} onOpenChange={(o) => !o && setConfirmBay(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark bay offline?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to mark Bay {confirmBay?.label || confirmBay?.name} as OFFLINE?</p>
          <Input placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBay(null)}>Cancel</Button>
            <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => confirmBay && updateStatus(confirmBay.id, "OFFLINE")}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Bay</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Bay Label</Label>
              <Input className="mt-1" placeholder="e.g. Bay A1" value={newBay.label} onChange={(e) => setNewBay({ ...newBay, label: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Charger Type</Label>
              <Input className="mt-1" placeholder="e.g. AC_TYPE2, DC_CCS, DC_CHADEMO" value={newBay.chargerType} onChange={(e) => setNewBay({ ...newBay, chargerType: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={createBay} disabled={creating} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {creating ? "Creating…" : "Create Bay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}