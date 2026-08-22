import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { userFacingErrorMessage } from "@/lib/errors";
import {
  LINEAR_LINKS_QUERY_KEY,
  LINEAR_QUERY_KEY,
  type LinearEntityType,
} from "@/lib/linear";
import { createLinearIssueFn, getLinearStatusFn, listLinearLinksFn } from "@/lib/server/linear-fns";

export function LinearIssueActions({
  entityType,
  entityId,
  title,
  description,
  labels,
  compact,
}: {
  entityType: LinearEntityType;
  entityId: string;
  title: string;
  description?: string;
  labels?: string[];
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const links = useQuery({
    queryKey: LINEAR_LINKS_QUERY_KEY,
    queryFn: () => listLinearLinksFn(),
    staleTime: 15_000,
  });
  const status = useQuery({
    queryKey: LINEAR_QUERY_KEY,
    queryFn: () => getLinearStatusFn(),
    staleTime: 60_000,
  });
  const link = (links.data ?? []).find(
    (row) => row.agencyEntityType === entityType && row.agencyEntityId === entityId,
  );
  const create = useMutation({
    mutationFn: () =>
      createLinearIssueFn({
        data: {
          title,
          description,
          labels,
          entityType,
          entityId,
          state: "backlog",
        },
      }),
    onSuccess: async (result) => {
      if (result.skipped) {
        toast.message("Linear is off. Enable it in Settings.");
        return;
      }
      toast.success(result.issue.identifier ? `Opened ${result.issue.identifier}` : "Linear issue created");
      await queryClient.invalidateQueries({ queryKey: LINEAR_LINKS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  if (status.data && !status.data.configured) return null;

  if (link?.linearUrl) {
    return (
      <a
        href={link.linearUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-h-11 items-center gap-1 text-caption text-accent underline-offset-2 hover:underline"
      >
        <ExternalLink className="size-3.5" aria-hidden="true" />
        {link.linearIdentifier ? `Open ${link.linearIdentifier}` : "Open in Linear"}
      </a>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={compact ? "ghost" : "secondary"}
      disabled={create.isPending || status.data?.flags.enabled === false}
      onClick={() => create.mutate()}
    >
      {create.isPending ? "Creating…" : compact ? "Track in Linear" : "Create Linear issue"}
    </Button>
  );
}
