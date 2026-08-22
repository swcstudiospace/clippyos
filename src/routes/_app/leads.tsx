import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/entities";
import { LEAD_STATUS_LABELS } from "@/lib/labels";
import { deriveLeadTotals, LEADS_QUERY_KEY } from "@/lib/leads";
import { formatUsd } from "@/lib/format";
import { listLeads, saveLead, softDeleteLead } from "@/lib/server/leads";
import { LeadModal, type LeadFormValues } from "@/components/leads/lead-modal";
import { LeadPipeline } from "@/components/leads/pipeline";
import { MetricCard } from "@/components/money/metric-card";
import { FilterChip } from "@/components/money/filter-chip";
import { SectionBoundary } from "@/components/clients/section-boundary";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { captureClientError, userFacingErrorMessage } from "@/lib/errors";
import { CoolMode } from "@/components/magicui/cool-mode";

export const Route = createFileRoute("/_app/leads")({
  component: LeadsPage,
});

type StatusFilter = LeadStatus | "ALL";
const EMPTY_LEADS: Lead[] = [];

function LeadsPage() {
  const queryClient = useQueryClient();
  const listQuery = useQuery({
    queryKey: LEADS_QUERY_KEY,
    queryFn: () => listLeads(),
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Lead | null>(null);

  const leads = listQuery.data ?? EMPTY_LEADS;
  const totals = useMemo(() => deriveLeadTotals(leads), [leads]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (status !== "ALL" && lead.status !== status) return false;
      if (!q) return true;
      const hay = `${lead.name} ${lead.channelUrl ?? ""} ${lead.notes ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [leads, search, status]);

  const saveMut = useMutation({
    mutationFn: (values: LeadFormValues) =>
      saveLead({
        data: {
          id: values.id,
          name: values.name,
          channelUrl: values.channelUrl || null,
          notes: values.notes || null,
          status: values.status,
          upfrontCash: values.upfrontCash,
          monthlyRecurring: values.monthlyRecurring,
        },
      }),
    onSuccess: async () => {
      toast.success(editing ? "Lead updated" : "Lead added");
      setModalOpen(false);
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
    },
    onError: (error) => {
      captureClientError(error, { source: "save-lead" });
      toast.error(userFacingErrorMessage(error));
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => softDeleteLead({ data: id }),
    onSuccess: async () => {
      toast.success("Lead removed from the pipeline");
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: LEADS_QUERY_KEY });
    },
    onError: (error) => {
      captureClientError(error, { source: "delete-lead" });
      toast.error(userFacingErrorMessage(error));
    },
  });

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Leads"
        description="Prospect pipeline with live upfront and monthly totals. Removing a lead soft-deletes it and marks it lost."
        actions={
          <CoolMode>
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add lead
            </Button>
          </CoolMode>
        }
      />

      {listQuery.isError ? (
        <div className="mt-6">
          <ErrorState
            title="Couldn’t load leads"
            description="The pipeline couldn’t be read. Try again."
            onRetry={() => void listQuery.refetch()}
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <SectionBoundary title="Pipeline totals">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Open upfront"
                value={formatUsd(totals.openUpfront)}
                amount={totals.openUpfront}
                hint={`${totals.openCount} open lead${totals.openCount === 1 ? "" : "s"}`}
                loading={listQuery.isPending}
              />
              <MetricCard
                label="Open monthly"
                value={formatUsd(totals.openMrr)}
                amount={totals.openMrr}
                hint="To contact · contacted · in talks"
                loading={listQuery.isPending}
              />
              <MetricCard
                label="Closed upfront"
                value={formatUsd(totals.closedUpfront)}
                amount={totals.closedUpfront}
                hint="Won cash"
                tone="success"
                loading={listQuery.isPending}
              />
              <MetricCard
                label="Closed monthly"
                value={formatUsd(totals.closedMrr)}
                amount={totals.closedMrr}
                hint="Won recurring"
                tone="success"
                loading={listQuery.isPending}
              />
            </div>
          </SectionBoundary>

          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <Input
                className="pl-10"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search leads…"
                aria-label="Search leads"
              />
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
              <FilterChip
                label="All"
                active={status === "ALL"}
                onClick={() => setStatus("ALL")}
              />
              {LEAD_STATUSES.map((value) => (
                <FilterChip
                  key={value}
                  label={LEAD_STATUS_LABELS[value]}
                  active={status === value}
                  onClick={() => setStatus(value)}
                />
              ))}
            </div>
          </div>

          <SectionBoundary title="Pipeline">
            <LeadPipeline
              leads={filtered}
              loading={listQuery.isPending}
              onEdit={(lead) => {
                setEditing(lead);
                setModalOpen(true);
              }}
              onDelete={setPendingDelete}
            />
          </SectionBoundary>
        </div>
      )}

      <LeadModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditing(null);
        }}
        lead={editing}
        busy={saveMut.isPending}
        onSave={(values) => saveMut.mutate(values)}
      />

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogTitle>Remove this lead?</DialogTitle>
          <DialogDescription>
            {pendingDelete
              ? `${pendingDelete.name} will be marked lost and kept for audit. Totals drop immediately.`
              : null}
          </DialogDescription>
          <div className="mt-5 flex gap-2">
            <Button
              variant="destructive"
              disabled={!pendingDelete || deleteMut.isPending}
              onClick={() => pendingDelete && deleteMut.mutate(pendingDelete.id)}
            >
              {deleteMut.isPending ? "Removing…" : "Remove lead"}
            </Button>
            <Button variant="ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
