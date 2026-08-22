import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { DashboardAlert } from "@/lib/dashboard";
import { DASHBOARD_ALERTS_SESSION_KEY } from "@/lib/constants";
import { DashLink } from "@/components/dashboard/dash-link";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function readDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(DASHBOARD_ALERTS_SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function writeDismissed(ids: string[]) {
  window.sessionStorage.setItem(DASHBOARD_ALERTS_SESSION_KEY, JSON.stringify(ids));
}

export function AlertStrip({
  alerts,
  loading,
}: {
  alerts: DashboardAlert[];
  loading: boolean;
}) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  const visible = useMemo(
    () => alerts.filter((alert) => !dismissed.includes(alert.id)),
    [alerts, dismissed],
  );

  function dismiss(id: string) {
    const next = [...new Set([...dismissed, id])];
    setDismissed(next);
    writeDismissed(next);
  }

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2" aria-hidden="true">
        <Skeleton className="h-11 w-56" />
        <Skeleton className="h-11 w-44" />
      </div>
    );
  }

  if (visible.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Attention needed"
      className="flex flex-wrap gap-2"
    >
      {visible.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            "glass-card flex min-h-11 items-stretch overflow-hidden p-0",
            alert.severity === "critical" && "border-danger/45 bg-danger/10",
            alert.severity === "warning" && "border-warning/45 bg-warning/10",
          )}
        >
          <DashLink
            href={alert.href}
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2 px-3 py-2 text-caption font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <AlertTriangle
              className={cn(
                "size-4 shrink-0",
                alert.severity === "critical" ? "text-danger" : "text-warning",
              )}
              aria-hidden="true"
            />
            <span className="min-w-0 text-pretty">{alert.title}</span>
          </DashLink>
          <button
            type="button"
            className="grid min-h-11 min-w-11 place-items-center text-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={`Dismiss ${alert.title}`}
            onClick={() => dismiss(alert.id)}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
