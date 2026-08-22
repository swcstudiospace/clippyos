import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  KeyRound,
  MonitorPlay,
  Radio,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  AUTONOMY_QUERY_KEY,
  DEFAULT_HERMES_SCOPES,
  SCOPE_LABELS,
  WEBHOOK_EVENT_LABELS,
  type AutonomySnapshot,
  type WebhookEventType,
} from "@/lib/autonomy";
import {
  HERMES_CONNECTION_LABELS,
  PLAYBOOK_PACKAGE_VERSION,
  SOCIAL_LIFECYCLE_EVENTS,
  deriveConnectSteps,
} from "@/lib/connect";
import { formatPlaybookPackage, type PlaybookPolicies } from "@/lib/playbooks";
import {
  ackSocialVmPolicy,
  createHermesPresetKey,
  markPlaybookPasted,
  saveAutomationSettings,
  saveOutboundWebhook,
  skipOutboundConnect,
  testOutboundWebhook,
} from "@/lib/server/autonomy-admin";
import { copyTextToClipboard } from "@/lib/clipboard";
import { userFacingErrorMessage } from "@/lib/errors";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ShineBorder } from "@/components/magicui/shine-border";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  data: AutonomySnapshot;
  origin: string;
  enabled: boolean;
  policies: PlaybookPolicies;
  onPolicies: (next: PlaybookPolicies) => void;
  onPlaintext: (title: string, value: string, warning: string) => void;
};

async function copy(label: string, value: string) {
  const ok = await copyTextToClipboard(value);
  toast[ok ? "success" : "error"](ok ? `Copied ${label}` : "Couldn’t copy — select the text instead");
  return ok;
}

function StepDot({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full text-caption font-semibold",
        done ? "bg-success/20 text-success" : "bg-secondary-surface text-muted",
      )}
      aria-hidden="true"
    >
      {done ? <Check className="size-4" /> : n}
    </span>
  );
}

export function HermesConnect({
  data,
  origin,
  enabled,
  policies,
  onPolicies,
  onPlaintext,
}: Props) {
  const queryClient = useQueryClient();
  const [outboundUrl, setOutboundUrl] = useState(data.outboundUrl ?? "");
  const [events, setEvents] = useState<WebhookEventType[]>(
    data.outboundEvents.length ? data.outboundEvents : [...SOCIAL_LIFECYCLE_EVENTS],
  );

  const active = data.keys.filter((key) => !key.revokedAt);
  const hermesKey = active.find((key) => key.name.toLowerCase().includes("hermes")) ?? active[0] ?? null;
  const steps = deriveConnectSteps({
    hasHermesKey: active.length > 0,
    keyLastUsedAt: hermesKey?.lastUsedAt ?? data.lastActivityAt,
    pastedIntoHermes: data.connect.pastedIntoHermes,
    socialPolicyAcked: Boolean(data.connect.socialPolicyAckedAt),
    outboundUrlConfigured: Boolean(data.outboundUrl),
    outboundSkipped: data.connect.outboundSkipped,
  });
  const requiredDone = Number(steps.mintKey) + Number(steps.pastePlaybook) + Number(steps.socialPolicy);
  const connection = data.connect.hermesConnection;
  const apiBase = `${origin}/api/v1`;
  const mcpUrl = `${origin}/api/mcp`;
  const webhookUrl = `${origin}/api/webhooks/inbound`;

  const packageText = useMemo(
    () =>
      formatPlaybookPackage({
        policies,
        enabled,
        origin,
        version: PLAYBOOK_PACKAGE_VERSION,
      }),
    [policies, enabled, origin],
  );

  const mcpSnippet = JSON.stringify(
    {
      mcpServers: {
        "clippy-admin": {
          url: mcpUrl,
          headers: { Authorization: "Bearer <MCP_TOKEN>" },
        },
      },
    },
    null,
    2,
  );

  const mint = useMutation({
    mutationFn: () => createHermesPresetKey(),
    onSuccess: async (result) => {
      onPlaintext(
        "Hermes Agent API key",
        result.plaintext,
        "Store this in Hermes now. It is shown once. Scopes: read + write:social plus recommended ops. No admin or secret access.",
      );
      await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
      toast.success("Hermes key created — copy it now");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const paste = useMutation({
    mutationFn: () => markPlaybookPasted(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
      toast.success("Marked as pasted into Hermes");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const ackPolicy = useMutation({
    mutationFn: () => ackSocialVmPolicy(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
      toast.success("Social VM policy confirmed");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const savePolicies = useMutation({
    mutationFn: (next: PlaybookPolicies) => saveAutomationSettings({ data: { enabled, policies: next } }),
    onSuccess: async (_result, next) => {
      onPolicies(next);
      await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const saveOutbound = useMutation({
    mutationFn: () =>
      saveOutboundWebhook({
        data: { destinationUrl: outboundUrl.trim() || null, events },
      }),
    onSuccess: async () => {
      toast.success("Outbound webhook saved");
      await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const testDelivery = useMutation({
    mutationFn: () => testOutboundWebhook(),
    onSuccess: async (result) => {
      if (result.ok) toast.success("Signed ping delivered");
      else toast.error(result.error === "NO_DESTINATION" ? "Add an HTTPS receiver URL first" : "Delivery failed");
      await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const skipOutbound = useMutation({
    mutationFn: () => skipOutboundConnect({ data: { skipped: true } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AUTONOMY_QUERY_KEY });
      toast.message("Outbound events skipped — Hermes can poll the API instead");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  function subscribeSocial() {
    setEvents((current) => {
      const set = new Set(current);
      for (const event of SOCIAL_LIFECYCLE_EVENTS) set.add(event);
      return [...set];
    });
  }

  return (
    <GlassCard className="relative overflow-hidden">
      <ShineBorder shineColor={["var(--accent)", "var(--teal)", "var(--purple)"]} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-card font-semibold tracking-tight">Connect Hermes</h3>
            <p className="text-caption text-muted">
              Three builds: mint a scoped key, paste the Playbook package, set the Social VM policy.
              Outbound events are optional.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            tone={
              connection === "fully_connected" ? "green" : connection === "key_only" ? "blue" : "neutral"
            }
          >
            Hermes: {HERMES_CONNECTION_LABELS[connection]}
          </Badge>
          <Badge tone="teal">
            {requiredDone}/3 required
          </Badge>
        </div>
      </div>

      <ol className="mt-5 flex flex-col gap-4">
        <li className="rounded-control bg-secondary-surface/50 p-4">
          <div className="flex items-start gap-3">
            <StepDot n={1} done={steps.mintKey} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <KeyRound className="size-4 text-muted" aria-hidden="true" />
                <h4 className="font-medium">Mint Hermes key</h4>
                <Badge tone={hermesKey ? "green" : "neutral"}>
                  {hermesKey ? "Key active" : "Missing"}
                </Badge>
              </div>
              <p className="mt-1 text-caption text-muted">
                Preset scopes: {DEFAULT_HERMES_SCOPES.map((scope) => SCOPE_LABELS[scope]).join(", ")}.
                Excluded: admin, secret management, Daytona key access.
              </p>
              {hermesKey ? (
                <p className="mt-2 font-mono text-caption">
                  {hermesKey.name} · {hermesKey.keyPrefix}…{hermesKey.last4}
                  {hermesKey.lastUsedAt ? " · used" : " · never used"}
                </p>
              ) : null}
              <div className="mt-3 flex flex-col gap-2">
                <code className="break-all rounded-control bg-bg/60 px-3 py-2 text-caption">
                  {apiBase}
                </code>
                <code className="break-all rounded-control bg-bg/60 px-3 py-2 text-caption">
                  {"Authorization: Bearer <API_KEY>"}
                </code>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="min-h-11"
                  disabled={mint.isPending}
                  onClick={() => mint.mutate()}
                >
                  {hermesKey ? "Mint another Hermes key" : "Create Hermes key"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11"
                  onClick={() => void copy("API base URL", apiBase)}
                >
                  <Copy className="size-4" />
                  Copy API base
                </Button>
              </div>
            </div>
          </div>
        </li>

        <li className="rounded-control bg-secondary-surface/50 p-4">
          <div className="flex items-start gap-3">
            <StepDot n={2} done={steps.pastePlaybook} />
            <div className="min-w-0 flex-1">
              <h4 className="font-medium">Copy Playbook into Hermes</h4>
              <p className="mt-1 text-caption text-muted">
                Package {PLAYBOOK_PACKAGE_VERSION}: role, connection placeholders, ops + social playbooks,
                webhook reactors, and policy defaults. No secrets.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  className="min-h-11"
                  onClick={async () => {
                    const ok = await copy("Playbook package", packageText);
                    if (ok) paste.mutate();
                  }}
                >
                  <Copy className="size-4" />
                  Copy Playbook package for Hermes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11"
                  onClick={() => void copy("MCP config", mcpSnippet)}
                >
                  Copy MCP config snippet
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11"
                  onClick={() =>
                    void copy(
                      "inbound webhook",
                      `${webhookUrl}\nSigning secret: <WEBHOOK_SECRET>`,
                    )
                  }
                >
                  Copy inbound webhook URL
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="min-h-11"
                  disabled={paste.isPending || steps.pastePlaybook}
                  onClick={() => paste.mutate()}
                >
                  {steps.pastePlaybook ? "Pasted into Hermes" : "I’ve pasted this into Hermes"}
                </Button>
                {hermesKey?.lastUsedAt ? (
                  <span className="text-caption text-muted">First API call observed — step complete.</span>
                ) : null}
              </div>
            </div>
          </div>
        </li>

        <li className="rounded-control bg-secondary-surface/50 p-4">
          <div className="flex items-start gap-3">
            <StepDot n={3} done={steps.socialPolicy} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <MonitorPlay className="size-4 text-muted" aria-hidden="true" />
                <h4 className="font-medium">Social VM policy</h4>
                <Badge tone={data.connect.socialPolicyAckedAt ? "green" : "neutral"}>
                  {policies.socialAutoStartForUpload ? "Auto-start ON" : "Auto-start OFF"}
                </Badge>
              </div>
              <p className="mt-1 text-caption text-muted">
                When ON, Hermes upload jobs may Start the Social Machine if it is stopped. This incurs
                Daytona compute cost. When OFF, uploads fail with MACHINE_STOPPED until a human or
                playbook explicitly starts the machine. Dashboard login still never starts a VM.
              </p>
              <div className="mt-3 flex items-center justify-between gap-3 rounded-control bg-bg/50 px-3 py-3">
                <div>
                  <p className="font-mono text-caption">social.auto_start_for_upload</p>
                  <p className="text-caption text-muted">Default off. Changing this is audited.</p>
                </div>
                <Switch
                  checked={policies.socialAutoStartForUpload}
                  aria-label="social.auto_start_for_upload"
                  onCheckedChange={(next) => {
                    const updated = { ...policies, socialAutoStartForUpload: next };
                    onPolicies(updated);
                    savePolicies.mutate(updated);
                  }}
                />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <PolicyChips
                  title="social.default_upload_mode"
                  hint="Draft is recommended so Hermes never publishes without review."
                  value={policies.socialDefaultUploadMode}
                  options={["draft", "publish"]}
                  onChange={(value) => {
                    const updated = { ...policies, socialDefaultUploadMode: value };
                    onPolicies(updated);
                    savePolicies.mutate(updated);
                  }}
                />
                <PolicyChips
                  title="social.max_auto_retries"
                  hint="Retry failed platforms once or twice — never loop."
                  value={String(policies.socialMaxAutoRetries)}
                  options={["1", "2"]}
                  onChange={(value) => {
                    const updated: PlaybookPolicies = {
                      ...policies,
                      socialMaxAutoRetries: value === "2" ? 2 : 1,
                    };
                    onPolicies(updated);
                    savePolicies.mutate(updated);
                  }}
                />
                <PolicyChips
                  title="social.max_bulk_jobs_per_run"
                  hint="Hard cap on bulk_create_upload_jobs."
                  value={String(policies.socialMaxBulkJobsPerRun)}
                  options={["3", "5", "10"]}
                  onChange={(value) => {
                    const n = Number(value);
                    const updated = {
                      ...policies,
                      socialMaxBulkJobsPerRun: n === 3 || n === 10 ? n : 5,
                    };
                    onPolicies(updated);
                    savePolicies.mutate(updated);
                  }}
                />
              </div>
              <p className="mt-3 text-caption text-muted">
                Browser runtime is on-demand.{" "}
                <Link to="/social" className="text-accent underline-offset-2 hover:underline">
                  Open Social
                </Link>
                {" · "}
                <Link
                  to="/settings"
                  hash="integrations"
                  className="text-accent underline-offset-2 hover:underline"
                >
                  Daytona add-on
                </Link>
              </p>
              {!steps.socialPolicy ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3 min-h-11"
                  disabled={ackPolicy.isPending}
                  onClick={() => ackPolicy.mutate()}
                >
                  Confirm policy (keep current)
                </Button>
              ) : null}
            </div>
          </div>
        </li>

        <li className="rounded-control bg-secondary-surface/50 p-4">
          <div className="flex items-start gap-3">
            <StepDot n={4} done={steps.outbound} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Radio className="size-4 text-muted" aria-hidden="true" />
                <h4 className="font-medium">Outbound events to Hermes</h4>
                <Badge tone="neutral">Optional</Badge>
              </div>
              <p className="mt-1 text-caption text-muted">
                Register a Hermes receiver URL. Subscribe to social.upload.succeeded,
                social.session.needs_login, and related lifecycle events. Hermes can also poll.
              </p>
              <form
                className="mt-3 flex flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveOutbound.mutate();
                }}
              >
                <Label htmlFor="connect-outbound-url">Hermes receiver URL (HTTPS)</Label>
                <Input
                  id="connect-outbound-url"
                  value={outboundUrl}
                  onChange={(event) => setOutboundUrl(event.target.value)}
                  placeholder="https://hermes.example/hooks/clippy"
                  className="min-h-11"
                />
                <div className="flex flex-wrap gap-2">
                  {SOCIAL_LIFECYCLE_EVENTS.map((eventType) => (
                    <button
                      key={eventType}
                      type="button"
                      aria-pressed={events.includes(eventType)}
                      className={cn(
                        "min-h-11 rounded-full px-3 py-1 text-caption",
                        events.includes(eventType)
                          ? "bg-accent/15 text-accent"
                          : "bg-secondary-surface text-muted",
                      )}
                      onClick={() =>
                        setEvents((current) =>
                          current.includes(eventType)
                            ? current.filter((item) => item !== eventType)
                            : [...current, eventType],
                        )
                      }
                    >
                      {WEBHOOK_EVENT_LABELS[eventType]}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button type="button" variant="ghost" className="min-h-11" onClick={subscribeSocial}>
                    Subscribe to social lifecycle
                  </Button>
                  <Button type="submit" variant="secondary" className="min-h-11" disabled={saveOutbound.isPending}>
                    Save receiver
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="min-h-11"
                    disabled={testDelivery.isPending}
                    onClick={() => testDelivery.mutate()}
                  >
                    Test delivery
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-11"
                    disabled={skipOutbound.isPending || steps.outbound}
                    onClick={() => skipOutbound.mutate()}
                  >
                    Skip for now
                  </Button>
                </div>
              </form>
              {data.lastDelivery.at ? (
                <p className="mt-2 text-caption text-muted">
                  Last delivery {data.lastDelivery.status} · {data.lastDelivery.eventType}
                </p>
              ) : (
                <p className="mt-2 text-caption text-muted">No outbound deliveries yet.</p>
              )}
            </div>
          </div>
        </li>
      </ol>

      <div className="mt-4 flex items-start gap-2 rounded-control bg-warning/8 px-3 py-3">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        <p className="text-caption text-muted">
          Paste these values into Hermes. ClippyOS never receives Hermes’ own API key as the
          primary model. Kill switch: revoke the key or pause automation.
        </p>
      </div>
    </GlassCard>
  );
}

function PolicyChips<T extends string>({
  title,
  hint,
  value,
  options,
  onChange,
}: {
  title: string;
  hint: string;
  value: T | string;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="rounded-control bg-bg/50 px-3 py-3">
      <p className="font-mono text-caption">{title}</p>
      <p className="text-caption text-muted">{hint}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            className={cn(
              "min-h-11 rounded-full px-3 py-1 text-caption capitalize",
              value === option ? "bg-accent/15 text-accent" : "bg-secondary-surface text-muted",
            )}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SecretRevealDialog({
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
        <Button className="mt-4 min-h-11" onClick={onDone}>
          I’ve saved it
        </Button>
      </DialogContent>
    </Dialog>
  );
}
