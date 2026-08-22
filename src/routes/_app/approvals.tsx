import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { ApprovalReview } from "@/components/safety/approval-review";
import { APPROVALS_QUERY_KEY, type ApprovalRequest } from "@/lib/safety";
import { listApprovalsFn, getSafetyInbox } from "@/lib/server/safety-fns";
import { SAFETY_INBOX_QUERY_KEY } from "@/lib/safety";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/approvals")({
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const search = useRouterState({ select: (s) => s.location.search as Record<string, unknown> });
  const focusId = typeof search.id === "string" ? search.id : null;
  const [tab, setTab] = useState<"PENDING" | "ALL">("PENDING");
  const inbox = useQuery({
    queryKey: SAFETY_INBOX_QUERY_KEY,
    queryFn: () => getSafetyInbox(),
  });
  const query = useQuery({
    queryKey: [...APPROVALS_QUERY_KEY, tab],
    queryFn: () => listApprovalsFn({ data: tab === "PENDING" ? { status: "PENDING" } : {} }),
  });
  const [sheetId, setSheetId] = useState<string | null>(focusId);

  const items = query.data?.items ?? [];
  const role = inbox.data?.role ?? null;
  const canDecide = role === "admin";
  const focused = useMemo(
    () => items.find((row) => row.id === (sheetId ?? focusId)) ?? null,
    [items, sheetId, focusId],
  );

  if (query.isPending) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader
          title="Approvals"
          description="Sign off before a publish goes live. Drafts never need this."
        />
        <Skeleton className="mt-6 h-32 w-full rounded-card" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Approvals" />
        <ErrorState
          className="mt-6"
          title="Couldn’t load approvals"
          description="Retry in a moment."
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-24 md:pb-8">
      <PageHeader
        title="Approvals"
        description="No accidental public posts. Approve to run the upload; reject to block it."
      />
      <div className="mt-6 flex gap-2">
        <Button variant={tab === "PENDING" ? "primary" : "ghost"} size="sm" onClick={() => setTab("PENDING")}>
          Waiting
        </Button>
        <Button variant={tab === "ALL" ? "primary" : "ghost"} size="sm" onClick={() => setTab("ALL")}>
          All
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState
          className="mt-6"
          title={tab === "PENDING" ? "Nothing waiting" : "No approval history"}
          description="Publish jobs appear here when require-approval is on. Drafts skip this queue."
        />
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {items.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="w-full text-left md:hidden"
                onClick={() => setSheetId(row.id)}
              >
                <ApprovalReview request={row} canDecide={false} compact />
              </button>
              <div className="hidden md:block">
                <ApprovalReview request={row} canDecide={canDecide} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <MobileReview
        request={focused}
        canDecide={canDecide}
        open={Boolean(sheetId)}
        onClose={() => setSheetId(null)}
      />
    </div>
  );
}

function MobileReview({
  request,
  canDecide,
  open,
  onClose,
}: {
  request: ApprovalRequest | null;
  canDecide: boolean;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open && Boolean(request)} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="bottom">
        <SheetTitle>Review publish</SheetTitle>
        <SheetDescription>Approve to go live, or reject with a note.</SheetDescription>
        {request ? (
          <div className="mt-4">
            <ApprovalReview request={request} canDecide={canDecide} />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
