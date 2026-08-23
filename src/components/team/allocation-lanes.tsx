import { Link } from "@tanstack/react-router";
import type { TeamLane } from "@/lib/team";
import type { TeamMember } from "@/lib/entities";
import { ROLE_LABELS, ROLE_TONES } from "@/lib/labels";
import { formatUsd } from "@/lib/format";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/magicui/blur-fade";

export function AllocationLanes({
  lanes,
  loading,
  canEdit = false,
  onEditHuman,
  onRemoveHuman,
}: {
  lanes: TeamLane[];
  loading: boolean;
  canEdit?: boolean;
  onEditHuman?: (member: TeamMember) => void;
  onRemoveHuman?: (member: TeamMember) => void;
}) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }, (_, index) => (
          <GlassCard key={index}>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-3 h-12 w-full" />
            <Skeleton className="mt-2 h-12 w-full" />
          </GlassCard>
        ))}
      </div>
    );
  }

  if (lanes.length === 0) {
    return (
      <EmptyState
        title="No active clients"
        description="Allocation lanes appear once you add an active client. Team costs stay attached to each roster."
        action={
          <Button asChild>
            <Link to="/clients">Open clients</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {lanes.map((lane, index) => (
        <BlurFade key={lane.clientId} delay={Math.min(index * 0.04, 0.2)}>
          <GlassCard>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <Link
                to="/clients/$clientId"
                params={{ clientId: lane.clientId }}
                className="text-card font-semibold tracking-tight hover:text-accent"
              >
                {lane.clientName}
              </Link>
              <p className="text-caption text-muted">
                {lane.members.length === 0
                  ? lane.aiTeammates.length
                    ? `${lane.aiTeammates.length} AI teammate${lane.aiTeammates.length === 1 ? "" : "s"}`
                    : "No team assigned"
                  : `${lane.members.length} teammate${lane.members.length === 1 ? "" : "s"}`}
              </p>
            </div>
            {lane.members.length === 0 && lane.aiTeammates.length === 0 ? (
              <p className="mt-3 text-body text-muted">
                Assign editors and designers from this page or the client record. Costs roll
                into the lane total. AI teammates never add load.
              </p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {lane.members.map((member) => (
                  <li
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-secondary-surface/50 px-3 py-3"
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <Badge tone={ROLE_TONES[member.role]}>
                        {ROLE_LABELS[member.role]}
                      </Badge>
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tabular-nums text-body">
                        {formatUsd(member.cost)}
                        <span className="text-caption text-muted"> / mo</span>
                      </span>
                      {canEdit ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => onEditHuman?.(member)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onRemoveHuman?.(member)}>
                            Remove
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </li>
                ))}
                {lane.aiTeammates.map((member) => (
                  <li
                    key={member.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-secondary-surface/50 px-3 py-3"
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <Badge tone="teal">Automation</Badge>
                      <span className="font-medium">{member.botLabel || member.name}</span>
                    </div>
                    <span className="text-caption text-muted">No load</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-body font-medium">
              Total team cost:{" "}
              <span className="tabular-nums">{formatUsd(lane.totalCost)}</span>
            </p>
          </GlassCard>
        </BlurFade>
      ))}
    </div>
  );
}
