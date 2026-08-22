import { Link } from "@tanstack/react-router";
import { Cpu, MonitorPlay, Radio, Shield, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AutonomySnapshot } from "@/lib/autonomy";
import { WEBHOOK_EVENT_LABELS, type WebhookEventType } from "@/lib/autonomy";
import { SOCIAL_LIFECYCLE_EVENTS } from "@/lib/connect";
import type { PlaybookPolicies } from "@/lib/playbooks";
import { formatRelativeTime } from "@/lib/format";
import { SANDBOX_LABELS, SANDBOX_THREAT_MITIGATIONS } from "@/lib/sandbox";

export function EventBusCard({
  data,
}: {
  data: AutonomySnapshot;
}) {
  const socialEvents = SOCIAL_LIFECYCLE_EVENTS.filter((event) =>
    data.outboundEvents.includes(event),
  );
  return (
    <GlassCard>
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
          <Radio className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-card font-semibold tracking-tight">Event bus</h3>
          <p className="text-caption text-muted">
            Domain events (payment.collected, progress.stage_changed, social.upload.*,
            social.session.*) flow to outbound webhooks when a receiver is set. Otherwise Hermes
            polls the API. Hermes Playbook is the autonomous controller; ClippyOS is the
            system of record and the browser runtime.
          </p>
        </div>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {SOCIAL_LIFECYCLE_EVENTS.map((event) => {
          const last = data.lastDeliveryByEvent[event];
          const subscribed = data.outboundEvents.includes(event);
          return (
            <li
              key={event}
              className="flex items-center justify-between gap-2 rounded-control bg-secondary-surface/50 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-mono text-caption">{event}</p>
                <p className="text-caption text-muted">
                  {last
                    ? `${last.status} · ${formatRelativeTime(last.at)}`
                    : subscribed
                      ? "Subscribed · no delivery yet"
                      : "Not subscribed"}
                </p>
              </div>
              <Badge tone={subscribed ? "blue" : "neutral"}>
                {subscribed ? "On" : "Off"}
              </Badge>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-caption text-muted">
        {data.outboundUrl
          ? `Receiver configured. ${socialEvents.length} social events subscribed.`
          : "No receiver URL — Hermes should poll GET /api/v1/automation/connect-status and social jobs."}
      </p>
    </GlassCard>
  );
}

export function BrowserRuntimeCard({
  data,
  policies,
}: {
  data: AutonomySnapshot;
  policies: PlaybookPolicies;
}) {
  return (
    <GlassCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <MonitorPlay className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-card font-semibold tracking-tight">Browser runtime</h3>
            <p className="text-caption text-muted">
              Daytona is a core OS capability: a Windows Social Machine for Instagram, X, TikTok,
              and YouTube Studio. VMs are on-demand — never auto-start on login. Hibernate pauses a
              hot snapshot.
            </p>
          </div>
        </div>
        <Badge tone={policies.socialAutoStartForUpload ? "orange" : "green"}>
          auto_start_for_upload {policies.socialAutoStartForUpload ? "on" : "off"}
        </Badge>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-control bg-secondary-surface/50 px-3 py-3">
          <dt className="text-caption text-muted">Idle hibernate</dt>
          <dd className="font-medium tabular-nums">{policies.socialIdleStopMinutes} min</dd>
        </div>
        <div className="rounded-control bg-secondary-surface/50 px-3 py-3">
          <dt className="text-caption text-muted">Upload mode</dt>
          <dd className="font-medium capitalize">{policies.socialDefaultUploadMode}</dd>
        </div>
        <div className="rounded-control bg-secondary-surface/50 px-3 py-3">
          <dt className="text-caption text-muted">Max retries</dt>
          <dd className="font-medium tabular-nums">{policies.socialMaxAutoRetries}</dd>
        </div>
        <div className="rounded-control bg-secondary-surface/50 px-3 py-3">
          <dt className="text-caption text-muted">Bulk cap</dt>
          <dd className="font-medium tabular-nums">{policies.socialMaxBulkJobsPerRun}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <Link to="/social">Open Social</Link>
        </Button>
        <Button size="sm" variant="secondary" asChild>
          <Link to="/settings" hash="integrations">
            Daytona add-on
          </Link>
        </Button>
      </div>
    </GlassCard>
  );
}

export function OsFramingBanner() {
  return (
    <GlassCard className="border-accent/20">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
          <Cpu className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-card font-semibold tracking-tight">Autonomous OS</h3>
          <p className="mt-1 text-caption text-muted">
            ClippyOS is the Autonomous Operating System for Clipping. Integrations are Add-ons.
            Skills are versioned SKILL.md packages (Python in an isolated sandbox, never the Social
            Machine). The browser runtime is a Windows VM with hot snapshots. Automation & Hermes
            is the always-on control plane — mint credentials here, paste them into Hermes.
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-caption text-muted">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Core AI is required. Media, Analytics, Discord, and Notion are optional add-ons.
          </p>
        </div>
      </div>
    </GlassCard>
  );
}

export function lastDeliveryLabel(
  event: WebhookEventType,
  data: AutonomySnapshot,
): string {
  const last = data.lastDeliveryByEvent[event];
  if (!last) return WEBHOOK_EVENT_LABELS[event];
  return `${WEBHOOK_EVENT_LABELS[event]} · ${last.status}`;
}

export function SandboxSecurityCard() {
  return (
    <GlassCard>
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
          <Shield className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-card font-semibold tracking-tight">Sandbox security</h3>
          <p className="text-caption text-muted">
            Social Machine and Skill Execution are separate Daytona sandboxes. Skills never inherit
            browser profiles. Nothing starts on login.
          </p>
        </div>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {(Object.keys(SANDBOX_LABELS) as Array<keyof typeof SANDBOX_LABELS>).map((id) => (
          <li key={id} className="rounded-control bg-secondary-surface/50 px-3 py-3">
            <p className="font-medium">{SANDBOX_LABELS[id].title}</p>
            <p className="mt-1 text-caption text-muted">{SANDBOX_LABELS[id].blurb}</p>
          </li>
        ))}
      </ul>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {SANDBOX_THREAT_MITIGATIONS.map((row) => (
          <li key={row.id} className="rounded-control bg-secondary-surface/40 px-3 py-2">
            <p className="text-caption font-medium">{row.title}</p>
            <p className="text-caption text-muted">{row.detail}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-caption text-muted">
        VNC is session-gated. Skill env is allowlisted (no Daytona key, no xAI tokens). Artifacts
        are extension + size capped; cookies and password fields are stripped. Test Connection does
        not leave a VM running.
      </p>
    </GlassCard>
  );
}
