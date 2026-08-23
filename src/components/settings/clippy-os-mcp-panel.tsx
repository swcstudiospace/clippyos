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
import { formatClippyOsMcpOauthConnectorJson } from "@/lib/mcp-oauth";
import {
  getRemoteMcpSnapshotFn,
  mintRemoteMcpTokenFn,
  revokeRemoteMcpTokenFn,
} from "@/lib/server/remote-mcp-fns";
import { revokeMcpOAuthGrantFn } from "@/lib/server/mcp-oauth-fns";

async function copy(label: string, value: string) {
  const ok = await copyTextToClipboard(value);
  toast[ok ? "success" : "error"](ok ? `Copied ${label}` : "Couldn’t copy — select the text instead");
  return ok;
}

export function ClippyOsMcpPanel() {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("Hermes");
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

  const revokeGrant = useMutation({
    mutationFn: (id: string) => revokeMcpOAuthGrantFn({ data: id }),
    onSuccess: (snap) => {
      queryClient.setQueryData(REMOTE_MCP_QUERY_KEY, snap);
      toast.success("OAuth grant revoked");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const connectorJson = useMemo(() => {
    const url = query.data?.mcpUrl ?? "/api/mcp";
    return formatClippyOsMcpOauthConnectorJson(url);
  }, [query.data?.mcpUrl]);
  const bearerJson = useMemo(() => {
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
  const activeGrants = (snap.grants ?? []).filter((row) => !row.revokedAt);

  return (
    <section id="clippy-mcp" className="flex scroll-mt-24 flex-col gap-4">
      <div>
        <h2 className="text-section font-semibold tracking-tight">ClippyOS MCP</h2>
        <p className="mt-1 max-w-3xl text-body text-muted">
          Grok connectors sign in with OAuth. Hermes can still use a bearer key. Same workspace on
          os.swcstudio.space and clippyos.grok.me — paste either MCP URL. Publish waits on Approvals,
          and secrets never leave the server.
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
                Streamable HTTP. Grok discovers OAuth from the MCP URL. Hermes keys still work as Bearer.
              </p>
            </div>
          </div>
          <Badge tone={activeGrants.length || active.length ? "green" : "neutral"}>
            {activeGrants.length
              ? `${activeGrants.length} OAuth grant${activeGrants.length === 1 ? "" : "s"}`
              : active.length
                ? `${active.length} live key${active.length === 1 ? "" : "s"}`
                : "Not connected"}
          </Badge>
        </div>

        <div className="mt-5 grid gap-3">
          <CopyRow label="MCP URL · os.swcstudio.space" value={snap.mcpUrl} />
          <CopyRow label="MCP URL · clippyos.grok.me" value={snap.mcpAliasUrl} />
          <CopyRow label="Grok connector JSON" value={connectorJson} />
        </div>

        <div className="mt-5 rounded-control bg-secondary-surface/60 px-3 py-3">
          <p className="font-medium">Connect Grok with OAuth</p>
          <p className="mt-1 text-caption text-muted">
            grok.com/connectors → New Connector → Custom. Paste either MCP URL — prefer the custom domain.
            Grok will open ClippyOS so an admin can approve access. No bearer key.
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
          <div>
            <p className="font-medium">Hermes key (optional)</p>
            <p className="mt-1 text-caption text-muted">
              Mint a bearer token for Hermes or other clients that cannot complete OAuth. Shown once.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mcp-token-label">Label</Label>
              <Input
                id="mcp-token-label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                maxLength={80}
                placeholder="Hermes"
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
          <Button type="submit" variant="secondary" className="min-h-11" disabled={mint.isPending}>
            <KeyRound className="size-4" aria-hidden="true" />
            {mint.isPending ? "Minting…" : "Mint Hermes key"}
          </Button>
          <CopyRow label="Hermes connector JSON" value={bearerJson} />
        </form>
      </GlassCard>

      <GlassCard>
        <h3 className="text-card font-semibold tracking-tight">OAuth grants</h3>
        <p className="mt-1 text-caption text-muted">Grok and other connectors that signed in. Revoke to disconnect.</p>
        {activeGrants.length === 0 ? (
          <p className="mt-4 text-caption text-muted">No OAuth connections yet. Add the MCP URL in Grok first.</p>
        ) : (
          <ul className="mt-4 grid gap-2">
            {activeGrants.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 rounded-control bg-secondary-surface/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{row.clientName}</p>
                  <p className="text-caption text-muted">
                    {row.scopes.filter((scope) => scope !== "mcp:discover").join(" · ") || "discover"}
                    {row.lastUsedAt ? ` · used ${formatRelativeTime(row.lastUsedAt)}` : " · unused"}
                    {` · ${formatRelativeTime(row.createdAt)}`}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="min-h-11"
                  disabled={revokeGrant.isPending}
                  onClick={() => revokeGrant.mutate(row.id)}
                >
                  <ShieldOff className="size-4" aria-hidden="true" />
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <GlassCard>
        <h3 className="text-card font-semibold tracking-tight">Hermes keys</h3>
        <p className="mt-1 text-caption text-muted">Last four, label, and scopes. Secrets are never listed.</p>
        {active.length === 0 && revoked.length === 0 ? (
          <p className="mt-4 text-caption text-muted">No Hermes keys yet. Mint one above if you need bearer auth.</p>
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
          <DialogDescription>Store this in Hermes now. Grok should use OAuth instead. Shown once.</DialogDescription>
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
