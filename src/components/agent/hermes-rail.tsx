import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { publishedMcpEndpoints } from "@/lib/app-hosts";
import { HERMES_CONNECTION_LABELS, PLAYBOOK_PACKAGE_VERSION, type HermesConnectStatus } from "@/lib/connect";
import type { CrayoAccountSnapshot } from "@/lib/server/studio-fns";

function connectionTone(state: HermesConnectStatus["hermesConnection"]) {
  if (state === "fully_connected") return "green" as const;
  if (state === "key_only") return "orange" as const;
  return "neutral" as const;
}

export function HermesCrayoRail({
  connect,
  crayo,
  plannerName,
  model,
}: {
  connect: HermesConnectStatus | null | undefined;
  crayo: CrayoAccountSnapshot | null | undefined;
  plannerName: string;
  model: string;
}) {
  const mcp = publishedMcpEndpoints().canonical;
  const connection = connect?.hermesConnection ?? "not_connected";

  return (
    <GlassCard className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={connectionTone(connection)}>Hermes: {HERMES_CONNECTION_LABELS[connection]}</Badge>
        <Badge tone={connect?.mcpConfigured ? "green" : "orange"}>
          {connect?.mcpConfigured ? "MCP live" : "MCP off"}
        </Badge>
        <Badge tone="purple">Playbook {PLAYBOOK_PACKAGE_VERSION}</Badge>
      </div>
      <p className="text-caption text-muted">
        This is the in-app Hermes Agent. Crayo.ai is a specialty (shorts, voice, stills, AutoClip) — not a fourth
        planner. {plannerName} ({model}) plans free-text and /ideas.
      </p>
      <p className="truncate font-mono text-caption text-muted" title={mcp}>
        {mcp}
      </p>
      {connection === "not_connected" ? (
        <Link to="/settings" hash="hermes-connect" className="text-caption text-accent underline">
          Connect Hermes in Settings
        </Link>
      ) : null}
      <div>
        <p className="text-body font-medium">
          {crayo?.configured ? (crayo.plan ? `Crayo · ${crayo.plan}` : "Crayo connected") : "Crayo key missing"}
        </p>
        {crayo?.credits ? (
          <p className="text-caption text-muted">
            export {crayo.credits.export} · voice {crayo.credits.voiceover} · image {crayo.credits.image} · video{" "}
            {crayo.credits.video}
          </p>
        ) : (
          <p className="text-caption text-muted">{crayo?.error ?? "Credits appear after CRAYO_API_KEY is live."}</p>
        )}
      </div>
    </GlassCard>
  );
}
