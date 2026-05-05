import { useState } from "react";
import { useStations } from "@/lib/hooks";
import { API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";

type DownloadEntry = { name: string; type: string; at: Date };

export default function Reports() {
  const { data: stations = [] } = useStations();
  const [pdfStation, setPdfStation] = useState("");
  const [pdfMonth, setPdfMonth] = useState(new Date().toISOString().slice(0, 7));
  const [csvStation, setCsvStation] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [revPeriod, setRevPeriod] = useState("this");
  const [history, setHistory] = useState<DownloadEntry[]>([]);

  const download = async (url: string, filename: string, type: string) => {
    try {
      const token = localStorage.getItem("voltnode_token");
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl; a.download = filename; a.click();
      URL.revokeObjectURL(objUrl);
      setHistory((h) => [{ name: filename, type, at: new Date() }, ...h].slice(0, 10));
      toast.success("Download started");
    } catch (e: any) { toast.error(e?.message || "Failed to download"); }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <FileText className="h-8 w-8 text-primary mb-2" />
          <h3 className="font-semibold text-navy">Monthly Bankability Report</h3>
          <p className="text-xs text-muted-foreground mt-1">Full monthly summary — sessions, kWh, revenue.</p>
          <div className="mt-4 space-y-2">
            <Label className="text-xs">Station</Label>
            <select value={pdfStation} onChange={(e) => setPdfStation(e.target.value)} className="w-full border border-border rounded-md h-10 px-3 bg-background text-sm">
              <option value="">All stations</option>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Label className="text-xs">Month</Label>
            <Input type="month" value={pdfMonth} onChange={(e) => setPdfMonth(e.target.value)} />
          </div>
          <Button className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
            const params = new URLSearchParams();
            if (pdfStation) params.set("stationId", pdfStation);
            params.set("month", pdfMonth);
            download(`${API_BASE}/dashboard/report/pdf?${params}`, `bankability-${pdfMonth}.pdf`, "PDF Report");
          }}>Generate PDF Report</Button>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <Download className="h-8 w-8 text-primary mb-2" />
          <h3 className="font-semibold text-navy">Session Export (CSV)</h3>
          <p className="text-xs text-muted-foreground mt-1">Download raw session data for any date range.</p>
          <div className="mt-4 space-y-2">
            <Label className="text-xs">Station</Label>
            <select value={csvStation} onChange={(e) => setCsvStation(e.target.value)} className="w-full border border-border rounded-md h-10 px-3 bg-background text-sm">
              <option value="">All stations</option>
              {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">From</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div><Label className="text-xs">To</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4 border-primary text-primary hover:bg-primary/10" onClick={() => {
            const params = new URLSearchParams();
            if (csvStation) params.set("stationId", csvStation);
            if (from) params.set("from", from);
            if (to) params.set("to", to);
            download(`${API_BASE}/dashboard/export?${params}`, `sessions-${Date.now()}.csv`, "Sessions CSV");
          }}>Download CSV</Button>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <FileText className="h-8 w-8 text-primary mb-2" />
          <h3 className="font-semibold text-navy">Revenue Summary</h3>
          <p className="text-xs text-muted-foreground mt-1">Revenue breakdown by station and period.</p>
          <div className="mt-4 space-y-2">
            <Label className="text-xs">Period</Label>
            <select value={revPeriod} onChange={(e) => setRevPeriod(e.target.value)} className="w-full border border-border rounded-md h-10 px-3 bg-background text-sm">
              <option value="this">This Month</option><option value="last">Last Month</option><option value="custom">Custom</option>
            </select>
          </div>
          <Button variant="outline" className="w-full mt-4 border-primary text-primary hover:bg-primary/10"
            onClick={() => download(`${API_BASE}/dashboard/export?period=${revPeriod}`, `revenue-${revPeriod}.csv`, "Revenue CSV")}>Download CSV</Button>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl">
        <div className="px-5 py-4 border-b border-border font-semibold text-navy">Recent Downloads</div>
        {history.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No downloads yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground"><tr>
              <th className="text-left px-4 py-3">File</th><th className="text-left px-4 py-3">Type</th><th className="text-left px-4 py-3">Generated</th>
            </tr></thead>
            <tbody>{history.map((h, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{h.name}</td>
                <td className="px-4 py-3">{h.type}</td>
                <td className="px-4 py-3">{h.at.toLocaleString()}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}