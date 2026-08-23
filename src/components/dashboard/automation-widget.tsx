import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bot } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { getAutonomyHealth } from "@/lib/server/autonomy-admin";
import { AUTONOMY_HEALTH_QUERY_KEY, type HermesConnectionState } from "@/lib/autonomy";
import { HERMES_CONNECTION_LABELS } from "@/lib/connect";
import { GROK_BOT_CONNECTION_LABELS, grokBotConnectionTone } from "@/lib/grok-bot";
import { formatRelativeTime } from "@/lib/format";

export function AutomationWidget({
  atRisk = 0,
  overdueCount = 0,
  stuckStages = 0,
}: {
  atRisk?: number;
  overdueCount?: number;
  stuckStages?: number;
}) {
  const health = useQuery({
    queryKey: AUTONOMY_HEALTH_QUERY_KEY,
    queryFn: () => getAutonomyHealth(),
  });
  const data = health.data;
  const openEscalations = atRisk + overdueCount + stuckStages;

  let tone: "green" | "orange" | "red" | "neutral" | "blue" = "neutral";
  let label = "Hermes: Not connected";
  const connection: HermesConnectionState = data?.hermesConnection ?? "not_connected";
  if (data && !data.automationEnabled) {
    tone = "orange";
    label = "Paused";
  } else if (connection === "fully_connected") {
    tone = "green";
    label = `Hermes: ${HERMES_CONNECTION_LABELS.fully_connected}`;
  } else if (connection === "key_only") {
    tone = "blue";
    label = `Hermes: ${HERMES_CONNECTION_LABELS.key_only}`;
  }

  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <Bot className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-card font-semibold tracking-tight">Hermes</h2>
            <p className="mt-1 text-caption text-muted">
              Paste credentials into Hermes from Settings → Connect Hermes. Agency Admin is the server.
            </p>
          </div>
        </div>
        {health.isPending ? (
          <Skeleton className="h-6 w-28 rounded-full" />
        ) : (
          <Badge tone={tone}>{label}</Badge>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-control bg-secondary-surface/50 px-3 py-3">
          <dt className="text-caption text-muted">Open escalations</dt>
          <dd className="text-page font-semibold tabular-nums">
            <NumberTicker value={openEscalations} />
          </dd>
        </div>
        <div className="rounded-control bg-secondary-surface/50 px-3 py-3">
          <dt className="text-caption text-muted">At-risk 30d</dt>
          <dd className="text-page font-semibold tabular-nums">
            <NumberTicker value={atRisk} />
          </dd>
        </div>
        <div className="rounded-control bg-secondary-surface/50 px-3 py-3">
          <dt className="text-caption text-muted">Overdue invoices</dt>
          <dd className="text-page font-semibold tabular-nums">
            <NumberTicker value={overdueCount} />
          </dd>
        </div>
        <div className="rounded-control bg-secondary-surface/50 px-3 py-3">
          <dt className="text-caption text-muted">Stuck stages</dt>
          <dd className="text-page font-semibold tabular-nums">
            <NumberTicker value={stuckStages} />
          </dd>
        </div>
      </dl>

      {data?.social ? (
        <div className="flex flex-wrap items-center gap-2 rounded-control bg-secondary-surface/50 px-3 py-3">
          <p className="text-caption font-medium">Social Machine</p>
          <Badge
            tone={
              data.social.state === "running"
                ? "green"
                : data.social.state === "not_configured"
                  ? "neutral"
                  : "blue"
            }
          >
            {data.social.state === "running" ? "Running" : data.social.configured ? "Stopped" : "Not configured"}
          </Badge>
          {data.social.needsLogin > 0 ? (
            <Badge tone="orange">{data.social.needsLogin} need login</Badge>
          ) : null}
          {data.social.needsAttention > 0 ? (
            <Badge tone="orange">{data.social.needsAttention} need attention</Badge>
          ) : null}
          {data.social.failedJobs > 0 ? (
            <Badge tone="red">{data.social.failedJobs} failed</Badge>
          ) : null}
        </div>
      ) : null}

      {data?.grokBot ? (
        <div className="flex flex-wrap items-center gap-2 rounded-control bg-secondary-surface/50 px-3 py-3">
          <p className="text-caption font-medium">Grok Bot</p>
          <Badge tone={grokBotConnectionTone(data.grokBot.connection)}>
            {GROK_BOT_CONNECTION_LABELS[data.grokBot.connection]}
          </Badge>
          {data.grokBot.queued > 0 ? <Badge tone="orange">{data.grokBot.queued} queued</Badge> : null}
          {data.grokBot.claimed > 0 ? <Badge tone="purple">{data.grokBot.claimed} working</Badge> : null}
          <Button size="sm" variant="ghost" asChild className="ml-auto">
            <Link to="/settings" hash="grok-bot">
              Connect Grok Bot
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-muted">
          {data?.lastAction
            ? `Last agent action: ${data.lastAction.action}${data.lastAction.playbookId ? ` · ${data.lastAction.playbookId}` : ""} · ${formatRelativeTime(data.lastAction.at)}`
            : data?.lastActivityAt
              ? `Last activity ${formatRelativeTime(data.lastActivityAt)}`
              : "No agent activity yet."}
        </p>
        <Button size="sm" variant="secondary" asChild>
          <Link to="/settings" hash="hermes-connect">
            Connect Hermes
          </Link>
        </Button>
      </div>
    </GlassCard>
  );
}
