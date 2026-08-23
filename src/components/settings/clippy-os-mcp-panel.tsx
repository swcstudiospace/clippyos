import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, PlugZap, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShineBorder } from "@/components/magicui/shine-border";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { copyTextToClipboard } from "@/lib/clipboard";
import { userFacingErrorMessage } from "@/lib/errors";
import { formatRelativeTime } from "@/lib/format";
import {
  DEFAULT_MCP_PRESET,
  MCP_PRESET_LABELS,
  MCP_SCOPE_LABELS,
  REMOTE_MCP_QUERY_KEY,
  formatClippyOsMcpConnectorJson,
  type McpPresetId,
  type RemoteMcpSnapshot,
} from "@/lib/remote-mcp";
import {
  getRemoteMcpSnapshotFn,
  mintRemoteMcpTokenFn,
  revokeRemoteMcpTokenFn,
} from "@/lib/server/remote-mcp-fns";

async function copy(label: string, value: string) {
  const ok = await copyTextToClipboard(value);
  toast[ok ? "success" : "error"](ok ? `Copied ${label}` : "Couldn’t copy — select the text instead");
  return ok;
}

export function ClippyOsMcpPanel() {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("Grok Bot");
  const [preset, setPreset] = useState<McpPresetId>(DEFAULT_MCP_PRESET);
  const [secret, setSecret] = useState<{ value: string; json: string } | null>(null);

  const query = useQuery({
    queryKey: REMOTE_MCP_QUERY_KEY,
    queryFn: () => getRemoteMcpSnapshotFn(),
  });

  const mint = useMutation({
    mutationFn: () => mintRemoteMcpTokenFn({ data: { label: label.trim() || "ClippyOS MCP", preset } }),
    onSuccess: (result) => {
      queryClient.setQueryData(REMOTE_MCP_QUERY_KEY, result.snapshot);
      setSecret({
        value: result.plaintext,
        json: formatClippyOsMcpConnectorJson(result.snapshot.mcpUrl, result.plaintext),
      });
      toast.success("MCP token created — copy it now");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => revokeRemoteMcpTokenFn({ data: id }),
    onSuccess: (snap) => {
      queryClient.setQueryData(REMOTE_MCP_QUERY_KEY, snap);
      toast.success("Token revoked");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const connectorJson = useMemo(() => {
    const url = query.data?.mcpUrl ?? "/api/mcp";
    return formatClippyOsMcpConnectorJson(url);
  }, [query.data?.mcpUrl]);

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Couldn’t load ClippyOS MCP"
        description="Sign in again and retry."
        onRetry={() => void query.refetch()}
      />
    );
  }

  const snap: RemoteMcpSnapshot = query.data;
  const active = snap.tokens.filter((row) => !row.revokedAt);
  const revoked = snap.tokens.filter((row) => row.revokedAt);

  return (
    <section id="clippy-mcp" className="flex scroll-mt-24 flex-col gap-4">
      <div>
        <h2 className="text-section font-semibold tracking-tight">ClippyOS MCP</h2>
        <p className="mt-1 max-w-3xl text-body text-muted">
          Remote MCP for Grok Bot, Cursor, and other connectors. Bearer tokens are shown once. Tools follow the
          scopes you mint — publish still waits on Approvals, and secrets never leave the server.
        </p>
      </div>

      <GlassCard className="relative overflow-hidden">
        <ShineBorder shineColor={["var(--accent)", "var(--teal)", "var(--purple)"]} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
              <PlugZap className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-card font-semibold tracking-tight">Remote MCP server</h3>
              <p className="mt-1 text-caption text-muted">
                Streamable HTTP and SSE at a stable URL. Authorization: Bearer required. No anonymous tool list.
              </p>
            </div>
          </div>
          <Badge tone={active.length ? "green" : "neutral"}>
            {active.length ? `${active.length} live token${active.length === 1 ? "" : "s"}` : "No tokens"}
          </Badge>
        </div>

        <div className="mt-5 grid gap-3">
          <CopyRow label="MCP URL" value={snap.mcpUrl} />
          <CopyRow label="Connector JSON" value={connectorJson} />
        </div>

        <div className="mt-5 rounded-control bg-secondary-surface/60 px-3 py-3">
          <p className="font-medium">Grok Bot setup</p>
          <p className="mt-1 text-caption text-muted">
            grok.com/connectors → New Connector → Custom. Paste the MCP URL and header{" "}
            <span className="text-fg">Authorization: Bearer {"<token>"}</span>. The Bot lists only the tools this
            token is scoped for.
          </p>
          <Button variant="secondary" asChild className="mt-3 min-h-11">
            <a href={snap.connectorsUrl} target="_blank" rel="noreferrer">
              Open grok.com/connectors
            </a>
          </Button>
        </div>

        <form
          className="mt-5 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            mint.mutate();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mcp-token-label">Label</Label>
              <Input
                id="mcp-token-label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                maxLength={80}
                placeholder="Grok Bot"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mcp-token-preset">Preset</Label>
              <Select value={preset} onValueChange={(value) => setPreset(value as McpPresetId)}>
                <SelectTrigger id="mcp-token-preset" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {snap.presets.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {MCP_PRESET_LABELS[row.id]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-caption text-muted">
            {snap.presets
              .find((row) => row.id === preset)
              ?.scopes.map((scope) => MCP_SCOPE_LABELS[scope])
              .join(" · ")}
          </p>
          <Button type="submit" className="min-h-11" disabled={mint.isPending}>
            <KeyRound className="size-4" aria-hidden="true" />
            {mint.isPending ? "Minting…" : "Mint token"}
          </Button>
        </form>
      </GlassCard>

      <GlassCard>
        <h3 className="text-card font-semibold tracking-tight">Tokens</h3>
        <p className="mt-1 text-caption text-muted">Last four, label, and scopes. Secrets are never listed.</p>
        {active.length === 0 && revoked.length === 0 ? (
          <p className="mt-4 text-caption text-muted">No connector tokens yet. Mint one above.</p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {active.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 rounded-control bg-secondary-surface/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {row.label} · …{row.last4}
                  </p>
                  <p className="text-caption text-muted">
                    {row.scopes.filter((scope) => scope !== "mcp:discover").join(" · ") || "discover"}
                    {row.lastUsedAt ? ` · used ${formatRelativeTime(row.lastUsedAt)}` : " · unused"}
                    {` · ${formatRelativeTime(row.createdAt)}`}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="min-h-11"
                  disabled={revoke.isPending}
                  onClick={() => revoke.mutate(row.id)}
                >
                  <ShieldOff className="size-4" aria-hidden="true" />
                  Revoke
                </Button>
              </li>
            ))}
            {revoked.slice(0, 6).map((row) => (
              <li key={row.id} className="rounded-control px-3 py-2 text-caption text-muted">
                {row.label} · …{row.last4} · revoked {row.revokedAt ? formatRelativeTime(row.revokedAt) : ""}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <Dialog open={Boolean(secret)} onOpenChange={(open) => !open && setSecret(null)}>
        <DialogContent className="w-[min(100%-2rem,32rem)]">
          <DialogTitle>ClippyOS MCP token</DialogTitle>
          <DialogDescription>Store this in Grok Bot or Cursor now. It is shown once.</DialogDescription>
          <code className="mt-4 block max-h-40 overflow-auto break-all rounded-control bg-secondary-surface px-3 py-3 text-caption">
            {secret?.value}
          </code>
          {secret?.json ? (
            <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-control bg-secondary-surface px-3 py-2 text-caption">
              {secret.json}
            </pre>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="min-h-11"
              onClick={() => secret && void copy("MCP token", secret.value)}
            >
              <Copy className="size-4" aria-hidden="true" />
              Copy token
            </Button>
            <Button
              variant="secondary"
              className="min-h-11"
              onClick={() => secret && void copy("connector JSON", secret.json)}
            >
              Copy connector JSON
            </Button>
            <Button className="min-h-11" onClick={() => setSecret(null)}>
              I’ve saved it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-caption text-muted">{label}</p>
      <div className="flex gap-2">
        <code className="min-w-0 flex-1 truncate rounded-control bg-secondary-surface px-3 py-2 text-caption">
          {value || "—"}
        </code>
        <Button
          size="icon"
          variant="secondary"
          aria-label={`Copy ${label}`}
          onClick={() => void copy(label, value)}
          disabled={!value}
        >
          <Copy className="size-4" />
        </Button>
      </div>
    </div>
  );
}
