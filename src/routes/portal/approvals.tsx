import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge, statusTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_TYPE_LABELS,
  type ApprovalRequest,
} from "@/lib/safety";
import { PLATFORM_LABELS } from "@/lib/social";
import type { SocialPlatform } from "@/lib/entities";
import { formatRelativeTime } from "@/lib/format";
import { PORTAL_APPROVALS_KEY, PORTAL_HOME_KEY } from "@/lib/portal";
import { decidePortalApprovalFn, listPortalApprovalsFn } from "@/lib/server/portal-fns";
import { toast } from "sonner";
import { userFacingErrorMessage } from "@/lib/errors";

export const Route = createFileRoute("/portal/approvals")({
  component: PortalApprovalsPage,
});

function PortalApprovalsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: PORTAL_APPROVALS_KEY,
    queryFn: () => listPortalApprovalsFn(),
  });
  const [notes, setNotes] = useState<Record<string, string>>({});

  const decide = useMutation({
    mutationFn: (input: { id: string; decision: "APPROVED" | "REJECTED"; note?: string }) =>
      decidePortalApprovalFn({ data: input }),
    onSuccess: async (_data, vars) => {
      toast.success(vars.decision === "APPROVED" ? "Approved — we’ll publish from here" : "Sent back with your note");
      await queryClient.invalidateQueries({ queryKey: PORTAL_APPROVALS_KEY });
      await queryClient.invalidateQueries({ queryKey: PORTAL_HOME_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  if (query.isPending) return <Skeleton className="h-40 w-full" />;
  if (query.isError) {
    return <ErrorState title="Couldn’t load reviews" onRetry={() => void query.refetch()} />;
  }

  const items = query.data?.items ?? [];
  const canApprove = query.data?.canApprove ?? false;
  const pending = items.filter((row) => row.status === "PENDING");
  const history = items.filter((row) => row.status !== "PENDING");

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Approvals"
        description="Sign off on publishes and ready renders. Requesting changes blocks the live post until the team revises."
      />
      {pending.length === 0 ? (
        <EmptyState
          title="Nothing waiting"
          description="When a post needs your sign-off, it will show up here with a preview and caption."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {pending.map((row) => (
            <li key={row.id}>
              <ApprovalCard
                request={row}
                canApprove={canApprove}
                note={notes[row.id] ?? ""}
                onNote={(value) => setNotes((prev) => ({ ...prev, [row.id]: value }))}
                busy={decide.isPending}
                onDecide={(decision) =>
                  decide.mutate({
                    id: row.id,
                    decision,
                    note: notes[row.id]?.trim() || undefined,
                  })
                }
              />
            </li>
          ))}
        </ul>
      )}
      {history.length > 0 ? (
        <div>
          <h2 className="mb-3 text-card font-semibold tracking-tight">History</h2>
          <ul className="flex flex-col gap-2">
            {history.map((row) => (
              <li key={row.id}>
                <GlassCard className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="text-body font-medium">{row.title}</p>
                    <p className="text-caption text-muted">
                      {formatRelativeTime(row.createdAt)}
                      {row.decisionNote ? ` · ${row.decisionNote}` : ""}
                    </p>
                  </div>
                  <Badge tone={statusTone(row.status)}>{APPROVAL_STATUS_LABELS[row.status]}</Badge>
                </GlassCard>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ApprovalCard({
  request,
  canApprove,
  note,
  onNote,
  onDecide,
  busy,
}: {
  request: ApprovalRequest;
  canApprove: boolean;
  note: string;
  onNote: (value: string) => void;
  onDecide: (decision: "APPROVED" | "REJECTED") => void;
  busy: boolean;
}) {
  const platforms = Array.isArray(request.payload.platforms)
    ? (request.payload.platforms as string[]).filter(
        (item): item is SocialPlatform =>
          item === "instagram" || item === "x" || item === "tiktok" || item === "youtube",
      )
    : [];
  const caption = typeof request.payload.caption === "string" ? request.payload.caption : null;
  const mediaUrl = typeof request.payload.mediaUrl === "string" ? request.payload.mediaUrl : null;

  return (
    <GlassCard>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-body font-medium">{request.title}</p>
          <p className="mt-1 text-caption text-muted">
            {APPROVAL_TYPE_LABELS[request.type]} · {formatRelativeTime(request.createdAt)}
          </p>
        </div>
        <Badge tone={statusTone(request.status)}>{APPROVAL_STATUS_LABELS[request.status]}</Badge>
      </div>
      {platforms.length > 0 ? (
        <p className="mt-3 text-caption text-muted">
          {platforms.map((p) => PLATFORM_LABELS[p]).join(" · ")}
        </p>
      ) : null}
      {caption ? <p className="mt-2 text-body">{caption}</p> : null}
      {mediaUrl ? (
        <div className="mt-3 overflow-hidden rounded-control bg-secondary-surface">
          {/\.(png|jpe?g|webp|gif)(\?|$)/i.test(mediaUrl) ? (
            <img src={mediaUrl} alt="" className="max-h-72 w-full object-contain" />
          ) : (
            <video src={mediaUrl} className="max-h-72 w-full" controls playsInline />
          )}
        </div>
      ) : null}
      {canApprove ? (
        <div className="mt-4 flex flex-col gap-3">
          <Textarea
            value={note}
            onChange={(e) => onNote(e.target.value)}
            placeholder="Optional for approve · required if you request changes"
            rows={3}
          />
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => onDecide("APPROVED")}>
              Approve
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => onDecide("REJECTED")}
            >
              Request changes
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-caption text-muted">
          Approvals are off for this login. Ask your producer if you need to sign off.
        </p>
      )}
    </GlassCard>
  );
}
