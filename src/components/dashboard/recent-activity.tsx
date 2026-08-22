import {
  ArrowRightLeft,
  Clapperboard,
  CreditCard,
  UserPlus,
  Users,
} from "lucide-react";
import type { ActivityItem, ActivityKind } from "@/lib/dashboard";
import { formatRelativeTime } from "@/lib/format";
import { DashLink } from "@/components/dashboard/dash-link";
import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShineBorder } from "@/components/magicui/shine-border";

const ICONS: Record<ActivityKind, typeof Users> = {
  payment_paid: CreditCard,
  stage_change: Clapperboard,
  lead_created: UserPlus,
  lead_moved: ArrowRightLeft,
  client_created: Users,
};

export function RecentActivity({
  items,
  loading,
}: {
  items: ActivityItem[];
  loading: boolean;
}) {
  return (
    <GlassCard className="relative overflow-hidden">
      <ShineBorder />
      <div className="relative z-[1]">
        <h2 className="text-card font-semibold tracking-tight">Recent activity</h2>
        <p className="mt-1 text-caption text-muted">
          Latest payments, stages, leads, and new clients — derived, not a separate log.
        </p>
        {loading ? (
          <div className="mt-4 flex flex-col gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="mt-4 rounded-control bg-secondary-surface/50 px-3 py-3 text-body text-muted">
            No recent activity yet
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-1">
            {items.map((item) => {
              const Icon = ICONS[item.kind];
              return (
                <li key={item.id}>
                  <DashLink
                    href={item.href}
                    className="flex min-h-11 items-center gap-3 rounded-control px-2 py-2 hover:bg-secondary-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary-surface text-muted">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 text-body">{item.title}</span>
                    <time
                      className="shrink-0 text-caption text-muted"
                      dateTime={item.at}
                    >
                      {formatRelativeTime(item.at)}
                    </time>
                  </DashLink>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </GlassCard>
  );
}
