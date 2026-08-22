import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge, statusTone } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  AUDIT_ACTOR_LABELS,
  AUDIT_QUERY_KEY,
  SAFETY_SETTINGS_QUERY_KEY,
  SAFETY_INBOX_QUERY_KEY,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_LABELS,
  DEFAULT_APPROVAL_POLICY,
  type NotificationCategory,
} from "@/lib/safety";
import {
  getSafetySettingsFn,
  listAuditEventsFn,
  saveApprovalPolicyFn,
  saveOpsChannelsFn,
  getNotificationPrefsFn,
  saveNotificationPrefsFn,
  getSafetyInbox,
} from "@/lib/server/safety-fns";
import { formatRelativeTime } from "@/lib/format";
import { downloadTextFile } from "@/lib/clipboard";
import { userFacingErrorMessage } from "@/lib/errors";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/entities";
import { PLATFORM_LABELS } from "@/lib/social";

export function SafetyPanel() {
  const queryClient = useQueryClient();
  const [action, setAction] = useState("");
  const [since, setSince] = useState("");
  const [until, setUntil] = useState("");
  const [webhook, setWebhook] = useState("");
  const [emailWebhook, setEmailWebhook] = useState("");
  const settings = useQuery({
    queryKey: SAFETY_SETTINGS_QUERY_KEY,
    queryFn: () => getSafetySettingsFn(),
    placeholderData: {
      policy: DEFAULT_APPROVAL_POLICY,
      channels: {
        discordWebhookConfigured: false,
        emailEnabled: false,
        emailWebhookConfigured: false,
      },
      retentionNote: "Audit events are kept for at least 12 months. There is no silent edit of history.",
    },
  });
  const prefs = useQuery({
    queryKey: ["notification-prefs"],
    queryFn: () => getNotificationPrefsFn(),
  });
  const inbox = useQuery({
    queryKey: SAFETY_INBOX_QUERY_KEY,
    queryFn: () => getSafetyInbox(),
  });
  const isAdmin = inbox.data?.role === "admin";
  const audit = useQuery({
    queryKey: [...AUDIT_QUERY_KEY, since, until],
    queryFn: () =>
      listAuditEventsFn({
        data: {
          since: since ? `${since}T00:00:00.000Z` : undefined,
          until: until ? `${until}T23:59:59.999Z` : undefined,
        },
      }),
    enabled: isAdmin,
  });

  const snapshot = settings.data;
  const policy = snapshot?.policy;

  const savePolicy = useMutation({
    mutationFn: saveApprovalPolicyFn,
    onSuccess: async () => {
      toast.success("Approvals policy saved");
      await queryClient.invalidateQueries({ queryKey: SAFETY_SETTINGS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const saveChannels = useMutation({
    mutationFn: saveOpsChannelsFn,
    onSuccess: async () => {
      toast.success("Notification channels saved");
      setWebhook("");
      setEmailWebhook("");
      await queryClient.invalidateQueries({ queryKey: SAFETY_SETTINGS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const savePrefs = useMutation({
    mutationFn: saveNotificationPrefsFn,
    onSuccess: async () => {
      toast.success("Notification preferences saved");
      await queryClient.invalidateQueries({ queryKey: ["notification-prefs"] });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const muted = new Set(prefs.data?.mutedCategories ?? []);

  function togglePlatform(platform: SocialPlatform, current: SocialPlatform[]) {
    const next = current.includes(platform)
      ? current.filter((item) => item !== platform)
      : [...current, platform];
    return next;
  }

  const filteredAudit = useMemo(() => {
    const rows = audit.data?.items ?? [];
    if (!action.trim()) return rows;
    const needle = action.trim().toLowerCase();
    return rows.filter(
      (row) =>
        row.action.toLowerCase().includes(needle) ||
        row.summary.toLowerCase().includes(needle) ||
        (row.clientId ?? "").toLowerCase().includes(needle),
    );
  }, [audit.data?.items, action]);

  if (!snapshot || !policy) {
    return (
      <section id="approvals" className="scroll-mt-24">
        {settings.isError ? (
          <ErrorState
            title="Couldn’t load safety settings"
            description="Admin-only. Sign in again if this keeps happening."
            onRetry={() => void settings.refetch()}
          />
        ) : (
          <Skeleton className="h-48 w-full max-w-3xl rounded-card" />
        )}
      </section>
    );
  }

  function onPolicy(event: FormEvent) {
    event.preventDefault();
  }

  return (
    <>
      <section id="approvals" className="scroll-mt-24 max-w-3xl">
        <GlassCard>
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-card font-semibold tracking-tight">Approvals</h2>
              <p className="text-caption text-muted">
                Turn on require approval before the first client publish. Draft jobs never wait.
              </p>
            </div>
          </div>
          <form className="mt-5 flex flex-col gap-4" onSubmit={onPolicy}>
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-body font-medium">Require approval for live publishes</span>
                <span className="block text-caption text-muted">
                  mode=publish waits for an admin sign-off. Default on for production safety.
                </span>
              </span>
              <Switch
                checked={policy.requireForSocialPublish}
                disabled={!isAdmin || savePolicy.isPending}
                onCheckedChange={(checked) =>
                  savePolicy.mutate({
                    data: { ...policy, requireForSocialPublish: checked },
                  })
                }
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-body font-medium">Allow Owner/Admin self-approve</span>
                <span className="block text-caption text-muted">
                  Solo operators should leave this on so you can sign off your own posts.
                </span>
              </span>
              <Switch
                checked={policy.allowSelfApprove}
                disabled={!isAdmin || savePolicy.isPending}
                onCheckedChange={(checked) =>
                  savePolicy.mutate({
                    data: { ...policy, allowSelfApprove: checked },
                  })
                }
              />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-body font-medium">Stage advances need approval</span>
                <span className="block text-caption text-muted">Manual pipeline moves only. Discord agent still writes.</span>
              </span>
              <Switch
                checked={policy.stageAdvanceRequiresApproval}
                disabled={!isAdmin || savePolicy.isPending}
                onCheckedChange={(checked) =>
                  savePolicy.mutate({
                    data: { ...policy, stageAdvanceRequiresApproval: checked },
                  })
                }
              />
            </label>
            <div>
              <p className="text-body font-medium">Limit to platforms</p>
              <p className="text-caption text-muted">Empty means every platform. Pick a subset to gate only those.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const on = policy.requireForPlatforms.includes(platform);
                  return (
                    <Button
                      key={platform}
                      type="button"
                      size="sm"
                      variant={on ? "primary" : "secondary"}
                      onClick={() =>
                        savePolicy.mutate({
                          data: {
                            ...policy,
                            requireForPlatforms: togglePlatform(platform, policy.requireForPlatforms),
                          },
                        })
                      }
                    >
                      {PLATFORM_LABELS[platform]}
                    </Button>
                  );
                })}
              </div>
            </div>
          </form>
        </GlassCard>
      </section>

      <section id="notifications" className="scroll-mt-24 max-w-3xl">
        <GlassCard>
          <h2 className="text-card font-semibold tracking-tight">Notification channels</h2>
          <p className="mt-1 text-caption text-muted">
            In-app is always on. Discord ops webhook and email webhook are optional.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <Label htmlFor="ops-discord">Discord ops webhook</Label>
              <Input
                id="ops-discord"
                className="mt-1"
                type="url"
                placeholder={
                  settings.data?.channels.discordWebhookConfigured
                    ? "Saved — paste a new URL to replace"
                    : "https://discord.com/api/webhooks/…"
                }
                value={webhook}
                onChange={(event) => setWebhook(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ops-email">Email webhook</Label>
              <Input
                id="ops-email"
                className="mt-1"
                type="url"
                placeholder={
                  settings.data?.channels.emailWebhookConfigured
                    ? "Saved — paste a new URL to replace"
                    : "https://…"
                }
                value={emailWebhook}
                onChange={(event) => setEmailWebhook(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={saveChannels.isPending}
                onClick={() =>
                  saveChannels.mutate({
                    data: {
                      discordWebhook: webhook || undefined,
                      emailWebhook: emailWebhook || undefined,
                    },
                  })
                }
              >
                Save webhooks
              </Button>
              {snapshot.channels.discordWebhookConfigured ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => saveChannels.mutate({ data: { clearDiscord: true } })}
                >
                  Disconnect
                </Button>
              ) : null}
            </div>
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-body font-medium">Email for WARNING/CRITICAL</span>
                <span className="block text-caption text-muted">
                  Posts to your email webhook if one is saved. Critical stays on for Owner.
                </span>
              </span>
              <Switch
                checked={snapshot.channels.emailEnabled}
                onCheckedChange={(checked) => saveChannels.mutate({ data: { emailEnabled: checked } })}
              />
            </label>
            {prefs.data ? (
              <div className="mt-2">
                <p className="text-body font-medium">Mute categories</p>
                <p className="text-caption text-muted">Critical still delivers for Owner/Admin.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {NOTIFICATION_CATEGORIES.map((category: NotificationCategory) => {
                    const on = muted.has(category);
                    return (
                      <Button
                        key={category}
                        type="button"
                        size="sm"
                        variant={on ? "primary" : "secondary"}
                        onClick={() => {
                          const next = new Set(muted);
                          if (on) next.delete(category);
                          else next.add(category);
                          savePrefs.mutate({
                            data: {
                              mutedCategories: [...next],
                              emailEnabled: prefs.data?.emailEnabled ?? false,
                            },
                          });
                        }}
                      >
                        {NOTIFICATION_CATEGORY_LABELS[category]}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </GlassCard>
      </section>

      {isAdmin ? (
      <section id="audit" className="scroll-mt-24 max-w-3xl">
        <GlassCard>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-card font-semibold tracking-tight">Audit log</h2>
              <p className="mt-1 text-caption text-muted">{snapshot.retentionNote}</p>
            </div>
            <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                const result = await listAuditEventsFn({
                  data: {
                    format: "csv",
                    since: since ? `${since}T00:00:00.000Z` : undefined,
                    until: until ? `${until}T23:59:59.999Z` : undefined,
                  },
                });
                if (result.csv) downloadTextFile("clippy-audit.csv", result.csv);
              }}
            >
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                const result = await listAuditEventsFn({
                  data: {
                    format: "json",
                    since: since ? `${since}T00:00:00.000Z` : undefined,
                    until: until ? `${until}T23:59:59.999Z` : undefined,
                  },
                });
                downloadTextFile("clippy-audit.json", JSON.stringify(result.items, null, 2));
              }}
            >
              Export JSON
            </Button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="audit-filter">Filter</Label>
              <Input
                id="audit-filter"
                className="mt-1"
                value={action}
                onChange={(event) => setAction(event.target.value)}
                placeholder="action, summary, or client"
              />
            </div>
            <div>
              <Label htmlFor="audit-since">From</Label>
              <Input
                id="audit-since"
                className="mt-1"
                type="date"
                value={since}
                onChange={(event) => setSince(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="audit-until">To</Label>
              <Input
                id="audit-until"
                className="mt-1"
                type="date"
                value={until}
                onChange={(event) => setUntil(event.target.value)}
              />
            </div>
          </div>
          {audit.isFetching && !audit.data ? (
            <Skeleton className="mt-4 h-32 w-full" />
          ) : filteredAudit.length === 0 ? (
            <p className="mt-4 text-body text-muted">No audit events in this range.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {filteredAudit.slice(0, 40).map((row) => (
                <li
                  key={row.id}
                  className="rounded-control border border-border bg-secondary-surface/40 px-3 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-body font-medium">{row.summary}</p>
                    <Badge tone={statusTone("PENDING")}>{AUDIT_ACTOR_LABELS[row.actorType]}</Badge>
                  </div>
                  <p className="mt-1 text-caption text-muted">
                    {row.action} · {formatRelativeTime(row.at)}
                    {row.entityType ? ` · ${row.entityType}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </section>
      ) : null}
    </>
  );
}
