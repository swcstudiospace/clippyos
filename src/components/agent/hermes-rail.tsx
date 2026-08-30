import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import type { AgentPreset } from "@/lib/agent";
import { publishedMcpEndpoints } from "@/lib/app-hosts";
import { HERMES_CONNECTION_LABELS, PLAYBOOK_PACKAGE_VERSION, type HermesConnectStatus } from "@/lib/connect";
import { crayoHermesPlaybooks } from "@/lib/playbooks";

const PLAYBOOK_TO_PRESET: Record<string, AgentPreset> = {
  crayo_short_to_library: "crayo-short",
  crayo_autoclip_to_library: "crayo-autoclip",
};

function connectionTone(state: HermesConnectStatus["hermesConnection"]) {
  if (state === "fully_connected") return "green" as const;
  if (state === "key_only") return "orange" as const;
  return "neutral" as const;
}

export function HermesCrayoRail({
  connect,
  onRunPlaybook,
}: {
  connect: HermesConnectStatus | null | undefined;
  onRunPlaybook: (preset: AgentPreset) => void;
}) {
  const mcp = publishedMcpEndpoints().canonical;
  const connection = connect?.hermesConnection ?? "not_connected";
  const playbooks = crayoHermesPlaybooks();

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
        This tab is the Crayo front of Hermes. Hermes talks to ClippyOS over MCP; finished files land in Library
        (Filebase).
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
        <p className="mb-1.5 text-caption text-muted">Playbook skills</p>
        <div className="flex flex-col gap-2">
          {playbooks.map((book) => (
            <button
              key={book.id}
              type="button"
              className="rounded-control border border-border bg-secondary-surface px-3 py-2 text-left"
              onClick={() => {
                const preset = PLAYBOOK_TO_PRESET[book.id];
                if (preset) onRunPlaybook(preset);
              }}
            >
              <span className="block text-body font-medium">{book.name}</span>
              <span className="block text-caption text-muted">{book.summary}</span>
            </button>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
