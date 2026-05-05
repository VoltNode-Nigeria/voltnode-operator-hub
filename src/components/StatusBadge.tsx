import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  AVAILABLE: "bg-success/15 text-success",
  OCCUPIED: "bg-primary/15 text-primary",
  FAULT: "bg-destructive/15 text-destructive",
  OFFLINE: "bg-muted text-muted-foreground",
  ACTIVE: "bg-success/15 text-success",
  PENDING: "bg-warning/15 text-warning",
  COMPLETED: "bg-primary/15 text-primary",
  PAID: "bg-success/15 text-success",
  FAILED: "bg-destructive/15 text-destructive",
  INACTIVE: "bg-muted text-muted-foreground",
  MAINTENANCE: "bg-warning/15 text-warning",
};

export const StatusBadge = ({ status }: { status?: string | null }) => {
  const s = (status || "").toUpperCase();
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", styles[s] || "bg-muted text-muted-foreground")}>
      {s || "—"}
    </span>
  );
};