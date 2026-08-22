import { Instagram, Music2, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import type { SocialPlatform } from "@/lib/entities";
import type { PublisherStatus } from "@/lib/publishers";
import { TIKTOK_MODE_LABELS } from "@/lib/publishers";
import {
  PLATFORM_LABELS,
  sessionLabel,
  type MachineState,
  type PlatformSessionState,
} from "@/lib/social";

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L5.2 22H1.94l8.02-9.16L1.5 2h6.76l4.66 6.18L18.244 2Zm-1.16 18.15h1.81L6.99 3.76H5.05l12.03 16.39Z"
      />
    </svg>
  );
}

const ICONS: Record<SocialPlatform, typeof Instagram> = {
  instagram: Instagram,
  x: XMark as typeof Instagram,
  tiktok: Music2,
  youtube: Youtube,
};

export function PlatformCards({
  sessions,
  publishers,
  machineState,
  configured,
  onOpen,
  onMark,
  opening,
}: {
  sessions: Record<SocialPlatform, PlatformSessionState>;
  publishers?: Record<SocialPlatform, PublisherStatus>;
  machineState: MachineState;
  configured: boolean;
  onOpen: (platform: SocialPlatform) => void;
  onMark: (platform: SocialPlatform, state: PlatformSessionState) => void;
  opening: SocialPlatform | null;
}) {
  const running = machineState === "running";
  const platforms: SocialPlatform[] = ["instagram", "x", "tiktok", "youtube"];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {platforms.map((platform) => {
        const Icon = ICONS[platform];
        const session = sessions[platform];
        const pub = publishers?.[platform];
        const tone =
          session === "logged_in" ? "green" : session === "not_logged_in" ? "orange" : "neutral";
        const tiktokMode =
          pub?.tiktok?.eligibleDirectPost && pub.tiktok.postModeDefault === "DIRECT_POST"
            ? TIKTOK_MODE_LABELS.DIRECT_POST
            : TIKTOK_MODE_LABELS.UPLOAD_TO_INBOX;
        return (
          <GlassCard key={platform} interactive>
            <div className="relative z-[1] flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid size-11 place-items-center rounded-control bg-secondary-surface">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-card font-semibold tracking-tight">
                    {PLATFORM_LABELS[platform]}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge tone={tone}>{sessionLabel(session)}</Badge>
                    {platform === "tiktok" && pub?.eligible ? (
                      <Badge tone="teal">{tiktokMode}</Badge>
                    ) : null}
                    {platform === "instagram" && pub?.eligible ? (
                      <Badge tone="teal">Professional</Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
            <p className="relative z-[1] mt-2 text-caption text-muted">
              {platform === "instagram"
                ? pub?.eligible
                  ? `API: ${pub.handle ?? "connected"} (Professional)`
                  : "API not connected — Browser only"
                : platform === "youtube"
                  ? pub?.eligible
                    ? pub.handle
                      ? `API connected as ${pub.handle}`
                      : "API connected"
                    : "API not connected — Studio in the browser"
                  : pub?.eligible
                    ? pub.handle
                      ? `API connected as ${pub.handle}`
                      : "API connected"
                    : "API not connected — using browser"}
            </p>
            {!configured || machineState === "stopped" || machineState === "not_configured" ? (
              <p className="relative z-[1] mt-3 text-caption text-muted">
                {publishers?.[platform]?.eligible
                  ? "API ready — 1-click upload does not need the machine."
                  : configured
                    ? "Start the Social Machine to open this site in the desktop."
                    : "Connect a publisher API in Settings, or Daytona for Computer Use."}
              </p>
            ) : null}
            <div className="relative z-[1] mt-4 flex flex-col gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={!running || opening === platform}
                onClick={() => onOpen(platform)}
              >
                {opening === platform ? "Opening…" : "Open in Machine"}
              </Button>
              <div className="flex flex-wrap gap-1">
                {(["logged_in", "not_logged_in", "unknown"] as const).map((state) => (
                  <Button
                    key={state}
                    size="sm"
                    variant={session === state ? "secondary" : "ghost"}
                    onClick={() => onMark(platform, state)}
                  >
                    {sessionLabel(state)}
                  </Button>
                ))}
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
