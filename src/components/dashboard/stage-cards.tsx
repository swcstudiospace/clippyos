import { Link } from "@tanstack/react-router";
import type { ClientListItem } from "@/lib/server/clients";
import type { PipelineFilter } from "@/lib/dashboard";
import { daysSinceTimestamp, inclusiveDayCount } from "@/lib/dashboard";
import { isActiveClient } from "@/lib/money";
import { GUARANTEE_WINDOW_DAYS } from "@/lib/constants";
import { PLAN_LABELS, PLAN_TONES } from "@/lib/labels";
import { initials, todayIsoDate } from "@/lib/format";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { StagePill } from "@/components/ui/stage-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/magicui/blur-fade";

export function ClientStageCards({
  clients,
  loading,
  filter = null,
}: {
  clients: ClientListItem[];
  loading: boolean;
  filter?: PipelineFilter;
}) {
  const today = todayIsoDate();
  const active = clients.filter(isActiveClient).filter((client) => {
    if (filter === "NONE") return !client.currentStage;
    if (filter) return client.currentStage === filter;
    return true;
  });

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <GlassCard key={index}>
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="mt-3 h-5 w-32" />
            <Skeleton className="mt-2 h-6 w-24" />
          </GlassCard>
        ))}
      </div>
    );
  }

  if (active.length === 0) {
    const filtered = Boolean(filter);
    return (
      <EmptyState
        title={filtered ? "No clients in this stage" : "No active clients"}
        description={
          filtered
            ? "Clear the pipeline filter to see the full roster."
            : "Active roster cards show each client’s current production stage."
        }
        action={
          filtered ? undefined : (
            <Button asChild>
              <Link to="/clients">Add a client</Link>
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {active.map((client, index) => {
        const dayCount = client.startDate
          ? inclusiveDayCount(client.startDate, today)
          : null;
        const inStage = daysSinceTimestamp(client.currentStageAt, today);
        return (
          <BlurFade key={client.id} delay={Math.min(index * 0.04, 0.24)}>
            <GlassCard interactive className="p-0">
              <Link
                to="/clients/$clientId"
                params={{ clientId: client.id }}
                className="flex h-full flex-col gap-3 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="grid size-10 place-items-center rounded-full bg-secondary-surface text-caption font-semibold"
                    aria-hidden="true"
                  >
                    {client.channelThumbnail ? (
                      <img
                        src={client.channelThumbnail}
                        alt=""
                        className="size-10 rounded-full object-cover"
                      />
                    ) : (
                      initials(client.name)
                    )}
                  </span>
                  <Badge tone={PLAN_TONES[client.planType]}>
                    {client.planType === "CUSTOM" && client.customPlanLabel
                      ? client.customPlanLabel
                      : PLAN_LABELS[client.planType]}
                  </Badge>
                </div>
                <p className="text-card font-semibold tracking-tight">{client.name}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <StagePill stage={client.currentStage} />
                  {client.currentSource === "AI_DISCORD" ? (
                    <span className="text-caption text-muted">via Discord</span>
                  ) : client.currentSource === "AGENT" ? (
                    <span className="text-caption text-muted">via Agent</span>
                  ) : null}
                </div>
                <p className="text-caption text-muted">
                  {dayCount != null && dayCount > 0
                    ? `Day ${dayCount}/${GUARANTEE_WINDOW_DAYS}`
                    : "No start date"}
                  {inStage != null && client.currentStage
                    ? inStage === 0
                      ? " · stage updated today"
                      : ` · ${inStage}d in stage`
                    : null}
                </p>
              </Link>
            </GlassCard>
          </BlurFade>
        );
      })}
    </div>
  );
}
