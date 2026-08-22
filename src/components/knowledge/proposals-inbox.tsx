import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime } from "@/lib/format";
import { userFacingErrorMessage } from "@/lib/errors";
import {
  KNOWLEDGE_PROPOSALS_KEY,
  SCOPE_LABELS,
  type KnowledgeProposal,
} from "@/lib/performance";
import { decideKnowledgeProposalFn, listKnowledgeProposalsFn } from "@/lib/server/performance-fns";
import { knowledgeEntriesQueryKey } from "@/lib/knowledge";
import { LinearIssueActions } from "@/components/linear/issue-actions";

export function KnowledgeProposalsInbox({
  clientId,
  clientNames,
  compact,
}: {
  clientId?: string;
  clientNames?: Map<string, string>;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: [...KNOWLEDGE_PROPOSALS_KEY, clientId ?? "all"],
    queryFn: () =>
      listKnowledgeProposalsFn({
        data: { status: "PENDING_REVIEW", clientId },
      }),
  });
  const decide = useMutation({
    mutationFn: (input: { id: string; decision: "APPROVED" | "REJECTED" }) =>
      decideKnowledgeProposalFn({ data: input }),
    onSuccess: async (row) => {
      toast.success(row.status === "MERGED" ? "Merged into knowledge" : "Proposal rejected");
      await queryClient.invalidateQueries({ queryKey: KNOWLEDGE_PROPOSALS_KEY });
      await queryClient.invalidateQueries({ queryKey: knowledgeEntriesQueryKey("VIDEO_GLOBAL") });
      await queryClient.invalidateQueries({ queryKey: knowledgeEntriesQueryKey("THUMBNAIL_GLOBAL") });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  if (query.isPending) {
    return <Skeleton className="h-32 w-full" />;
  }
  if (query.isError) {
    return (
      <ErrorState
        title="Couldn’t load proposals"
        description="Retry in a moment."
        onRetry={() => void query.refetch()}
      />
    );
  }
  const items = query.data?.items ?? [];
  if (items.length === 0) {
    if (compact) return null;
    return (
      <GlassCard>
        <h2 className="text-card font-semibold tracking-tight">Proposals from performance</h2>
        <p className="mt-1 text-caption text-muted">
          Winning posts draft principles here. Approve to inject them into Ideation, titles, and
          thumbnails. Auto-merge stays off.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <h2 className="text-card font-semibold tracking-tight">
        Proposals from performance{items.length ? ` · ${items.length}` : ""}
      </h2>
      <p className="mt-1 text-caption text-muted">
        Human review only. Approving writes a KnowledgeEntry in the suggested scope.
      </p>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((row) => (
          <ProposalCard
            key={row.id}
            row={row}
            clientName={row.clientId ? clientNames?.get(row.clientId) : undefined}
            pending={decide.isPending}
            onDecide={(decision) => decide.mutate({ id: row.id, decision })}
          />
        ))}
      </ul>
    </GlassCard>
  );
}

function ProposalCard({
  row,
  clientName,
  pending,
  onDecide,
}: {
  row: KnowledgeProposal;
  clientName?: string;
  pending: boolean;
  onDecide: (decision: "APPROVED" | "REJECTED") => void;
}) {
  return (
    <li className="rounded-control border border-border bg-secondary-surface/40 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone("PENDING")}>{SCOPE_LABELS[row.suggestedScope]}</Badge>
        {clientName ? <Badge tone="neutral">{clientName}</Badge> : null}
        {row.confidence != null ? (
          <span className="text-caption text-muted">{Math.round(row.confidence * 100)}% confidence</span>
        ) : null}
        <span className="text-caption text-muted">{formatRelativeTime(row.createdAt)}</span>
      </div>
      <p className="mt-2 text-body">{row.learnedPrincipleDraft}</p>
      <p className="mt-1 text-caption text-muted">{row.userInputDraft}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={pending} onClick={() => onDecide("APPROVED")}>
          Approve & merge
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => onDecide("REJECTED")}>
          Reject
        </Button>
        <LinearIssueActions
          entityType="KnowledgeProposal"
          entityId={row.id}
          title={`Review learning: ${row.learnedPrincipleDraft.slice(0, 80)}`}
          description={row.learnedPrincipleDraft}
          labels={["learning"]}
          compact
        />
      </div>
    </li>
  );
}
