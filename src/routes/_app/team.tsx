import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { getTeamSnapshotFn, removeHumanSeatFn, TEAM_QUERY_KEY } from "@/lib/server/team-fns";
import { deriveTeam } from "@/lib/team";
import { DEFAULT_TEAM_SETTINGS } from "@/lib/team";
import { MONEY_QUERY_KEY } from "@/lib/money";
import { formatUsd } from "@/lib/format";
import { CAPACITY_OVERLOAD_THRESHOLD } from "@/lib/constants";
import { userFacingErrorMessage } from "@/lib/errors";
import type { TeamMember } from "@/lib/entities";
import { AllocationLanes } from "@/components/team/allocation-lanes";
import { CapacityTracker } from "@/components/team/capacity-tracker";
import { AiTeammatesPanel } from "@/components/team/ai-teammates";
import { HumanEditor } from "@/components/team/human-editor";
import { MetricCard } from "@/components/money/metric-card";
import { SectionBoundary } from "@/components/clients/section-boundary";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { isActiveClient } from "@/lib/money";

export const Route = createFileRoute("/_app/team")({
  component: TeamPage,
});

function TeamPage() {
  const queryClient = useQueryClient();
  const snapshotQuery = useQuery({
    queryKey: TEAM_QUERY_KEY,
    queryFn: () => getTeamSnapshotFn(),
  });
  const derived = useMemo(() => {
    if (!snapshotQuery.data) return null;
    return deriveTeam(snapshotQuery.data.clients, snapshotQuery.data.teamMembers);
  }, [snapshotQuery.data]);
  const settings = snapshotQuery.data?.settings ?? DEFAULT_TEAM_SETTINGS;
  const canEdit = snapshotQuery.data?.role === "admin";
  const activeClients = (snapshotQuery.data?.clients ?? []).filter(isActiveClient);
  const [humanEditor, setHumanEditor] = useState<"create" | TeamMember | null>(null);
  const [removeHuman, setRemoveHuman] = useState<TeamMember | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => removeHumanSeatFn({ data: id }),
    onSuccess: () => {
      toast.success("Teammate removed");
      setRemoveHuman(null);
      void queryClient.invalidateQueries({ queryKey: TEAM_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: MONEY_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Team"
        description={`Humans carry load. Overloaded means more than ${CAPACITY_OVERLOAD_THRESHOLD} active clients. AI teammates never inflate headcount.`}
      />

      {snapshotQuery.isError ? (
        <div className="mt-6">
          <ErrorState
            title="Couldn’t load team"
            description="Assignments couldn’t be read. Try again."
            onRetry={() => void snapshotQuery.refetch()}
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <SectionBoundary title="Overview">
            {snapshotQuery.isPending || !derived ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-card" />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Team cost"
                  value={formatUsd(derived.overallCost)}
                  amount={derived.overallCost}
                  hint="Human seats on active clients"
                />
                <MetricCard
                  label="People assigned"
                  value={String(derived.assignedPeople)}
                  hint="Unique human names"
                />
                <MetricCard
                  label="Overloaded"
                  value={String(derived.overloadedCount)}
                  hint={`Over ${CAPACITY_OVERLOAD_THRESHOLD} clients`}
                  tone={derived.overloadedCount > 0 ? "danger" : "default"}
                />
                <MetricCard
                  label="AI teammates"
                  value={String(derived.aiActiveCount)}
                  hint="Active automation seats"
                />
              </div>
            )}
          </SectionBoundary>

          <SectionBoundary title="Humans">
            {canEdit ? (
              <div className="mb-3 flex justify-end">
                <Button
                  className="min-h-11"
                  onClick={() => setHumanEditor("create")}
                  disabled={activeClients.length === 0}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add human
                </Button>
              </div>
            ) : null}
            <CapacityTracker
              rows={derived?.capacity ?? []}
              aiActiveCount={derived?.aiActiveCount ?? 0}
              loading={snapshotQuery.isPending}
            />
          </SectionBoundary>

          <SectionBoundary title="Allocation lanes">
            <AllocationLanes
              lanes={derived?.lanes ?? []}
              loading={snapshotQuery.isPending}
              canEdit={canEdit}
              onEditHuman={(member) => setHumanEditor(member)}
              onRemoveHuman={setRemoveHuman}
            />
          </SectionBoundary>

          <SectionBoundary title="AI teammates">
            <AiTeammatesPanel
              members={derived?.aiTeammates ?? []}
              tokens={snapshotQuery.data?.tokens ?? []}
              clients={activeClients}
              settings={settings}
              canEdit={canEdit}
              loading={snapshotQuery.isPending}
            />
          </SectionBoundary>
        </div>
      )}

      <HumanEditor
        open={humanEditor !== null}
        member={humanEditor === "create" || humanEditor == null ? null : humanEditor}
        clients={activeClients}
        onClose={() => setHumanEditor(null)}
      />

      <Dialog open={Boolean(removeHuman)} onOpenChange={(open) => !open && setRemoveHuman(null)}>
        <DialogContent>
          <DialogTitle>Remove {removeHuman?.name}?</DialogTitle>
          <DialogDescription>
            Soft-deletes the assignment. Money and capacity drop this seat immediately.
          </DialogDescription>
          <Button
            className="mt-4 min-h-11 w-full"
            variant="destructive"
            onClick={() => removeHuman && remove.mutate(removeHuman.id)}
            disabled={remove.isPending}
          >
            Remove
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
