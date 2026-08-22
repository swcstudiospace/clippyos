import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Plus, Sparkles, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import {
  SKILLS_QUERY_KEY,
  SKILL_RUNS_QUERY_KEY,
  type SkillProvenance,
  type SkillRecord,
  type SkillStatus,
} from "@/lib/skills";
import { INTEGRATIONS_QUERY_KEY } from "@/lib/integrations";
import {
  approveSkillFn,
  createSkillFn,
  getSkillFn,
  invokeSkillFn,
  listSkillRunsFn,
  listSkillsFn,
  setSkillEnabledFn,
} from "@/lib/server/skill-fns";
import { getIntegrationsStatus } from "@/lib/server/integrations";
import { userFacingErrorMessage } from "@/lib/errors";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "builtin", "human", "agent", "pending"] as const;
type Filter = (typeof FILTERS)[number];

function provenanceTone(value: SkillProvenance) {
  if (value === "builtin") return "teal" as const;
  if (value === "agent") return "purple" as const;
  return "blue" as const;
}

function statusTone(value: SkillStatus) {
  if (value === "active") return "green" as const;
  if (value === "pending_review") return "orange" as const;
  if (value === "archived") return "neutral" as const;
  return "red" as const;
}

export function SkillsPanel() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState(`---
name: New skill
description: Describe the procedure.
version: 0.1.0
tags: [custom]
category: custom
provenance: human
permissions: [clients:read]
runtime: { timeoutSec: 30, network: false }
---

# New skill

1. Call existing tools only
2. Never request secrets
`);
  const roleQuery = useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: () => getIntegrationsStatus(),
  });
  const query = useQuery({
    queryKey: SKILLS_QUERY_KEY,
    queryFn: () => listSkillsFn(),
  });
  const isAdmin = roleQuery.data?.role === "admin";

  const items = useMemo(() => {
    const all = query.data ?? [];
    if (filter === "all") return all;
    if (filter === "pending") return all.filter((row) => row.status === "pending_review");
    return all.filter((row) => row.provenance === filter);
  }, [query.data, filter]);

  const create = useMutation({
    mutationFn: () => createSkillFn({ data: { skillMd: draft, provenance: "human" } }),
    onSuccess: async () => {
      toast.success("Skill created");
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-section font-semibold tracking-tight">Skills</h2>
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Couldn’t load skills"
        description="Retry in a moment."
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-section font-semibold tracking-tight">Skills</h2>
          <p className="mt-1 text-body text-muted">
            SKILL.md packages with optional Python. Python runs in an isolated Daytona sandbox —
            never on the Social Machine. Agent-authored skills stay pending_review until you
            approve them.
          </p>
        </div>
        {isAdmin ? (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            New skill
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((row) => (
          <Button
            key={row}
            size="sm"
            variant={filter === row ? "primary" : "secondary"}
            onClick={() => setFilter(row)}
          >
            {row}
          </Button>
        ))}
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((skill) => (
          <li key={skill.id}>
            <GlassCard>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => setOpenId(skill.id)}
                >
                  <h3 className="text-card font-semibold tracking-tight">{skill.name}</h3>
                  <p className="mt-1 text-caption text-muted">{skill.description}</p>
                  <p className="mt-2 font-mono text-caption text-muted">
                    {skill.slug} · v{skill.version}
                  </p>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={provenanceTone(skill.provenance)}>{skill.provenance}</Badge>
                  <Badge tone={statusTone(skill.status)}>{skill.status.replace("_", " ")}</Badge>
                  {isAdmin ? (
                    <Switch
                      checked={skill.enabled && skill.status === "active"}
                      disabled={skill.status === "pending_review"}
                      aria-label={`Enable ${skill.name}`}
                      onCheckedChange={(next) => {
                        void setSkillEnabledFn({ data: { id: skill.id, enabled: next } })
                          .then(async () => {
                            await queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEY });
                          })
                          .catch((error) => toast.error(userFacingErrorMessage(error)));
                      }}
                    />
                  ) : null}
                </div>
              </div>
            </GlassCard>
          </li>
        ))}
      </ul>
      {items.length === 0 ? (
        <p className="text-body text-muted">No skills in this filter.</p>
      ) : null}

      <SkillSheet id={openId} onClose={() => setOpenId(null)} isAdmin={isAdmin} />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogTitle>New skill</DialogTitle>
          <DialogDescription>
            YAML frontmatter plus markdown. Python is optional. Secrets are stripped on save.
          </DialogDescription>
          <Textarea
            className="mt-4 min-h-64 font-mono text-caption"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button disabled={create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? "Saving…" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SkillSheet({
  id,
  onClose,
  isAdmin,
}: {
  id: string | null;
  onClose: () => void;
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const [args, setArgs] = useState("{}");
  const skillQuery = useQuery({
    queryKey: [...SKILLS_QUERY_KEY, id],
    queryFn: () => getSkillFn({ data: id! }),
    enabled: Boolean(id),
  });
  const runsQuery = useQuery({
    queryKey: [...SKILL_RUNS_QUERY_KEY, id],
    queryFn: () => listSkillRunsFn({ data: id! }),
    enabled: Boolean(id),
  });

  const invoke = useMutation({
    mutationFn: () => {
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(args || "{}") as Record<string, unknown>;
      } catch {
        throw new Error("VALIDATION");
      }
      return invokeSkillFn({ data: { id: id!, args: parsed } });
    },
    onSuccess: async (result) => {
      toast.success(result.run.status === "completed" ? "Skill finished" : "Skill ran");
      await queryClient.invalidateQueries({ queryKey: SKILL_RUNS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const approve = useMutation({
    mutationFn: () => approveSkillFn({ data: id! }),
    onSuccess: async () => {
      toast.success("Skill approved");
      await queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const skill = skillQuery.data as SkillRecord | undefined;

  return (
    <Sheet open={Boolean(id)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="bottom">
        {skillQuery.isPending || !skill ? (
          <Skeleton className="h-40 w-full rounded-card" />
        ) : (
          <>
            <SheetTitle>{skill.name}</SheetTitle>
            <SheetDescription>
              {skill.provenance} · v{skill.version} · {skill.status.replace("_", " ")}
            </SheetDescription>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone={provenanceTone(skill.provenance)}>{skill.provenance}</Badge>
              {skill.tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-caption text-muted">
              Scripts: {Object.keys(skill.scripts).join(", ") || "none (markdown only)"}
            </p>
            {skill.status === "pending_review" && isAdmin ? (
              <Button className="mt-4" onClick={() => approve.mutate()} disabled={approve.isPending}>
                <WandSparkles className="size-4" aria-hidden="true" />
                {approve.isPending ? "Approving…" : "Approve agent skill"}
              </Button>
            ) : null}
            <pre className="mt-4 max-h-56 overflow-auto rounded-control bg-secondary-surface p-3 font-mono text-caption whitespace-pre-wrap">
              {skill.skillMd}
            </pre>
            <div className="mt-4 flex flex-col gap-2">
              <Label htmlFor="skill-args">Invoke args (JSON)</Label>
              <Textarea
                id="skill-args"
                className="min-h-24 font-mono text-caption"
                value={args}
                onChange={(event) => setArgs(event.target.value)}
              />
              <Button
                onClick={() => invoke.mutate()}
                disabled={invoke.isPending || skill.status !== "active"}
              >
                <Play className="size-4" aria-hidden="true" />
                {invoke.isPending ? "Running…" : "Invoke test"}
              </Button>
            </div>
            {invoke.data ? (
              <pre
                className={cn(
                  "mt-3 max-h-40 overflow-auto rounded-control bg-secondary-surface p-3 font-mono text-caption",
                )}
              >
                {(invoke.data.run.stdout || invoke.data.run.stderr || invoke.data.run.errorCode || "").slice(0, 4000)}
              </pre>
            ) : null}
            <h4 className="mt-6 text-card font-semibold">Recent runs</h4>
            <ul className="mt-2 flex flex-col gap-2">
              {(runsQuery.data ?? []).slice(0, 8).map((run) => (
                <li
                  key={run.id}
                  className="rounded-control bg-secondary-surface/50 px-3 py-2 font-mono text-caption"
                >
                  {run.status} · exit {run.exitCode ?? "—"} · {run.durationMs ?? 0}ms
                </li>
              ))}
              {(runsQuery.data ?? []).length === 0 ? (
                <li className="text-caption text-muted">No runs yet.</li>
              ) : null}
            </ul>
            <p className="mt-4 flex items-center gap-2 text-caption text-muted">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Self-improve proposes agent skills after ≥ 5 successful tools on a run. They stay
              pending until you approve.
            </p>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
