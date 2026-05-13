import { useState } from "react";
import { useStations } from "@/lib/hooks";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, FileText } from "lucide-react";

export default function Reports() {
  const { data: stations = [] } = useStations();
  const [csvStationId, setCsvStationId] = useState("ALL");
  const [csvFrom, setCsvFrom] = useState("");
  const [csvTo, setCsvTo] = useState("");

  const downloadCsv = async () => {
    if (!csvFrom || !csvTo) return;
    const params = new URLSearchParams({ from: csvFrom, to: csvTo });
    if (csvStationId !== "ALL") params.append("stationId", csvStationId);
    const response = await api.get(`/dashboard/export?${params}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `voltnode-sessions-${csvFrom}-to-${csvTo}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Card 1 — Session CSV Export */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Session Export</h3>
            <p className="text-sm text-muted-foreground">
              Download raw session data for any date range as a CSV file.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Station</label>
            <select
              value={csvStationId}
              onChange={(e) => setCsvStationId(e.target.value)}
              className="border border-border rounded-lg px-3 h-10 text-sm bg-background w-full"
            >
              <option value="ALL">All Stations</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">From</label>
              <Input type="date" value={csvFrom} onChange={(e) => setCsvFrom(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground block mb-1">To</label>
              <Input type="date" value={csvTo} onChange={(e) => setCsvTo(e.target.value)} />
            </div>
          </div>
        </div>

        <Button
          onClick={downloadCsv}
          disabled={!csvFrom || !csvTo}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          Download CSV
        </Button>
      </div>

      {/* Card 2 — Bankability PDF Report */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-warning/10 text-warning">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">Monthly Bankability Report</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                In Development
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Full monthly summary suitable for investor and partner reporting. PDF generation coming soon.
            </p>
          </div>
        </div>

        <Button disabled variant="secondary" className="w-full bg-gray-200 text-gray-500 cursor-not-allowed">
          Generate PDF
        </Button>
      </div>
    </div>
  );
}
