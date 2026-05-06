import { Construction } from "lucide-react";

export default function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
        <Construction className="h-8 w-8" />
      </div>
      <h2 className="text-2xl font-bold text-navy mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {description || "This feature is coming soon. The backend endpoint is not yet available — check back shortly."}
      </p>
      <div className="inline-block mt-5 px-3 py-1 rounded-full bg-warning/15 text-warning text-xs font-semibold uppercase tracking-wide">
        Coming Soon
      </div>
    </div>
  );
}