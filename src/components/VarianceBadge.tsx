import { cn } from "@/lib/utils";

export const computeVariance = (stationRate?: number | null, globalRate?: number | null) => {
  const s = Number(stationRate ?? 0);
  const g = Number(globalRate ?? 0);
  if (!g) return 0;
  return ((s - g) / g) * 100;
};

export function VarianceBadge({
  stationRate,
  globalRate,
  className,
}: {
  stationRate?: number | null;
  globalRate?: number | null;
  className?: string;
}) {
  const v = computeVariance(stationRate, globalRate);
  const abs = Math.abs(v).toFixed(1);
  let cls = "bg-muted text-muted-foreground";
  let label = "= Matches global rate";
  if (v > 0.05) {
    cls = "bg-success/15 text-success";
    label = `▲ ${abs}% above global`;
  } else if (v < -0.05) {
    cls = "bg-warning/15 text-warning";
    label = `▼ ${abs}% below global`;
  }
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", cls, className)}>
      {label}
    </span>
  );
}