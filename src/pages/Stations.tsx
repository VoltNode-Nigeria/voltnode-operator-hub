import { useRef, useState } from "react";
import { useStations } from "@/lib/hooks";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, MapPin, Plus, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Station } from "@/lib/types";

const emptyForm = { name: "", address: "", latitude: 6.5244, longitude: 3.3792, pricingPerKwh: 85 };

export default function Stations() {
  const { data: stations = [], isLoading } = useStations();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Station | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [imagesFor, setImagesFor] = useState<Station | null>(null);

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (s: Station) => {
    setEditing(s);
    setForm({
      name: s.name,
      address: s.address || "",
      latitude: s.latitude ?? 0,
      longitude: s.longitude ?? 0,
      pricingPerKwh: s.pricingPerKwh ?? 85,
    });
    setOpen(true);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        address: form.address,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        pricingPerKwh: Number(form.pricingPerKwh),
      };
      if (editing) await api.put(`/admin/stations/${editing.id}`, payload);
      else await api.post(`/admin/stations`, payload);
      toast.success(editing ? "Station updated" : "Station created");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["stations"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to save station");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (s: Station) => {
    if (!confirm(`Delete ${s.name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/stations/${s.id}`);
      toast.success("Station deleted");
      qc.invalidateQueries({ queryKey: ["stations"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed");
    }
  };

  const uploadImage = async (stationId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.post(`/admin/stations/${stationId}/images`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Image uploaded");
      qc.invalidateQueries({ queryKey: ["stations"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Upload failed");
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      await api.delete(`/admin/images/${imageId}`);
      toast.success("Image deleted");
      qc.invalidateQueries({ queryKey: ["stations"] });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy">My Stations</h2>
        <Button onClick={openNew} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" /> Add New Station
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-card p-8 rounded-xl text-center text-muted-foreground">Loading…</div>
      ) : stations.length === 0 ? (
        <div className="bg-card p-12 rounded-xl text-center border border-border">
          <p className="text-muted-foreground">No stations yet. Add your first station to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {stations.map((s) => {
            const bays = s.bays || [];
            const avail = bays.filter((b) => (b.status || "").toUpperCase() === "AVAILABLE").length;
            const occ = bays.filter((b) => (b.status || "").toUpperCase() === "OCCUPIED").length;
            const off = bays.filter((b) => ["OFFLINE", "FAULT"].includes((b.status || "").toUpperCase())).length;
            return (
              <div key={s.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-navy text-lg">{s.name}</h3>
                    <div className="flex items-center text-xs text-muted-foreground mt-1 gap-1">
                      <MapPin className="h-3 w-3" /> {s.address || s.city || "—"}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.status === "INACTIVE" ? "bg-muted text-muted-foreground" : "bg-success/15 text-success"}`}>
                    {s.status || "ACTIVE"}
                  </span>
                </div>
                {s.images && s.images.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {s.images.slice(0, 4).map((img) => (
                      <img key={img.id} src={img.url} alt={s.name} className="h-16 w-16 object-cover rounded-md border border-border" />
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                  <Stat n={bays.length} label="Total" />
                  <Stat n={avail} label="Available" color="text-success" />
                  <Stat n={occ} label="Occupied" color="text-primary" />
                  <Stat n={off} label="Offline" color="text-destructive" />
                </div>
                <div className="mt-3 inline-block bg-primary/10 text-primary text-xs font-semibold px-2 py-1 rounded-full">
                  ₦{s.pricingPerKwh ?? 0}/kWh
                </div>
                <div className="flex gap-2 mt-4">
                  <Link to={`/stations/${s.id}/bays`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">Manage Bays</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => setImagesFor(s)}>
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Edit</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => remove(s)}>Delete</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ImagesDialog
        station={imagesFor}
        onClose={() => setImagesFor(null)}
        onUpload={uploadImage}
        onDelete={deleteImage}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Station" : "Add New Station"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Station Name" className="col-span-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Address" className="col-span-2"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label="Price per kWh (₦)"><Input type="number" value={form.pricingPerKwh} onChange={(e) => setForm({ ...form, pricingPerKwh: Number(e.target.value) })} /></Field>
            <Field label="Latitude"><Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })} /></Field>
            <Field label="Longitude"><Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {submitting ? "Saving…" : "Save Station"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Stat = ({ n, label, color = "text-foreground" }: any) => (
  <div>
    <div className={`text-lg font-bold tabular ${color}`}>{n}</div>
    <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
  </div>
);

const Field = ({ label, children, className = "" }: any) => (
  <div className={className}>
    <Label className="text-xs">{label}</Label>
    <div className="mt-1">{children}</div>
  </div>
);