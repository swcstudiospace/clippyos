import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { LEAD_STATUSES, type Lead } from "@/lib/entities";
import { LEAD_STATUS_LABELS } from "@/lib/labels";
import { formatUsd } from "@/lib/format";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export function LeadPipeline({
  leads,
  loading,
  onEdit,
  onDelete,
}: {
  leads: Lead[];
  loading: boolean;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}) {
  if (loading) {
    return (
      <div className="grid gap-3 lg:grid-cols-5">
        {LEAD_STATUSES.map((status) => (
          <GlassCard key={status}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-20 w-full" />
            <Skeleton className="mt-2 h-20 w-full" />
          </GlassCard>
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <EmptyState
        title="No leads in this view"
        description="Add a prospect to start the pipeline. Totals update from upfront cash and monthly recurring."
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {LEAD_STATUSES.map((status) => {
        const column = leads.filter((lead) => lead.status === status);
        return (
          <section key={status} className="min-w-0">
            <GlassCard className="h-full">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-caption font-semibold tracking-tight">
                  {LEAD_STATUS_LABELS[status]}
                </h2>
                <Badge tone={statusTone(status)}>{column.length}</Badge>
              </div>
              {column.length === 0 ? (
                <p className="mt-4 text-caption text-muted">Empty</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {column.map((lead) => (
                    <li key={lead.id}>
                      <LeadCard lead={lead} onEdit={onEdit} onDelete={onDelete} />
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </section>
        );
      })}
    </div>
  );
}

function LeadCard({
  lead,
  onEdit,
  onDelete,
}: {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}) {
  const excerpt = lead.notes?.trim()
    ? lead.notes.trim().length > 90
      ? `${lead.notes.trim().slice(0, 90)}…`
      : lead.notes.trim()
    : null;
  return (
    <article className="rounded-control bg-secondary-surface/55 p-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 font-medium tracking-tight">{lead.name}</h3>
        <Badge tone={statusTone(lead.status)}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
      </div>
      <p className="mt-2 text-caption tabular-nums text-muted">
        {formatUsd(lead.upfrontCash)} up front · {formatUsd(lead.monthlyRecurring)} / mo
      </p>
      {lead.channelUrl ? (
        <a
          href={lead.channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex min-h-11 items-center gap-1 text-caption text-accent"
        >
          Channel
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      ) : null}
      {excerpt ? <p className="mt-2 text-caption text-muted">{excerpt}</p> : null}
      <div className="mt-2 flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(lead)}
          aria-label={`Edit ${lead.name}`}
        >
          <Pencil className="size-3.5" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(lead)}
          aria-label={`Remove ${lead.name}`}
        >
          <Trash2 className="size-3.5" />
          Remove
        </Button>
      </div>
    </article>
  );
}
