import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { DEFAULT_PORTAL_SETTINGS, PORTAL_SETTINGS_KEY } from "@/lib/portal";
import { getPortalSettingsFn, savePortalSettingsFn } from "@/lib/server/portal-admin-fns";
import { getSafetyInbox } from "@/lib/server/safety-fns";
import { SAFETY_INBOX_QUERY_KEY } from "@/lib/safety";
import { userFacingErrorMessage } from "@/lib/errors";

export function PortalPanel() {
  const queryClient = useQueryClient();
  const inbox = useQuery({ queryKey: SAFETY_INBOX_QUERY_KEY, queryFn: () => getSafetyInbox() });
  const settings = useQuery({
    queryKey: PORTAL_SETTINGS_KEY,
    queryFn: () => getPortalSettingsFn(),
  });
  const [enabled, setEnabled] = useState(true);
  const [allowDownload, setAllowDownload] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [approvalsEnabled, setApprovalsEnabled] = useState(true);
  const [agencyName, setAgencyName] = useState(DEFAULT_PORTAL_SETTINGS.agencyName);
  const [logoUrl, setLogoUrl] = useState("");
  const [welcomeBlurb, setWelcomeBlurb] = useState(DEFAULT_PORTAL_SETTINGS.welcomeBlurb);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!settings.data || hydrated) return;
    setEnabled(settings.data.enabled);
    setAllowDownload(settings.data.allowDownload);
    setShowMetrics(settings.data.showMetrics);
    setApprovalsEnabled(settings.data.approvalsEnabled);
    setAgencyName(settings.data.agencyName);
    setLogoUrl(settings.data.logoUrl ?? "");
    setWelcomeBlurb(settings.data.welcomeBlurb);
    setHydrated(true);
  }, [settings.data, hydrated]);

  const save = useMutation({
    mutationFn: () =>
      savePortalSettingsFn({
        data: {
          enabled,
          allowDownload,
          showMetrics,
          approvalsEnabled,
          agencyName,
          logoUrl: logoUrl.trim() || null,
          welcomeBlurb,
        },
      }),
    onSuccess: async () => {
      toast.success("Portal settings saved");
      await queryClient.invalidateQueries({ queryKey: PORTAL_SETTINGS_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const isAdmin = inbox.data?.role === "admin";

  if (settings.isPending) return <Skeleton className="h-48 w-full max-w-3xl" />;
  if (settings.isError) {
    return (
      <ErrorState
        className="max-w-3xl"
        title="Couldn’t load portal settings"
        onRetry={() => void settings.refetch()}
      />
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <section id="portal" className="scroll-mt-24">
      <GlassCard className="max-w-3xl">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <Globe className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-card font-semibold tracking-tight">Client portal</h2>
            <p className="mt-1 text-caption text-muted">
              A separate, mobile-first login for brand stakeholders. Isolated from staff sessions.
              Invite people from each client page.
            </p>
          </div>
        </div>

        <form className="mt-6 flex flex-col gap-5" onSubmit={onSubmit}>
          <label className="flex min-h-11 items-center justify-between gap-3">
            <span className="text-body">Enable portal</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} disabled={!isAdmin} />
          </label>
          <label className="flex min-h-11 items-center justify-between gap-3">
            <span className="text-body">Allow downloads of ready assets</span>
            <Switch checked={allowDownload} onCheckedChange={setAllowDownload} disabled={!isAdmin} />
          </label>
          <label className="flex min-h-11 items-center justify-between gap-3">
            <span className="text-body">Show high-level view counts</span>
            <Switch checked={showMetrics} onCheckedChange={setShowMetrics} disabled={!isAdmin} />
          </label>
          <label className="flex min-h-11 items-center justify-between gap-3">
            <span className="text-body">Let portal users approve publishes</span>
            <Switch checked={approvalsEnabled} onCheckedChange={setApprovalsEnabled} disabled={!isAdmin} />
          </label>
          <div className="flex flex-col gap-2">
            <Label htmlFor="portal-agency-name">Agency display name</Label>
            <Input
              id="portal-agency-name"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              disabled={!isAdmin}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="portal-logo">Logo URL</Label>
            <Input
              id="portal-logo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://…"
              disabled={!isAdmin}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="portal-welcome">Welcome blurb</Label>
            <Textarea
              id="portal-welcome"
              value={welcomeBlurb}
              onChange={(e) => setWelcomeBlurb(e.target.value)}
              rows={3}
              disabled={!isAdmin}
            />
          </div>
          {isAdmin ? (
            <div>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save portal settings"}
              </Button>
            </div>
          ) : (
            <p className="text-caption text-muted">Only owners can change portal policy.</p>
          )}
        </form>
      </GlassCard>
    </section>
  );
}
