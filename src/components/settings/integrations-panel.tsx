import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import {
  Bot,
  Copy,
  CreditCard,
  Image,
  MessageCircle,
  MonitorPlay,
  Phone,
  Sparkles,
  SquareKanban,
  Unplug,
  Youtube,
  BookOpen,
  PlugZap,
} from "lucide-react";
import { toast } from "sonner";
import {
  INTEGRATION_IDS,
  INTEGRATIONS_QUERY_KEY,
  INTEGRATION_COPY,
  healthLabel,
  healthTone,
  type DiscordAgentHealth,
  type IntegrationHealth,
  type IntegrationId,
} from "@/lib/integrations";
import { ADDON_LAYER_LABELS, ADDON_META } from "@/lib/connect";
import {
  disconnectIntegration,
  getIntegrationsStatus,
  runDiscordAgentNow,
  saveIntegration,
  testIntegration,
} from "@/lib/server/integrations";
import { startPublisherOAuthFn } from "@/lib/server/publisher-fns";
import { testResidentialProxyFn } from "@/lib/server/channel-fns";
import { copyTextToClipboard } from "@/lib/clipboard";
import { formatRelativeTime } from "@/lib/format";
import { userFacingErrorMessage } from "@/lib/errors";
import { useIntegrationsUi } from "@/components/integrations/provider";
import { GrokOAuthSection } from "@/components/settings/grok-oauth";
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
import { PUBLISHERS_QUERY_KEY } from "@/lib/publishers";
import { SOCIAL_QUERY_KEY } from "@/lib/social";
function XMarkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L5.2 22H1.94l8.02-9.16L1.5 2h6.76l4.66 6.18L18.244 2Zm-1.16 18.15h1.81L6.99 3.76H5.05l12.03 16.39Z"
      />
    </svg>
  );
}

const ICONS: Record<IntegrationId, typeof Sparkles> = {
  ai: Sparkles,
  higgsfield: Image,
  youtube: Youtube,
  discord: Bot,
  notion: BookOpen,
  linear: SquareKanban,
  x: XMarkIcon as typeof Sparkles,
  daytona: MonitorPlay,
  telegram: MessageCircle,
  whatsapp: Phone,
  airwallex: CreditCard,
};

export function IntegrationsPanel() {
  const query = useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: () => getIntegrationsStatus(),
  });
  const isAdmin = query.data?.role === "admin";
  const canEditIntegrations = Boolean(query.data?.canEditIntegrations);
  const inheritWorkspaceApis = Boolean(query.data?.inheritWorkspaceApis);

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-section font-semibold tracking-tight">Add-ons</h2>
          <p className="mt-1 text-body text-muted">
            Keys stay on the server. Test Connection never returns secrets.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {INTEGRATION_IDS.map((id) => (
            <Skeleton key={id} className="h-56 w-full rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-section font-semibold tracking-tight">Add-ons</h2>
        <ErrorState
          title="Couldn’t load integrations"
          description="Status couldn’t be read. Try again."
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-section font-semibold tracking-tight">Add-ons</h2>
        <p className="mt-1 text-body text-muted">
          ClippyOS is an OS. These integrations are add-ons. Core AI is required. Daytona is
          the browser runtime for Social Computer Use. Keys stay on the server.
        </p>
        {query.data.role === "member" && inheritWorkspaceApis ? (
          <p className="mt-2 rounded-control bg-secondary-surface px-3 py-2 text-caption text-muted">
            You’re using the owner’s workspace APIs. Ask an owner to turn that off if you
            need to connect your own keys.
          </p>
        ) : null}
        {query.data.role === "member" && !inheritWorkspaceApis ? (
          <p className="mt-2 rounded-control bg-secondary-surface px-3 py-2 text-caption text-muted">
            These keys are yours. They don’t use the owner’s APIs unless an owner shares
            workspace APIs with this login.
          </p>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {INTEGRATION_IDS.map((id) => (
          <IntegrationCard
            key={id}
            id={id}
            isAdmin={Boolean(isAdmin)}
            canEdit={
              id === "airwallex"
                ? Boolean(isAdmin)
                : canEditIntegrations
            }
            last4={query.data.items[id].last4}
            health={query.data.items[id].health}
            lastTestedAt={query.data.items[id].lastTestedAt}
            lastError={query.data.items[id].lastError}
            discordAgent={id === "discord" ? query.data.discordAgent : null}
            handle={query.data.items[id].handle ?? null}
          />
        ))}
      </div>
      <GlassCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
              <PlugZap className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-card font-semibold tracking-tight">ClippyOS MCP</h3>
              <p className="mt-1 text-caption text-muted">
                Remote MCP URL plus scoped connector tokens for Grok Bot and Cursor. Publish still honors Approvals.
              </p>
            </div>
          </div>
          <Button variant="secondary" asChild className="min-h-11">
            <a href="/settings#clippy-mcp">Open ClippyOS MCP</a>
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

function IntegrationCard({
  id,
  isAdmin,
  canEdit,
  last4,
  health,
  lastTestedAt,
  lastError,
  discordAgent,
  handle,
}: {
  id: IntegrationId;
  isAdmin: boolean;
  canEdit: boolean;
  last4: string | null;
  health: IntegrationHealth;
  lastTestedAt: string | null;
  lastError: string | null;
  discordAgent: DiscordAgentHealth | null;
  handle: string | null;
}) {
  const copy = INTEGRATION_COPY[id];
  const Icon = ICONS[id];
  const { openGuide } = useIntegrationsUi();
  const queryClient = useQueryClient();
  const [reveal, setReveal] = useState(false);
  const [pendingDisconnect, setPendingDisconnect] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id !== "x") return;
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { source?: string; ok?: boolean; provider?: string; error?: string };
      if (!data || data.source !== "clippy-social-oauth") return;
      if (data.provider && data.provider !== "x") return;
      void queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
      if (data.ok) toast.success("X connected");
      else toast.error(data.error || "Couldn’t connect X");
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [id, queryClient]);

  const save = useMutation({
    mutationFn: () => saveIntegration({ data: { id, values: fields } }),
    onSuccess: async () => {
      setFields({});
      toast.success(`${copy.name} saved`);
      await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["ai-status"] });
      await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const test = useMutation({
    mutationFn: () => testIntegration({ data: id }),
    onSuccess: async () => {
      toast.success("Connected");
      await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["ai-status"] });
      await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const testProxy = useMutation({
    mutationFn: () =>
      testResidentialProxyFn({
        data: {
          proxyUrl: fields.proxyUrl || undefined,
        },
      }),
    onSuccess: (result) => {
      toast.success(
        result.egressIp
          ? `Proxy egress ${result.egressIp}. The Social Machine was not started.`
          : "Proxy responded. The Social Machine was not started.",
      );
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const disconnect = useMutation({
    mutationFn: () => disconnectIntegration({ data: id }),
    onSuccess: async () => {
      setPendingDisconnect(false);
      toast.success(`${copy.name} disconnected`);
      await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["ai-status"] });
      await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const connectX = useMutation({
    mutationFn: () => startPublisherOAuthFn({ data: { provider: "x" } }),
    onSuccess: async (data) => {
      const popup = window.open(data.url, "clippy-social-oauth", "popup=yes,width=560,height=740");
      if (!popup) {
        const ok = await copyTextToClipboard(data.url);
        toast.message(
          ok
            ? "Pop-up blocked — the connect URL is copied. Open it in a new tab."
            : "Pop-up blocked. Allow pop-ups, then Connect X again.",
        );
      }
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const runAgent = useMutation({
    mutationFn: () => runDiscordAgentNow(),
    onSuccess: async (result) => {
      toast.success(result.summary ?? "Agent finished");
      await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  function onSave(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  const configured = health !== "not_configured";

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-card font-semibold tracking-tight">{copy.name}</h3>
            <p className="text-caption text-muted">{copy.purpose}</p>
          </div>
        </div>
        <Badge tone={healthTone(health)}>{healthLabel(health)}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone={ADDON_META[id].layer === "core" ? "teal" : "neutral"}>
          {ADDON_LAYER_LABELS[ADDON_META[id].layer]}
        </Badge>
        {copy.required ? <Badge tone="orange">Required</Badge> : null}
      </div>
      <p className="mt-2 text-caption text-muted">{ADDON_META[id].requiredFor}</p>
      <p className="mt-1 text-caption text-muted">
        Used by: {ADDON_META[id].usedBy.join(" · ")}
      </p>
      <p className="mt-3 text-caption text-muted">
        {lastTestedAt
          ? `Last tested ${formatRelativeTime(lastTestedAt)}`
          : "Not tested yet"}
        {lastError ? ` · ${lastError}` : null}
      </p>
      {id === "x" ? (
        <p className="mt-2 text-caption">
          {handle
            ? `API connected as ${handle.startsWith("@") ? handle : `@${handle}`}`
            : "API not connected — Social X uploads use Computer Use."}
        </p>
      ) : null}
      {id === "linear" && handle ? (
        <p className="mt-2 text-caption">Linear connected as {handle}.</p>
      ) : null}
      {configured && last4 ? (
        <p className="mt-2 font-mono text-caption">
          {reveal ? last4 : "•••• configured"}
          <button
            type="button"
            className="ml-2 text-accent"
            onClick={() => setReveal((value) => !value)}
          >
            {reveal ? "Hide" : "Reveal last 4"}
          </button>
        </p>
      ) : null}

      {id === "ai" && canEdit ? <div className="mt-4"><GrokOAuthSection embedded /></div> : null}

      {canEdit ? (
        <form className="mt-4 flex flex-col gap-3" onSubmit={onSave}>
          {id === "ai" ? (
            <Field
              id={`${id}-key`}
              label="API key"
              value={fields.key ?? ""}
              onChange={(value) => setFields({ key: value })}
              placeholder={configured ? "•••• stored on the server" : "Paste the xAI / Grok API key"}
            />
          ) : null}
          {id === "higgsfield" ? (
            <>
              <Field
                id="hf-key"
                label="Key ID"
                value={fields.keyId ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, keyId: value }))}
                placeholder={configured ? "•••• stored" : "Higgsfield key ID"}
              />
              <Field
                id="hf-secret"
                label="Secret"
                value={fields.secret ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, secret: value }))}
                placeholder={configured ? "•••• stored" : "Higgsfield secret"}
              />
            </>
          ) : null}
          {id === "youtube" ? (
            <Field
              id="yt-key"
              label="API key"
              value={fields.apiKey ?? ""}
              onChange={(value) => setFields({ apiKey: value })}
              placeholder={configured ? "•••• stored" : "YouTube Data API key"}
            />
          ) : null}
          {id === "discord" ? (
            <Field
              id="dc-token"
              label="Bot token"
              value={fields.token ?? ""}
              onChange={(value) => setFields({ token: value })}
              placeholder={configured ? "•••• stored" : "Discord bot token"}
            />
          ) : null}
          {id === "notion" ? (
            <Field
              id="nt-token"
              label="Integration token"
              value={fields.token ?? ""}
              onChange={(value) => setFields({ token: value })}
              placeholder={configured ? "•••• stored" : "Notion token"}
            />
          ) : null}
          {id === "linear" ? (
            <>
              <Field
                id="linear-key"
                label="API key"
                value={fields.apiKey ?? ""}
                onChange={(value) => setFields({ apiKey: value })}
                placeholder={configured ? "•••• stored on the server" : "lin_api_…"}
              />
              <p className="text-caption text-muted">
                Personal API key or OAuth. Map team, project, and Kanban columns in the Linear section
                below. Test never creates an issue.
              </p>
            </>
          ) : null}
          {id === "daytona" ? (
            <>
              <Field
                id="dtn-key"
                label="API key"
                value={fields.key ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, key: value }))}
                placeholder={configured ? "•••• stored on the server" : "Paste the Daytona API key"}
              />
              <Field
                id="dtn-url"
                label="API URL"
                type="url"
                value={fields.apiUrl ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, apiUrl: value }))}
                placeholder="https://app.daytona.io/api"
              />
              <Field
                id="dtn-target"
                label="Region"
                type="text"
                value={fields.target ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, target: value }))}
                placeholder="us or eu — Daytona has no Australia region"
              />
              <Field
                id="dtn-size"
                label="Windows size"
                type="text"
                value={fields.size ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, size: value }))}
                placeholder="windows-large (4 vCPU / 16 GiB) or windows-medium"
              />
              <Field
                id="dtn-stop"
                label="Idle hibernate minutes"
                type="number"
                value={fields.autoStopMinutes ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, autoStopMinutes: value }))}
                placeholder="20"
              />
              <Field
                id="dtn-proxy-url"
                label="Paste proxy URL"
                type="url"
                value={fields.proxyUrl ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, proxyUrl: value }))}
                placeholder="https://user:pass@gate.au.example:8000"
              />
              <Field
                id="dtn-proxy-host"
                label="Residential host"
                type="text"
                value={fields.proxyHost ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, proxyHost: value }))}
                placeholder="gate.sydney.example"
              />
              <Field
                id="dtn-proxy-port"
                label="Port"
                type="number"
                value={fields.proxyPort ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, proxyPort: value }))}
                placeholder="8000"
              />
              <Field
                id="dtn-proxy-user"
                label="Username"
                type="text"
                value={fields.proxyUsername ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, proxyUsername: value }))}
                placeholder="au-user"
              />
              <Field
                id="dtn-proxy-pass"
                label="Password"
                value={fields.proxyPassword ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, proxyPassword: value }))}
                placeholder="••••"
              />
              <p className="text-caption text-muted">
                Social Machine is a Windows VM. Hibernate pauses a hot snapshot (logins persist).
                Clock is Australia/Sydney. Daytona only offers US and EU IPs — Instagram Graph API
                is the reliable AU publish path; a residential HTTPS proxy is optional for browser
                login. Test Connection and Test proxy never start a VM.
              </p>
            </>
          ) : null}
          {id === "telegram" ? (
            <>
              <Field
                id="tg-token"
                label="Bot token"
                value={fields.token ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, token: value }))}
                placeholder={configured ? "•••• stored" : "123456:ABC…"}
              />
              <Field
                id="tg-secret"
                label="Webhook secret"
                value={fields.webhookSecret ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, webhookSecret: value }))}
                placeholder={configured ? "•••• stored" : "Optional — generated if blank"}
              />
              <p className="text-caption text-muted">
                Professional inbox at Inbox. Set the bot webhook to /api/webhooks/telegram. Test
                never sends a customer message.
              </p>
            </>
          ) : null}
          {id === "whatsapp" ? (
            <>
              <Field
                id="wa-token"
                label="Cloud API token"
                value={fields.token ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, token: value }))}
                placeholder={configured ? "•••• stored" : "Permanent or system user token"}
              />
              <Field
                id="wa-phone"
                label="Phone number ID"
                type="text"
                value={fields.phoneNumberId ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, phoneNumberId: value }))}
                placeholder="1555…"
              />
              <Field
                id="wa-verify"
                label="Verify token"
                type="text"
                value={fields.verifyToken ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, verifyToken: value }))}
                placeholder="Webhook hub.verify_token"
              />
              <Field
                id="wa-secret"
                label="App secret"
                value={fields.appSecret ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, appSecret: value }))}
                placeholder={configured ? "•••• stored" : "X-Hub-Signature-256"}
              />
              <p className="text-caption text-muted">
                Meta Cloud API only — not WhatsApp Web on the VM. Webhook: /api/webhooks/whatsapp.
                Test never sends a customer message.
              </p>
            </>
          ) : null}
          {id === "airwallex" ? (
            <>
              <Field
                id="awx-client"
                label="Client ID"
                type="text"
                value={fields.clientId ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, clientId: value }))}
                placeholder={configured ? "•••• stored on the server" : "Airwallex client ID"}
              />
              <Field
                id="awx-key"
                label="API key"
                value={fields.apiKey ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, apiKey: value }))}
                placeholder={configured ? "•••• stored on the server" : "Airwallex API key"}
              />
              <Field
                id="awx-wh"
                label="Webhook secret"
                value={fields.webhookSecret ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, webhookSecret: value }))}
                placeholder={configured ? "•••• stored" : "Webhook signing secret"}
              />
              <Field
                id="awx-le"
                label="Legal entity ID"
                type="text"
                value={fields.legalEntityId ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, legalEntityId: value }))}
                placeholder="le_…"
              />
              <Field
                id="awx-acct"
                label="Linked payment account ID"
                type="text"
                value={fields.linkedPaymentAccountId ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, linkedPaymentAccountId: value }))}
                placeholder="acct_…"
              />
              <Field
                id="awx-env"
                label="Environment (sandbox or live)"
                type="text"
                value={fields.env ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, env: value }))}
                placeholder="sandbox"
              />
              <Field
                id="awx-starter"
                label="Starter price ID"
                type="text"
                value={fields.priceStarter ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, priceStarter: value }))}
                placeholder="pri_…"
              />
              <Field
                id="awx-pro"
                label="Pro price ID"
                type="text"
                value={fields.pricePro ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, pricePro: value }))}
                placeholder="pri_…"
              />
              <Field
                id="awx-agency"
                label="Agency price ID"
                type="text"
                value={fields.priceAgency ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, priceAgency: value }))}
                placeholder="pri_…"
              />
              <p className="text-caption text-muted">
                Hosted Billing Checkout only — cards, Apple Pay, and Google Pay for
                subscriptions. Test Connection logs in; it never opens checkout. Crypto
                (e.g. BitPay) is an Airwallex one-off PAYMENT method, not recurring
                subscriptions.
              </p>
            </>
          ) : null}
          {id === "x" ? (
            <>
              <Field
                id="x-client-id"
                label="Client ID"
                type="text"
                value={fields.clientId ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, clientId: value }))}
                placeholder={configured ? "•••• stored on the server" : "X OAuth 2.0 Client ID"}
              />
              <Field
                id="x-client-secret"
                label="Client secret"
                value={fields.clientSecret ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, clientSecret: value }))}
                placeholder={configured ? "•••• stored on the server" : "X Client Secret"}
              />
              <Field
                id="x-api-base"
                label="API host"
                type="url"
                value={fields.apiBase ?? ""}
                onChange={(value) => setFields((cur) => ({ ...cur, apiBase: value }))}
                placeholder="https://api.x.com"
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="break-all font-mono text-caption text-muted">
                  {typeof window !== "undefined"
                    ? `${window.location.origin}/api/oauth/social`
                    : "/api/oauth/social"}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const value =
                      typeof window !== "undefined"
                        ? `${window.location.origin}/api/oauth/social`
                        : "/api/oauth/social";
                    const ok = await copyTextToClipboard(value);
                    toast[ok ? "success" : "error"](ok ? "Callback URL copied" : "Couldn’t copy");
                  }}
                >
                  <Copy className="size-4" aria-hidden="true" />
                  Copy callback
                </Button>
              </div>
              <p className="text-caption text-muted">
                User-context OAuth only. Tokens stay on the server. Test Connection never posts.
                X has no draft API — draft jobs stay local until Publish.
              </p>
            </>
          ) : null}
          <Button type="submit" variant="secondary" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      ) : (
        <p className="mt-3 text-caption text-muted">
          {id === "airwallex"
            ? "Only owners can change billing keys."
            : "Workspace APIs are shared with this login, so keys are read-only. Ask an owner to let you use your own APIs."}
        </p>
      )}

      {id === "discord" ? (
        <p className="mt-3 text-caption text-muted">
          Discord Status Agent is read-only and runs automatically about every 30
          minutes. It matches Discord server names to client names and updates
          production stages.
          {discordAgent?.lastRunAt
            ? ` Last run ${formatRelativeTime(discordAgent.lastRunAt)}${discordAgent.summary ? ` — ${discordAgent.summary}` : ""}.`
            : null}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => openGuide(id)}>
          Setup Guide
        </Button>
        {canEdit && id === "x" ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={!configured || connectX.isPending}
            onClick={() => connectX.mutate()}
          >
            <PlugZap className="size-3.5" />
            {connectX.isPending ? "Connecting…" : "Connect X"}
          </Button>
        ) : null}
        {canEdit ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={test.isPending}
            onClick={() => test.mutate()}
          >
            <PlugZap className="size-3.5" />
            {test.isPending ? "Testing…" : id === "x" ? "Test Connection" : "Test"}
          </Button>
        ) : null}
        {canEdit && id === "daytona" ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={testProxy.isPending}
            onClick={() => testProxy.mutate()}
          >
            {testProxy.isPending ? "Probing…" : "Test proxy"}
          </Button>
        ) : null}
        {canEdit && configured ? (
          <Button size="sm" variant="ghost" onClick={() => setPendingDisconnect(true)}>
            <Unplug className="size-3.5" />
            Disconnect
          </Button>
        ) : null}
        {isAdmin && id === "discord" ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={runAgent.isPending}
            onClick={() => runAgent.mutate()}
          >
            {runAgent.isPending ? "Running…" : "Run agent now"}
          </Button>
        ) : null}
      </div>

      <Dialog open={pendingDisconnect} onOpenChange={setPendingDisconnect}>
        <DialogContent>
          <DialogTitle>Disconnect {copy.name}?</DialogTitle>
          <DialogDescription>
            {id === "x"
              ? "OAuth tokens are cleared. Client ID and secret stay so you can Connect X again. Social X uploads fall back to Computer Use."
              : "The saved secret is removed. Features that need it will show a setup banner until you connect again."}
          </DialogDescription>
          <div className="mt-5 flex gap-2">
            <Button
              variant="destructive"
              disabled={disconnect.isPending}
              onClick={() => disconnect.mutate()}
            >
              Disconnect
            </Button>
            <Button variant="ghost" onClick={() => setPendingDisconnect(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "password",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "password" | "text" | "url" | "number";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        autoComplete="new-password"
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
