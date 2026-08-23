import { MetricCard } from "@/components/money/metric-card";
import { formatDurationMs, formatRate, type HealthSlo } from "@/lib/health";

export function SloStrip({ slos }: { slos: HealthSlo }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        label="Upload success 24h"
        value={formatRate(slos.uploadSuccessRate24h)}
        hint={slos.uploadP95Ms != null ? `p95 ${formatDurationMs(slos.uploadP95Ms)}` : "From upload jobs"}
      />
      <MetricCard
        label="Render success 24h"
        value={formatRate(slos.renderSuccessRate24h)}
        hint={slos.renderP95Ms != null ? `p95 ${formatDurationMs(slos.renderP95Ms)}` : "From render jobs"}
      />
      <MetricCard
        label="Queue depth"
        value={String(slos.queueDepth)}
        hint={`${slos.stalled} stalled · ${slos.awaitingApproval} awaiting approval`}
      />
      <MetricCard
        label="Needs login"
        value={String(slos.needsLogin)}
        hint={slos.failRate24h != null ? `${formatRate(slos.failRate24h)} fail rate 24h` : "Session health"}
      />
    </div>
  );
}
