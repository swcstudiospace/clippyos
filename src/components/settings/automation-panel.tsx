import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Copy, KeyRound, Radio, ShieldAlert, Webhook } from "lucide-react";
import { toast } from "sonner";
import {
  API_KEY_SCOPES,
  AUTONOMY_AUDIT_QUERY_KEY,
  AUTONOMY_QUERY_KEY,
  DEFAULT_HERMES_SCOPES,
  INBOUND_COMMANDS,
  MCP_TOOLS,
  SCOPE_LABELS,
  WEBHOOK_EVENT_LABELS,
  WEBHOOK_EVENT_TYPES,
  type ApiKeyScope,
  type WebhookEventType,
} from "@/lib/autonomy";
import { PLAYBOOK_POLICY_LABELS, type PlaybookPolicies } from "@/lib/playbooks";
import { getIntegrationsStatus } from "@/lib/server/integrations";
import { INTEGRATIONS_QUERY_KEY } from "@/lib/integrations";
import {
  createAutonomyKey,
  getAutonomySnapshot,
  listAutonomyAudit,
  revokeAutonomyKey,
  rotateAutonomyKey,
  rotateMcpToken,
  rotateWebhookSecret,
  saveAutomationSettings,
  saveOutboundWebhook,
} from "@/lib/server/autonomy-admin";
import { copyTextToClipboard } from "@/lib/clipboard";
import { formatRelativeTime } from "@/lib/format";
import { userFacingErrorMessage } from "@/lib/errors";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PlaybookCatalog } from "@/components/settings/playbook-catalog";
import { HermesConnect } from "@/components/settings/hermes-connect";
import { BrowserRuntimeCard, EventBusCard, OsFramingBanner, SandboxSecurityCard } from "@/components/settings/os-layer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { publishedMcpEndpoints } from "@/lib/app-hosts";

function origin(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

async function copy(label: string, value: string) {
  const ok = await copyTextToClipboard(value);
  toast[ok ? "success" : "error"](ok ? `Copied ${label}` : "Couldn’t copy — select the text instead");
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

function SecretReveal({
  title,
  value,
  warning,
  onDone,
}: {
  title: string;
  value: string;
  warning: string;
  onDone: () => void;
}) {
  return (
    <Dialog open={Boolean(value)} onOpenChange={(open) => !open && onDone()}>
      <DialogContent className="w-[min(100%-2rem,32rem)]">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{warning}</DialogDescription>
        <div className="mt-4 flex gap-2">
          <code className="min-w-0 flex-1 break-all rounded-control bg-secondary-surface px-3 py-3 text-caption">
            {value}
          </code>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Copy secret"
            onClick={() => void copy("secret", value)}
          >
            <Copy className="size-4" />
          </Button>
        </div>
        <Button className="mt-4" onClick={onDone}>
          I’ve saved it
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export function AutomationPanel() {
  const queryClient = useQueryClient();
  const roleQuery = useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: () => getIntegrationsStatus(),
  });
  const isAdmin = roleQuery.data?.role === "admin";
  const snap = useQuery({
    queryKey: AUTONOMY_QUERY_KEY,
    queryFn: () => getAutonomySnapshot(),
    enabled: isAdmin,
  });
  const audit = useQuery({
    queryKey: AUTONOMY_AUDIT_QUERY_KEY,
    queryFn: () => listAutonomyAudit(),
    enabled: isAdmin,
  });

  const [keyName, setKeyName] = useState("Hermes");
  const [scopes, setScopes] = useState<ApiKeyScope[]>([...DEFAULT_HERMES_SCOPES]);
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [plainTitle, setPlainTitle] = useState("API key");
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [rotateId, setRotateId] = useState<string | null>(null);
  const [outboundUrl, setOutboundUrl] = useState("");
  const [outboundEvents, setOutboundEvents] = useState<WebhookEventType[]>([...WEBHOOK_EVENT_TYPES]);
  const [sourceFilter, setSourceFilter] = useState<"all" | "api" | "mcp" | "webhook">("all");
  const [actionFilter, setActionFilter] = useState("");
  const [playbookFilter, setPlaybookFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [plainWarning, setPlainWarning] = useState(
    "Store this in Hermes now; it won’t be shown again.",
  );
  const [mcpPlain, setMcpPlain] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [policies, setPolicies] = useState<PlaybookPolicies | null>(null);
  const [pauseOpen, setPauseOpen] = useState(false);

  const base = origin();
  const apiBase = `${base}/api/v1`;
  const endpoints = publishedMcpEndpoints();
  const mcpUrl = endpoints.canonical;
  const mcpAliasUrl = endpoints.alias;
  const webhookUrl = `${base}/api/webhooks/inbound`;

  const data = snap.data;
  useEffect(() => {
    if (!data) return;
    setOutboundUrl(data.outboundUrl ?? "");
    if (data.outboundEvents.length) setOutboundEvents(data.outboundEvents);
    setEnabled(data.automationEnabled);
    setPolicies(data.policies);
  }, [data]);

  const createKey = useMutation({
    mutationFn: () => createAutonomyKey({ data: { name: keyName.trim(), scopes } }),
    onSuccess: async (result) => {
      setPlainTitle("API key");
      setPlainWarning("Store this in Hermes now; it won’t be shown again.");
      setPlaintext(result.plaintext);
      await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
      toast.success("API key created — copy it now");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => revokeAutonomyKey({ data: id }),
    onSuccess: async () => {
      setRevokeId(null);
      toast.success("Key revoked");
      await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const rotate = useMutation({
    mutationFn: (id: string) => rotateAutonomyKey({ data: id }),
    onSuccess: async (result) => {
      setRotateId(null);
      setPlainTitle("Rotated API key");
      setPlainWarning("Store this in Hermes now; it won’t be shown again.");
      setPlaintext(result.plaintext);
      await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const mcp = useMutation({
    mutationFn: () => rotateMcpToken(),
    onSuccess: async (result) => {
      setPlainTitle("MCP token");
      setPlainWarning("Store this in Hermes now; it won’t be shown again.");
      setMcpPlain(result.plaintext);
      setPlaintext(result.plaintext);
      await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const webhook = useMutation({
    mutationFn: () => rotateWebhookSecret(),
    onSuccess: async (result) => {
      setPlainTitle("Webhook signing secret");
      setPlainWarning(
        "Store this in Hermes now; it won’t be shown again. We keep it only to verify inbound signatures.",
      );
      setPlaintext(result.plaintext);
      await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const saveOutbound = useMutation({
    mutationFn: () =>
      saveOutboundWebhook({
        data: { destinationUrl: outboundUrl.trim() || null, events: outboundEvents },
      }),
    onSuccess: () => toast.success("Outbound webhook saved"),
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const saveSettings = useMutation({
    mutationFn: (next: { enabled: boolean; policies: PlaybookPolicies }) =>
      saveAutomationSettings({ data: next }),
    onSuccess: async (_result, next) => {
      setEnabled(next.enabled);
      setPolicies(next.policies);
      setPauseOpen(false);
      await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
      toast.success(next.enabled ? "Automation settings saved" : "Hermes mutations paused");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  if (roleQuery.isPending || (isAdmin && snap.isPending)) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <section id="automation" className="scroll-mt-24">
        <h2 className="text-section font-semibold tracking-tight">Automation & Hermes</h2>
        <p className="mt-1 text-body text-muted">
          Only workspace admins can mint API keys, MCP tokens, and webhook secrets.
        </p>
      </section>
    );
  }

  if (snap.isError || !data) {
    return (
      <ErrorState
        title="Couldn’t load automation"
        description="Only workspace admins can manage Hermes credentials."
        onRetry={() => void snap.refetch()}
      />
    );
  }

  const grouped = MCP_TOOLS.reduce<Record<string, typeof MCP_TOOLS>>((acc, tool) => {
    acc[tool.domain] = [...(acc[tool.domain] ?? []), tool];
    return acc;
  }, {});

  const auditRows = (audit.data ?? []).filter((row) => {
    if (sourceFilter !== "all" && row.source !== sourceFilter) return false;
    if (actionFilter && !row.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
    if (
      playbookFilter &&
      !(row.playbookId ?? "").toLowerCase().includes(playbookFilter.toLowerCase()) &&
      !(row.runId ?? "").toLowerCase().includes(playbookFilter.toLowerCase())
    ) {
      return false;
    }
    if (dateFilter && !row.createdAt.startsWith(dateFilter)) return false;
    return true;
  });

  const hermesConfig = JSON.stringify(
    {
      mcpServers: {
        "clippy-admin": {
          url: mcpUrl,
          headers: {
            Authorization: `Bearer ${mcpPlain ?? "<MCP_TOKEN>"}`,
          },
        },
      },
    },
    null,
    2,
  );

  function toggleScope(scope: ApiKeyScope) {
    setScopes((current) =>
      current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope],
    );
  }

  function onCreate(event: FormEvent) {
    event.preventDefault();
    if (!keyName.trim() || scopes.length === 0) return;
    createKey.mutate();
  }

  return (
    <section id="automation" className="flex scroll-mt-24 flex-col gap-4">
      <div>
        <h2 className="text-section font-semibold tracking-tight">Automation & Hermes</h2>
        <p className="mt-1 max-w-3xl text-body text-muted">
          ClippyOS exposes API, MCP, and Webhooks so Hermes can run the agency autonomously.
          Complete Connect Hermes below, paste credentials into Hermes, and use the Playbook as
          the operating manual.
        </p>
      </div>

      <OsFramingBanner />

      <div id="hermes-connect">
      <HermesConnect
        data={data}
        origin={base}
        enabled={enabled}
        policies={policies ?? data.policies}
        onPolicies={(next) => setPolicies(next)}
        onPlaintext={(title, value, warning) => {
          setPlainTitle(title);
          setPlaintext(value);
          setPlainWarning(warning);
        }}
      />
      </div>

      <BrowserRuntimeCard data={data} policies={policies ?? data.policies} />
      <SandboxSecurityCard />

      <GlassCard className="border-warning/40 bg-warning/8">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 size-5 text-warning" aria-hidden="true" />
          <div>
            <p className="font-medium">Human-only boundary</p>
            <p className="mt-1 text-caption text-muted">
              Credentials cannot access integration secrets, Super Admin password, or Disconnect.
              Those remain human-only. Operator can revoke Hermes keys instantly (kill switch).
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-card font-semibold tracking-tight">Kill switch & policies</h3>
            <p className="text-caption text-muted">
              AUTOMATION_ENABLED pauses AGENT-sourced mutations. Human UI stays live. Defaults
              prevent auto mark-paid, evidence-free stage advances, and auto-creating clients from
              CLOSED leads.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={enabled ? "green" : "orange"}>{enabled ? "Live" : "Paused"}</Badge>
            <Switch
              checked={enabled}
              aria-label="Automation enabled"
              onCheckedChange={(next) => {
                if (!policies) return;
                if (!next) {
                  setPauseOpen(true);
                  return;
                }
                saveSettings.mutate({ enabled: true, policies });
              }}
            />
          </div>
        </div>
        <ul className="mt-4 flex flex-col gap-3">
          {PLAYBOOK_POLICY_LABELS.map((row) => (
            <li
              key={row.key}
              className="flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-mono text-caption">{row.title}</p>
                <p className="text-caption text-muted">{row.hint}</p>
              </div>
              <Switch
                checked={Boolean(policies?.[row.key])}
                aria-label={row.title}
                disabled={!policies}
                onCheckedChange={(next) => {
                  if (!policies) return;
                  const updated = { ...policies, [row.key]: next };
                  setPolicies(updated);
                  saveSettings.mutate({ enabled, policies: updated });
                }}
              />
            </li>
          ))}
          <li className="flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-caption">analytics_pull_concurrency</p>
              <p className="text-caption text-muted">Keep YouTube pulls sequential or low concurrency.</p>
            </div>
            <div className="flex gap-2">
              {(["low", "medium"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={policies?.analyticsPullConcurrency === value}
                  className={cn(
                    "rounded-full px-3 py-1 text-caption capitalize",
                    policies?.analyticsPullConcurrency === value
                      ? "bg-accent/15 text-accent"
                      : "bg-secondary-surface text-muted",
                  )}
                  onClick={() => {
                    if (!policies) return;
                    const updated = { ...policies, analyticsPullConcurrency: value };
                    setPolicies(updated);
                    saveSettings.mutate({ enabled, policies: updated });
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </li>
          <li className="flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-caption">social.default_upload_mode</p>
              <p className="text-caption text-muted">Draft is recommended so Hermes never publishes without review.</p>
            </div>
            <div className="flex gap-2">
              {(["draft", "publish"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={policies?.socialDefaultUploadMode === value}
                  className={cn(
                    "min-h-11 rounded-full px-3 py-1 text-caption capitalize",
                    policies?.socialDefaultUploadMode === value
                      ? "bg-accent/15 text-accent"
                      : "bg-secondary-surface text-muted",
                  )}
                  onClick={() => {
                    if (!policies) return;
                    const updated = { ...policies, socialDefaultUploadMode: value };
                    setPolicies(updated);
                    saveSettings.mutate({ enabled, policies: updated });
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </li>
          <li className="flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-caption">social.max_auto_retries</p>
              <p className="text-caption text-muted">Retry failed platforms once or twice — never loop.</p>
            </div>
            <div className="flex gap-2">
              {([1, 2] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={policies?.socialMaxAutoRetries === value}
                  className={cn(
                    "min-h-11 rounded-full px-3 py-1 text-caption",
                    policies?.socialMaxAutoRetries === value
                      ? "bg-accent/15 text-accent"
                      : "bg-secondary-surface text-muted",
                  )}
                  onClick={() => {
                    if (!policies) return;
                    const updated = { ...policies, socialMaxAutoRetries: value };
                    setPolicies(updated);
                    saveSettings.mutate({ enabled, policies: updated });
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </li>
          <li className="flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-caption">social.max_bulk_jobs_per_run</p>
              <p className="text-caption text-muted">Hard cap on bulk_create_upload_jobs per Hermes run.</p>
            </div>
            <div className="flex gap-2">
              {([3, 5, 10] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={policies?.socialMaxBulkJobsPerRun === value}
                  className={cn(
                    "min-h-11 rounded-full px-3 py-1 text-caption",
                    policies?.socialMaxBulkJobsPerRun === value
                      ? "bg-accent/15 text-accent"
                      : "bg-secondary-surface text-muted",
                  )}
                  onClick={() => {
                    if (!policies) return;
                    const updated = { ...policies, socialMaxBulkJobsPerRun: value };
                    setPolicies(updated);
                    saveSettings.mutate({ enabled, policies: updated });
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </li>
        </ul>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <KeyRound className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-card font-semibold tracking-tight">API access</h3>
            <p className="text-caption text-muted">Bearer keys for Hermes. Shown in plaintext only once.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <CopyRow label="Base URL" value={apiBase} />
          <CopyRow label="Sample header" value="Authorization: Bearer <key>" />
        </div>
        <form onSubmit={onCreate} className="mt-5 flex flex-col gap-3">
          <Label htmlFor="key-name">New key name</Label>
          <Input
            id="key-name"
            value={keyName}
            onChange={(event) => setKeyName(event.target.value)}
            maxLength={80}
            required
          />
          <fieldset>
            <legend className="text-caption text-muted">Scopes</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {API_KEY_SCOPES.map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => toggleScope(scope)}
                  aria-pressed={scopes.includes(scope)}
                  className={cn(
                    "rounded-full px-3 py-1 text-caption",
                    scopes.includes(scope)
                      ? "bg-accent/15 text-accent"
                      : "bg-secondary-surface text-muted",
                  )}
                >
                  {SCOPE_LABELS[scope]}
                </button>
              ))}
            </div>
            <p className="mt-2 text-caption text-muted">
              Default Hermes least privilege includes read, progress, mark-paid, leads, AI, and
              write:social (Social Machine + uploads). Daytona keys stay human-only.
            </p>
          </fieldset>
          <Button type="submit" disabled={createKey.isPending}>
            Create API key
          </Button>
        </form>
        <div className="mt-5 overflow-x-auto">
          {data.keys.length === 0 ? (
            <p className="text-body text-muted">No API keys yet.</p>
          ) : (
            <table className="w-full min-w-[40rem] text-left text-caption">
              <thead className="text-muted">
                <tr>
                  <th className="py-2 font-medium">Name</th>
                  <th className="py-2 font-medium">Scopes</th>
                  <th className="py-2 font-medium">Created</th>
                  <th className="py-2 font-medium">Last used</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {data.keys.map((key) => (
                  <tr key={key.id} className="border-t border-border">
                    <td className="py-3">
                      <p className="font-medium">{key.name}</p>
                      <p className="text-muted">
                        {key.keyPrefix}…{key.last4}
                      </p>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((scope) => (
                          <Badge key={scope} tone="blue">
                            {SCOPE_LABELS[scope]}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-muted">{formatRelativeTime(key.createdAt)}</td>
                    <td className="py-3 text-muted">
                      {key.lastUsedAt ? formatRelativeTime(key.lastUsedAt) : "Never"}
                    </td>
                    <td className="py-3">
                      <Badge tone={key.revokedAt ? "red" : "green"}>
                        {key.revokedAt ? "Revoked" : "Active"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {key.revokedAt ? null : (
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setRotateId(key.id)}>
                            Rotate
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setRevokeId(key.id)}>
                            Revoke
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <Bot className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-card font-semibold tracking-tight">MCP server</h3>
            <p className="text-caption text-muted">
              Hermes connects to Agency Admin as an MCP client.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <CopyRow label="MCP endpoint · os.swcstudio.space" value={mcpUrl} />
          <CopyRow label="MCP endpoint · clippyos.grok.me" value={mcpAliasUrl} />
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={data.mcpConfigured ? "green" : "neutral"}>
              {data.mcpConfigured ? "Token issued" : "Not configured"}
            </Badge>
            {data.mcpLast4 ? <span className="text-caption text-muted">…{data.mcpLast4}</span> : null}
            {data.mcpLastUsedAt ? (
              <span className="text-caption text-muted">
                Last used {formatRelativeTime(data.mcpLastUsedAt)}
              </span>
            ) : null}
          </div>
          <Button variant="secondary" onClick={() => mcp.mutate()} disabled={mcp.isPending}>
            {data.mcpConfigured ? "Rotate MCP token" : "Generate MCP token"}
          </Button>
          <CopyRow label="Copy Hermes config" value={hermesConfig} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {Object.entries(grouped).map(([domain, tools]) => (
            <div key={domain} className="rounded-control bg-secondary-surface/50 px-3 py-3">
              <p className="text-caption font-medium">{domain}</p>
              <ul className="mt-1 text-caption text-muted">
                {tools.map((tool) => (
                  <li key={tool.name}>{tool.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <Webhook className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-card font-semibold tracking-tight">Webhooks</h3>
            <p className="text-caption text-muted">
              Paste the inbound URL and signing secret into Hermes. Outbound push is optional.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <CopyRow label="Inbound webhook URL" value={webhookUrl} />
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={data.webhookConfigured ? "green" : "neutral"}>
              {data.webhookConfigured ? "Secret issued" : "Not configured"}
            </Badge>
            {data.webhookLast4 ? (
              <span className="text-caption text-muted">…{data.webhookLast4}</span>
            ) : null}
          </div>
          <Button variant="secondary" onClick={() => webhook.mutate()} disabled={webhook.isPending}>
            {data.webhookConfigured ? "Rotate signing secret" : "Generate signing secret"}
          </Button>
          <div className="rounded-control bg-secondary-surface/50 px-3 py-3 text-caption text-muted">
            <p className="font-medium text-fg">HMAC verification</p>
            <p className="mt-1">
              Header <code>X-Agency-Signature</code> = sha256=HMAC-SHA256(secret, timestamp + "." +
              raw body). Timestamp in <code>X-Agency-Timestamp</code> (Unix seconds). Rejected if skew
              exceeds 5 minutes.
            </p>
            <p className="mt-2">Commands: {INBOUND_COMMANDS.join(", ")}</p>
          </div>
        </div>
        <form
          className="mt-5 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            saveOutbound.mutate();
          }}
        >
          <Label htmlFor="outbound-url">Outbound destination (optional, HTTPS only)</Label>
          <Input
            id="outbound-url"
            value={outboundUrl}
            onChange={(event) => setOutboundUrl(event.target.value)}
            placeholder="https://hermes.example/hooks/clippy"
          />
          <fieldset>
            <legend className="text-caption text-muted">Event subscriptions</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {WEBHOOK_EVENT_TYPES.map((eventType) => (
                <button
                  key={eventType}
                  type="button"
                  aria-pressed={outboundEvents.includes(eventType)}
                  onClick={() =>
                    setOutboundEvents((current) =>
                      current.includes(eventType)
                        ? current.filter((item) => item !== eventType)
                        : [...current, eventType],
                    )
                  }
                  className={cn(
                    "rounded-full px-3 py-1 text-caption",
                    outboundEvents.includes(eventType)
                      ? "bg-accent/15 text-accent"
                      : "bg-secondary-surface text-muted",
                  )}
                >
                  {WEBHOOK_EVENT_LABELS[eventType]}
                </button>
              ))}
            </div>
          </fieldset>
          {data.lastDelivery.at ? (
            <p className="text-caption text-muted">
              Last delivery {formatRelativeTime(data.lastDelivery.at)} · {data.lastDelivery.status} ·{" "}
              {data.lastDelivery.eventType}
            </p>
          ) : (
            <p className="text-caption text-muted">No outbound deliveries yet. Hermes can poll the API instead.</p>
          )}
          <Button type="submit" variant="secondary" disabled={saveOutbound.isPending}>
            Save outbound settings
          </Button>
        </form>
      </GlassCard>

      <PlaybookCatalog policies={policies ?? data.policies} enabled={enabled} />

      <EventBusCard data={data} />

      <GlassCard>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <Radio className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-card font-semibold tracking-tight">Agent activity</h3>
            <p className="text-caption text-muted">Append-only. Not editable.</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["all", "api", "mcp", "webhook"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={sourceFilter === value}
              onClick={() => setSourceFilter(value)}
              className={cn(
                "rounded-full px-3 py-1 text-caption capitalize",
                sourceFilter === value ? "bg-accent/15 text-accent" : "bg-secondary-surface text-muted",
              )}
            >
              {value}
            </button>
          ))}
          <Input
            aria-label="Filter by action"
            placeholder="Filter action"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
            className="h-8 w-40"
          />
          <Input
            aria-label="Filter by playbook or run id"
            placeholder="Playbook / run id"
            value={playbookFilter}
            onChange={(event) => setPlaybookFilter(event.target.value)}
            className="h-8 w-44"
          />
          <Input
            aria-label="Filter by date"
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="h-8 w-40"
          />
        </div>
        {audit.isPending ? (
          <Skeleton className="mt-4 h-32 w-full" />
        ) : auditRows.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="No agent activity yet"
            description="Once Hermes calls the API, MCP, or inbound webhook, actions appear here."
          />
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {auditRows.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-1 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-body">
                    <span className="font-medium">{row.action}</span>{" "}
                    <span className="text-muted">
                      {row.entityType}
                      {row.entityId ? ` ${row.entityId.slice(0, 8)}` : ""}
                    </span>
                  </p>
                  <p className="text-caption text-muted">
                    {row.actorLabel} · {row.source}
                    {row.playbookId ? ` · ${row.playbookId}` : ""}
                    {row.runId ? ` · ${row.runId.slice(0, 8)}` : ""} · {row.requestId.slice(0, 8)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={row.result === "ok" ? "green" : row.result === "denied" ? "orange" : "red"}>
                    {row.result}
                  </Badge>
                  <time className="text-caption text-muted">{formatRelativeTime(row.createdAt)}</time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <SecretReveal
        title={plainTitle}
        value={plaintext ?? ""}
        warning={plainWarning}
        onDone={() => setPlaintext(null)}
      />

      <Dialog open={Boolean(revokeId)} onOpenChange={(open) => !open && setRevokeId(null)}>
        <DialogContent>
          <DialogTitle>Revoke this API key?</DialogTitle>
          <DialogDescription>
            Hermes will lose access immediately. You can mint a replacement afterwards.
          </DialogDescription>
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setRevokeId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!revokeId || revoke.isPending}
              onClick={() => revokeId && revoke.mutate(revokeId)}
            >
              Revoke
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(rotateId)} onOpenChange={(open) => !open && setRotateId(null)}>
        <DialogContent>
          <DialogTitle>Rotate this API key?</DialogTitle>
          <DialogDescription>
            The current key is revoked and a new plaintext key is shown once.
          </DialogDescription>
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setRotateId(null)}>
              Cancel
            </Button>
            <Button
              disabled={!rotateId || rotate.isPending}
              onClick={() => rotateId && rotate.mutate(rotateId)}
            >
              Rotate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pauseOpen} onOpenChange={(open) => !open && setPauseOpen(false)}>
        <DialogContent>
          <DialogTitle>Pause Hermes mutations?</DialogTitle>
          <DialogDescription>
            Reads still work. Mark-as-paid, stage writes, leads, and AI actions from API / MCP /
            webhooks will fail closed until you turn automation back on. The human dashboard stays live.
          </DialogDescription>
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setPauseOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!policies || saveSettings.isPending}
              onClick={() => policies && saveSettings.mutate({ enabled: false, policies })}
            >
              Pause automation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
