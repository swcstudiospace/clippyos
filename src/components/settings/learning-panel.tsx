import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { userFacingErrorMessage } from "@/lib/errors";
import { LEARNING_POLICY_KEY } from "@/lib/performance";
import { getLearningPolicyFn, saveLearningPolicyFn } from "@/lib/server/performance-fns";

export function LearningPanel() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: LEARNING_POLICY_KEY,
    queryFn: () => getLearningPolicyFn(),
  });
  const save = useMutation({
    mutationFn: saveLearningPolicyFn,
    onSuccess: async () => {
      toast.success("Learning policy saved");
      await queryClient.invalidateQueries({ queryKey: LEARNING_POLICY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  if (query.isPending) return <Skeleton className="h-40 w-full" />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Couldn’t load learning policy"
        description="Retry in a moment."
        onRetry={() => void query.refetch()}
      />
    );
  }
  const { policy, metricsApi } = query.data;

  return (
    <GlassCard>
      <h2 className="text-card font-semibold tracking-tight">Learning from winners</h2>
      <p className="mt-1 text-caption text-muted">
        After a post scores as a winner, the OS drafts a KnowledgeProposal. Auto-merge stays off so
        Ideation and titles only change after you approve.
      </p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        <Badge tone={metricsApi.youtube ? "green" : "neutral"}>
          YouTube {metricsApi.youtube ? "metrics API" : "manual only"}
        </Badge>
        <Badge tone={metricsApi.x ? "green" : "neutral"}>
          X {metricsApi.x ? "metrics API" : "manual only"}
        </Badge>
        <Badge tone={metricsApi.tiktok ? "green" : "neutral"}>
          TikTok {metricsApi.tiktok ? "metrics API" : "manual only"}
        </Badge>
        <Badge tone={metricsApi.instagram ? "green" : "neutral"}>
          IG {metricsApi.instagram ? "metrics API" : "manual only"}
        </Badge>
      </div>
      <div className="mt-5 flex flex-col gap-4">
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-body">learning.enabled</span>
            <span className="text-caption text-muted">Draft proposals from winning posts.</span>
          </span>
          <Switch
            checked={policy.enabled}
            onCheckedChange={(enabled) => save.mutate({ data: { ...policy, enabled } })}
          />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span>
            <span className="block text-body">learning.autoMerge</span>
            <span className="text-caption text-muted">Off by default. Do not auto-write KnowledgeEntry.</span>
          </span>
          <Switch
            checked={policy.autoMerge}
            onCheckedChange={(autoMerge) => save.mutate({ data: { ...policy, autoMerge } })}
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField
            id="min-score"
            label="Min score"
            value={policy.minScore}
            onCommit={(minScore) => save.mutate({ data: { ...policy, minScore } })}
          />
          <NumberField
            id="winner-pct"
            label="Winner percentile"
            value={policy.winnerPercentile}
            onCommit={(winnerPercentile) => save.mutate({ data: { ...policy, winnerPercentile } })}
          />
          <NumberField
            id="min-views"
            label="Min views"
            value={policy.minViews}
            onCommit={(minViews) => save.mutate({ data: { ...policy, minViews } })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fetch-delays">Fetch delays (hours)</Label>
          <Input
            id="fetch-delays"
            defaultValue={policy.fetchDelaysHours.join(", ")}
            onBlur={(event) => {
              const hours = event.target.value
                .split(/[,\s]+/)
                .map((part) => Number(part))
                .filter((n) => Number.isFinite(n) && n >= 0 && n <= 720)
                .slice(0, 6);
              if (!hours.length) return;
              const same =
                hours.length === policy.fetchDelaysHours.length &&
                hours.every((n, i) => n === policy.fetchDelaysHours[i]);
              if (!same) save.mutate({ data: { ...policy, fetchDelaysHours: hours } });
            }}
          />
          <p className="text-caption text-muted">
            After a successful publish, stats are pulled at these offsets. Default 1, 24, 168 (7 days).
          </p>
        </div>
        {save.isPending ? <p className="text-caption text-muted">Saving…</p> : null}
      </div>
    </GlassCard>
  );
}

function NumberField({
  id,
  label,
  value,
  onCommit,
}: {
  id: string;
  label: string;
  value: number;
  onCommit: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        defaultValue={value}
        onBlur={(event) => {
          const n = Number(event.target.value);
          if (Number.isFinite(n) && n !== value) onCommit(Math.round(n));
        }}
      />
    </div>
  );
}
