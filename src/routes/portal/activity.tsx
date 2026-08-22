import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/glass-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";
import { PORTAL_ACTIVITY_KEY } from "@/lib/portal";
import { listPortalActivityFn } from "@/lib/server/portal-fns";

export const Route = createFileRoute("/portal/activity")({
  component: PortalActivityPage,
});

function PortalActivityPage() {
  const query = useQuery({
    queryKey: PORTAL_ACTIVITY_KEY,
    queryFn: () => listPortalActivityFn(),
  });

  if (query.isPending) return <Skeleton className="h-40 w-full" />;
  if (query.isError) {
    return <ErrorState title="Couldn’t load activity" onRetry={() => void query.refetch()} />;
  }

  const items = query.data?.items ?? [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Activity"
        description="Client-visible updates only — stage changes, ready assets, and approvals. No fees or internal tools."
      />
      {items.length === 0 ? (
        <EmptyState
          title="Quiet so far"
          description="Stage changes and approvals will appear on this timeline."
        />
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <GlassCard className="p-4">
                <p className="text-body font-medium">{item.title}</p>
                {item.detail ? <p className="mt-1 text-caption text-muted">{item.detail}</p> : null}
                <p className="mt-2 text-caption text-muted">{formatRelativeTime(item.at)}</p>
              </GlassCard>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
