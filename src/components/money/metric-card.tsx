import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  amount,
  hint,
  loading = false,
  tone = "default",
}: {
  label: string;
  value: string;
  amount?: number;
  hint?: string;
  loading?: boolean;
  tone?: "default" | "success" | "danger";
}) {
  const numeric =
    typeof amount === "number" && Number.isFinite(amount) ? amount : null;
  const abs = numeric == null ? 0 : Math.abs(numeric);
  const decimals = abs % 1 === 0 ? 0 : 2;

  return (
    <GlassCard className="min-w-0 overflow-hidden">
      <p className="text-caption text-muted">{label}</p>
      {loading ? (
        <>
          <Skeleton className="mt-2 h-9 w-36" />
          <Skeleton className="mt-2 h-4 w-24" />
        </>
      ) : (
        <>
          <p
            key={`${label}-${value}`}
            className={cn(
              "metric-in mt-1 min-w-0 text-section font-semibold tracking-tight break-words tabular-nums sm:text-page",
              tone === "success" && "text-success",
              tone === "danger" && "text-danger",
            )}
          >
            {numeric == null ? (
              value
            ) : (
              <NumberTicker
                value={abs}
                prefix={numeric < 0 ? "-$" : "$"}
                decimalPlaces={decimals}
              />
            )}
          </p>
          {hint ? <p className="mt-1 text-caption text-muted">{hint}</p> : null}
        </>
      )}
    </GlassCard>
  );
}

export function MetricCardRowSkeleton() {
  const labels = [
    "Total Revenue",
    "Current MRR",
    "Projected Annual",
    "Overall Profit",
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {labels.map((label) => (
        <MetricCard key={label} label={label} value="" loading />
      ))}
    </div>
  );
}
