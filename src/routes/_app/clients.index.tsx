import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { listClients, softDeleteClient, getAiStatus, type ClientListItem } from "@/lib/server/clients";
import { PLAN_TYPES, CLIENT_STATUSES, PROGRESS_STAGES, type PlanType, type ClientStatus, type ProgressStage } from "@/lib/entities";
import { PLAN_LABELS, PLAN_TONES, STATUS_LABELS, STAGE_LABELS } from "@/lib/labels";
import { formatUsd, initials } from "@/lib/format";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, statusTone } from "@/components/ui/badge";
import { StagePill, SourceBadge } from "@/components/ui/stage-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientFormModal } from "@/components/clients/client-form-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { captureClientError, userFacingErrorMessage } from "@/lib/errors";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/clients/")({
  component: ClientsPage,
});

function ClientsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listQuery = useQuery({
    queryKey: ["clients"],
    queryFn: () => listClients(),
  });
  const aiQuery = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => getAiStatus(),
  });
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState<ClientStatus | "ALL">("ACTIVE");
  const [plan, setPlan] = useState<PlanType | "ALL">("ALL");
  const [stage, setStage] = useState<ProgressStage | "ALL" | "NONE">("ALL");
  const [editMode, setEditMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClientListItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ClientListItem | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(search.trim().toLowerCase()), 250);
    return () => window.clearTimeout(handle);
  }, [search]);

  const rows = useMemo(() => {
    const all = listQuery.data ?? [];
    return all.filter((client) => {
      if (status === "ACTIVE" && (client.status !== "ACTIVE" || client.deletedAt)) {
        return false;
      }
      if (status === "CHURNED" && client.status !== "CHURNED") return false;
      if (plan !== "ALL" && client.planType !== plan) return false;
      if (stage === "NONE" && client.currentStage) return false;
      if (stage !== "ALL" && stage !== "NONE" && client.currentStage !== stage) {
        return false;
      }
      if (!debounced) return true;
      const hay = `${client.name} ${client.channelUrl ?? ""}`.toLowerCase();
      return hay.includes(debounced);
    });
  }, [listQuery.data, status, plan, stage, debounced]);

  const remove = useMutation({
    mutationFn: (id: string) => softDeleteClient({ data: id }),
    onSuccess: async () => {
      toast.success("Client marked churned and kept for audit");
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error) => {
      captureClientError(error, { source: "delete-client" });
      toast.error(userFacingErrorMessage(error));
    },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Clients"
        description="Content teams for personal-brand channels."
        actions={
          <>
          <Button
            variant={editMode ? "secondary" : "ghost"}
            onClick={() => setEditMode((value) => !value)}
            aria-pressed={editMode}
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add Client
          </Button>
          </>
        }
      />

      <div className="mt-6 flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <Input
            className="pl-10"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or channel…"
            aria-label="Search clients"
          />
        </div>
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          <FilterChip
            label="Active"
            active={status === "ACTIVE"}
            onClick={() => setStatus("ACTIVE")}
          />
          <FilterChip
            label="Churned"
            active={status === "CHURNED"}
            onClick={() => setStatus("CHURNED")}
          />
          <FilterChip
            label="All statuses"
            active={status === "ALL"}
            onClick={() => setStatus("ALL")}
          />
          <span className="mx-1 hidden h-8 w-px bg-border sm:block" aria-hidden="true" />
          {(["ALL", ...PLAN_TYPES] as const).map((value) => (
            <FilterChip
              key={value}
              label={value === "ALL" ? "All plans" : PLAN_LABELS[value]}
              active={plan === value}
              onClick={() => setPlan(value)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          <FilterChip
            label="Any stage"
            active={stage === "ALL"}
            onClick={() => setStage("ALL")}
          />
          <FilterChip
            label="Not started"
            active={stage === "NONE"}
            onClick={() => setStage("NONE")}
          />
          {PROGRESS_STAGES.map((value) => (
            <FilterChip
              key={value}
              label={STAGE_LABELS[value]}
              active={stage === value}
              onClick={() => setStage(value)}
            />
          ))}
        </div>
      </div>

      <div className="mt-6">
        {listQuery.isPending ? <ListSkeleton /> : null}
        {listQuery.isError ? (
          <ErrorState
            title="Couldn’t load clients"
            onRetry={() => void listQuery.refetch()}
          />
        ) : null}
        {!listQuery.isPending && !listQuery.isError && rows.length === 0 ? (
          <EmptyState
            title={debounced || status !== "ACTIVE" || plan !== "ALL" ? "No matching clients" : "No clients yet"}
            description={
              debounced || status !== "ACTIVE"
                ? "Try clearing search or filters."
                : "Add the first channel to start production tracking."
            }
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setModalOpen(true);
                }}
              >
                Add Client
              </Button>
            }
          />
        ) : null}
        <ul className="flex flex-col gap-3">
          {rows.map((client) => (
            <li key={client.id}>
              <GlassCard className="p-4">
                <div className="flex items-center gap-3">
                  <Link
                    to="/clients/$clientId"
                    params={{ clientId: client.id }}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <Thumb name={client.name} src={client.channelThumbnail} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body font-semibold">{client.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge tone={PLAN_TONES[client.planType]}>
                          {PLAN_LABELS[client.planType]}
                          {client.planType === "CUSTOM" && client.customPlanLabel
                            ? ` · ${client.customPlanLabel}`
                            : ""}
                        </Badge>
                        <StagePill stage={client.currentStage} />
                        <SourceBadge source={client.currentSource} />
                        {client.status === "CHURNED" ? (
                          <Badge tone={statusTone("CHURNED")}>{STATUS_LABELS.CHURNED}</Badge>
                        ) : null}
                      </div>
                    </div>
                    <p className="shrink-0 text-body font-medium">
                      {formatUsd(client.monthlyFee)}
                      <span className="ml-1 text-caption text-muted">MRR</span>
                    </p>
                  </Link>
                  {editMode ? (
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${client.name}`}
                        onClick={() => {
                          setEditing(client);
                          setModalOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${client.name}`}
                        onClick={() => setPendingDelete(client)}
                      >
                        <Trash2 className="size-4 text-danger" />
                      </Button>
                    </div>
                  ) : null}
                </div>
                <p className="mt-2 text-caption text-muted sm:hidden">
                  {formatUsd(client.monthlyFee)} MRR
                </p>
              </GlassCard>
            </li>
          ))}
        </ul>
      </div>

      <ClientFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        client={editing}
        aiReady={aiQuery.data?.llm ?? false}
        onSaved={(id) => {
          void queryClient.invalidateQueries({ queryKey: ["clients"] });
          void queryClient.invalidateQueries({ queryKey: ["client", id] });
          if (!editing) void navigate({ to: "/clients/$clientId", params: { clientId: id } });
        }}
      />

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(next) => !next && setPendingDelete(null)}>
        <DialogContent>
          <DialogTitle>Mark {pendingDelete?.name} as churned?</DialogTitle>
          <DialogDescription>
            This is a soft delete. The client is set to CHURNED and kept for audit.
            They leave the active list but are not permanently erased.
          </DialogDescription>
          <div className="mt-5 flex gap-2">
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => pendingDelete && remove.mutate(pendingDelete.id)}
            >
              Mark churned
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

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-11 rounded-full px-3 text-caption font-medium transition-[background-color,box-shadow] duration-(--motion-quick)",
        active
          ? "chip-active-glow bg-accent text-accent-fg"
          : "bg-secondary-surface text-fg",
      )}
    >
      {label}
    </button>
  );
}

function Thumb({ name, src }: { name: string; src: string | null }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="size-12 shrink-0 rounded-control object-cover"
      />
    );
  }
  return (
    <span className="grid size-12 shrink-0 place-items-center rounded-control bg-secondary-surface text-caption font-semibold">
      {initials(name)}
    </span>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-card" />
      ))}
    </div>
  );
}
