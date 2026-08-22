import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_TYPE_LABELS,
  APPROVALS_QUERY_KEY,
  SAFETY_INBOX_QUERY_KEY,
  shortActor,
  type ApprovalRequest,
} from "@/lib/safety";
import { decideApprovalFn } from "@/lib/server/safety-fns";
import { formatRelativeTime } from "@/lib/format";
import { PLATFORM_LABELS } from "@/lib/social";
import type { SocialPlatform } from "@/lib/entities";
import { userFacingErrorMessage } from "@/lib/errors";
import { toast } from "sonner";
import { SOCIAL_QUERY_KEY } from "@/lib/social";

export function ApprovalReview({
  request,
  canDecide,
  compact,
}: {
  request: ApprovalRequest;
  canDecide: boolean;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const decide = useMutation({
    mutationFn: (decision: "APPROVED" | "REJECTED") =>
      decideApprovalFn({ data: { id: request.id, decision, note: note || undefined } }),
    onSuccess: async (_data, decision) => {
      toast.success(decision === "APPROVED" ? "Approved — publish will run now" : "Rejected");
      await queryClient.invalidateQueries({ queryKey: APPROVALS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: SAFETY_INBOX_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["client"] });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const payload = request.payload;
  const platforms = Array.isArray(payload.platforms)
    ? (payload.platforms as string[]).filter(
        (item): item is SocialPlatform =>
          item === "instagram" || item === "x" || item === "tiktok" || item === "youtube",
      )
    : [];
  const caption = typeof payload.caption === "string" ? payload.caption : null;
  const mediaUrl = typeof payload.mediaUrl === "string" ? payload.mediaUrl : null;
  const rail = typeof payload.preferredRail === "string" ? payload.preferredRail : null;
  const pending = request.status === "PENDING";

  return (
    <article className="rounded-control border border-border bg-secondary-surface/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-body font-medium">{request.title}</p>
          <p className="mt-1 text-caption text-muted">
            {APPROVAL_TYPE_LABELS[request.type]} · {formatRelativeTime(request.createdAt)}
            {` · ${shortActor(request.requestedBy)}`}
            {request.summary ? ` · ${request.summary}` : ""}
          </p>
        </div>
        <Badge tone={statusTone(request.status)}>{APPROVAL_STATUS_LABELS[request.status]}</Badge>
      </div>
      {platforms.length > 0 ? (
        <p className="mt-3 text-caption text-muted">
          {platforms.map((p) => PLATFORM_LABELS[p]).join(" · ")}
          {rail ? ` · ${rail}` : ""}
        </p>
      ) : null}
      {caption ? <p className="mt-2 text-body">{caption}</p> : null}
      {mediaUrl && !compact ? (
        <p className="mt-2 truncate text-caption text-muted">{mediaUrl}</p>
      ) : null}
      {request.decisionNote ? (
        <p className="mt-2 text-caption text-muted">Note: {request.decisionNote}</p>
      ) : null}
      {pending && canDecide ? (
        <div className="mt-4 flex flex-col gap-3">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional note"
            rows={2}
            aria-label="Decision note"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              className="min-h-11 flex-1 sm:flex-none"
              disabled={decide.isPending}
              onClick={() => decide.mutate("APPROVED")}
            >
              Approve
            </Button>
            <Button
              variant="ghost"
              className="min-h-11 flex-1 sm:flex-none"
              disabled={decide.isPending}
              onClick={() => decide.mutate("REJECTED")}
            >
              Reject
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
