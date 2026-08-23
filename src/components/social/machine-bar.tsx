import { useState } from "react";
import { MonitorPlay, Square, Play, Globe, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { machineLabel, machineTone, SOCIAL_QUERY_KEY, type SocialMachineStatus } from "@/lib/social";
import { formatRelativeTime } from "@/lib/format";
import { DEFAULT_PROXY_COUNTRY, PROXY_COUNTRIES } from "@/lib/social-machine";
import { provisionLocationProxyFn } from "@/lib/server/social";
import { userFacingErrorMessage } from "@/lib/errors";
import { GROK_BOT_CONNECTION_LABELS, GROK_BOT_QUERY_KEY, grokBotConnectionTone } from "@/lib/grok-bot";
import { getGrokBotStatusFn } from "@/lib/server/grok-bot-fns";

export function MachineBar({
  machine,
  onStart,
  onStop,
  starting,
  stopping,
}: {
  machine: SocialMachineStatus;
  onStart: () => void;
  onStop: () => void;
  starting: boolean;
  stopping: boolean;
}) {
  const queryClient = useQueryClient();
  const [geoOpen, setGeoOpen] = useState(false);
  const [country, setCountry] = useState(DEFAULT_PROXY_COUNTRY);
  const grokQuery = useQuery({
    queryKey: GROK_BOT_QUERY_KEY,
    queryFn: () => getGrokBotStatusFn(),
    refetchInterval: 20000,
  });
  const canStart =
    machine.configured &&
    (machine.state === "stopped" || machine.state === "error" || machine.state === "paused") &&
    !starting &&
    !stopping;
  const canStop =
    (machine.state === "running" || machine.state === "starting") && !stopping;
  const resume = machine.state === "paused";

  const provision = useMutation({
    mutationFn: () => provisionLocationProxyFn({ data: { country } }),
    onSuccess: async (result) => {
      toast.success(`Location matched · ${result.country}${result.egressIp ? ` · ${result.egressIp}` : ""}`);
      await queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
      setGeoOpen(false);
      onStart();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  function requestStart() {
    if (resume || machine.proxyConfigured) {
      onStart();
      return;
    }
    setGeoOpen(true);
  }

  return (
    <GlassCard className="social-machine-bar sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 md:static">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-11 place-items-center rounded-control bg-secondary-surface">
            <MonitorPlay className="size-5" aria-hidden="true" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-card font-semibold tracking-tight">Social Machine</h2>
              <Badge tone={machineTone(machine.state)}>{machineLabel(machine.state)}</Badge>
              {machine.proxyConfigured ? <Badge tone="green">Location ready</Badge> : null}
            </div>
            <p className="mt-1 text-caption text-muted">
              {resume
                ? "Hibernated hot snapshot — Resume picks up the same session, cookies, and open apps."
                : `Opens X, YouTube, Instagram, and TikTok from inside ClippyOS. Idle hibernate after ${machine.autoStopMinutes} min.`}
            </p>
            {machine.startedAt ? (
              <p className="mt-1 text-caption text-muted">
                Started {formatRelativeTime(machine.startedAt)}
                {machine.longRunning ? " · running a long time — hibernate if idle." : ""}
              </p>
            ) : null}
            {machine.lastError ? (
              <p className="mt-1 text-caption text-danger">{machine.lastError}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={requestStart}
            disabled={!canStart}
            aria-label={resume ? "Resume Social Machine" : "Start Social Machine"}
          >
            <Play className="size-4" aria-hidden="true" />
            {starting || provision.isPending ? "Starting…" : resume ? "Resume" : "Start Social Machine"}
          </Button>
          <Button
            variant={canStop ? "destructive" : "ghost"}
            onClick={onStop}
            disabled={!canStop}
            aria-label="Hibernate Social Machine"
          >
            <Square className="size-4" aria-hidden="true" />
            {stopping ? "Hibernating…" : "Hibernate"}
          </Button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-control bg-secondary-surface/50 px-3 py-2">
        <Sparkles className="size-4 text-muted" aria-hidden="true" />
        <p className="text-caption font-medium">Grok Bot</p>
        {grokQuery.data ? (
          <Badge tone={grokBotConnectionTone(grokQuery.data.connection)}>
            {GROK_BOT_CONNECTION_LABELS[grokQuery.data.connection]}
          </Badge>
        ) : (
          <Badge tone="neutral">—</Badge>
        )}
        {grokQuery.data && grokQuery.data.queued > 0 ? (
          <Badge tone="orange">{grokQuery.data.queued} queued</Badge>
        ) : null}
        <Button size="sm" variant="ghost" asChild className="ml-auto min-h-10">
          <Link to="/settings" hash="grok-bot">
            Connect
          </Link>
        </Button>
      </div>
      <p className="mt-3 text-caption text-muted">{machine.pathNote}</p>

      <Dialog open={geoOpen} onOpenChange={setGeoOpen}>
        <DialogContent>
          <DialogTitle>Where should the Social Machine appear from?</DialogTitle>
          <DialogDescription>
            First start matches your country so X, YouTube, Instagram, and TikTok open from
            inside the OS as if you were there. Australia is the default.
          </DialogDescription>
          <div className="mt-4 flex flex-col gap-2">
            <Label htmlFor="proxy-country">Country</Label>
            <Select value={country} onValueChange={(value) => setCountry(value as typeof country)}>
              <SelectTrigger id="proxy-country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROXY_COUNTRIES.map((row) => (
                  <SelectItem key={row.code} value={row.code}>
                    {row.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button disabled={provision.isPending} onClick={() => provision.mutate()}>
              <Globe className="size-4" aria-hidden="true" />
              {provision.isPending ? "Matching location…" : "Match location and start"}
            </Button>
            <Button
              variant="ghost"
              disabled={provision.isPending}
              onClick={() => {
                setGeoOpen(false);
                onStart();
              }}
            >
              Start without matching
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
}
