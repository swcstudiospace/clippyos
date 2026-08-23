import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { HERMES_CONNECTION_LABELS } from "@/lib/connect";
import { GROK_BOT_CONNECTION_LABELS } from "@/lib/grok-bot";
import { formatRelativeTime } from "@/lib/format";
import type { HealthHermesRuntime } from "@/lib/health";

export function HermesRuntimeCard({ runtime }: { runtime: HealthHermesRuntime }) {
  const connectionTone =
    runtime.connection === "fully_connected" ? "green" : runtime.connection === "key_only" ? "blue" : "neutral";
  return (
    <GlassCard className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-card font-semibold tracking-tight">Hermes worker</h3>
          <p className="mt-1 text-caption text-muted">
            Last login is the last successful MCP or API key use. Revoked tokens cannot sign in.
          </p>
        </div>
        <Badge tone={connectionTone}>{HERMES_CONNECTION_LABELS[runtime.connection]}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <dt className="text-caption text-muted">Last login</dt>
          <dd className="text-body font-medium">{formatRelativeTime(runtime.lastLoginAt) || "Never"}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Key</dt>
          <dd className="text-body font-medium">
            {runtime.keyName ?? "—"}
            {runtime.keyLast4 ? ` · …${runtime.keyLast4}` : ""}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-muted">Playbook</dt>
          <dd className="text-body font-medium">{runtime.playbookPackageVersion}</dd>
        </div>
        <div>
          <dt className="text-caption text-muted">MCP last use</dt>
          <dd className="text-body font-medium">{formatRelativeTime(runtime.mcpLastUsedAt) || "Never"}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Badge tone={runtime.pastedIntoHermes ? "green" : "orange"}>
          {runtime.pastedIntoHermes ? "Playbook pasted" : "Playbook not pasted"}
        </Badge>
        <Badge tone={runtime.mcpConfigured ? "green" : "neutral"}>
          {runtime.mcpConfigured ? `MCP …${runtime.mcpLast4 ?? "ok"}` : "MCP not minted"}
        </Badge>
        {runtime.grokBot ? (
          <Badge tone={runtime.grokBot.connection === "online" || runtime.grokBot.connection === "working" ? "green" : "neutral"}>
            Grok Bot {GROK_BOT_CONNECTION_LABELS[runtime.grokBot.connection]} · {runtime.grokBot.queued} queued
          </Badge>
        ) : null}
        <Badge tone={runtime.revokedTokenCount ? "orange" : "neutral"}>
          {runtime.activeTokenCount} live · {runtime.revokedTokenCount} revoked
        </Badge>
      </div>
      {runtime.scopes.length ? (
        <p className="text-caption text-muted">Scopes: {runtime.scopes.join(", ")}</p>
      ) : null}
      <div>
        <p className="text-caption text-muted">
          Last delivery{" "}
          {runtime.lastDelivery.at
            ? `${runtime.lastDelivery.eventType ?? "event"} · ${runtime.lastDelivery.status ?? "—"} · ${formatRelativeTime(runtime.lastDelivery.at)}`
            : "none yet"}
        </p>
        {runtime.recentAudit.length ? (
          <ul className="mt-2 space-y-1">
            {runtime.recentAudit.slice(0, 5).map((row) => (
              <li key={row.id} className="text-caption text-muted">
                {row.source} · {row.action} · {row.result}
                {row.errorCode ? ` · ${row.errorCode}` : ""} · {formatRelativeTime(row.createdAt)}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </GlassCard>
  );
}
