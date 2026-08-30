import {
  agentStatusLabel,
  agentStatusTone,
  isAgentBusy,
  presetCopy,
  type AgentRunDetail,
} from "@/lib/agent";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { TypingAnimation } from "@/components/magicui/typing-animation";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { LinearIssueActions } from "@/components/linear/issue-actions";
import { AgentResults } from "@/components/agent/results";

export function AgentTimeline({
  detail,
  rateLimitMessage,
}: {
  detail: AgentRunDetail;
  rateLimitMessage?: string | null;
}) {
  const reduced = usePrefersReducedMotion();
  const running = isAgentBusy(detail.run.status);
  const plan = detail.run.plan ?? [];
  return (
    <div className="flex flex-col gap-3">
      <GlassCard>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-caption text-muted">{presetCopy(detail.run.preset).label}</p>
            <h2 className="text-card font-semibold tracking-tight">{detail.run.goal}</h2>
            <p className="mt-1 text-caption text-muted">
              {detail.clientName ?? "No client"}
              {detail.skillName ? ` · ${detail.skillName}` : ""}
              {detail.run.provider ? ` · ${detail.run.provider}` : ""} · {detail.run.model}
            </p>
          </div>
          <Badge tone={agentStatusTone(detail.run.status)}>{agentStatusLabel(detail.run.status)}</Badge>
        </div>
        {detail.run.status === "failed" || detail.run.status === "waiting_human" ? (
          <div className="mt-3">
            <LinearIssueActions
              entityType="AgentRun"
              entityId={detail.run.id}
              title={`[Agent] ${detail.run.status} — ${detail.run.goal.slice(0, 80)}`}
              description={detail.run.goal}
              labels={["autonomy", detail.run.status === "failed" ? "bug" : "autonomy"]}
              compact
            />
          </div>
        ) : null}
        {rateLimitMessage ? (
          <p className="mt-3 rounded-control bg-warning/10 px-3 py-2 text-caption text-warning" role="status">
            {rateLimitMessage}
          </p>
        ) : null}
        {detail.run.status === "failed" && detail.run.summary ? (
          <p className="mt-3 rounded-control bg-danger/10 px-3 py-2 text-caption text-danger" role="status">
            {detail.run.summary}
          </p>
        ) : null}
        {detail.run.status === "waiting_human" ? (
          <p className="mt-3 text-caption text-warning">
            Waiting on a human — login wall, CAPTCHA, or skill approval. Open Social if this is a session.
          </p>
        ) : null}
        {detail.run.status === "waiting_resource" ? (
          <p className="mt-3 text-caption text-warning">
            Waiting on a resource — Social Machine stopped, or Grok Bot hasn’t claimed this run yet.
          </p>
        ) : null}
        {plan.length > 0 ? (
          <ol className="mt-3 grid gap-1 text-caption">
            {plan.map((step, index) => {
              const done = detail.iterations.some(
                (item) => item.stepId === step.id && item.kind === "tool" && item.status === "ok",
              );
              return (
                <li key={step.id} className="flex gap-2">
                  <span className={cn("tabular-nums text-muted", done && "text-success")}>
                    {done ? "✓" : `${index + 1}.`}
                  </span>
                  <span>
                    <span className="font-medium">{step.tool}</span>
                    {step.purpose ? ` — ${step.purpose}` : ""}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : null}
      </GlassCard>

      <ol className="flex flex-col gap-2" aria-live="polite">
        {detail.iterations.map((item) => (
          <li key={item.id}>
            <GlassCard className="p-4" beam={false}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-caption font-medium">
                  {item.kind === "tool" && item.toolName
                    ? item.toolName
                    : item.kind === "backoff"
                      ? "Backoff"
                      : item.kind === "plan"
                        ? "Plan"
                        : item.kind === "observe"
                          ? "Observe"
                          : item.kind === "decide"
                            ? "Decide"
                            : item.kind === "complete"
                              ? "Complete"
                              : item.kind === "error"
                                ? "Error"
                                : "Agent"}
                </p>
                <Badge
                  tone={
                    item.status === "error" ? "red" : item.status === "running" ? "blue" : "neutral"
                  }
                >
                  {item.status}
                  {item.durationMs != null ? ` · ${item.durationMs}ms` : ""}
                </Badge>
              </div>
              {item.argsSummary ? (
                <p className="mt-1 truncate font-mono text-[11px] text-muted">{item.argsSummary}</p>
              ) : null}
              {item.resultSummary ? (
                <p className="mt-2 whitespace-pre-wrap text-caption">{item.resultSummary}</p>
              ) : null}
              {item.screenshotDataUrl ? (
                <img
                  src={item.screenshotDataUrl}
                  alt="Desktop screenshot"
                  className="mt-3 max-h-56 w-full rounded-control object-contain bg-black/40"
                />
              ) : item.screenshotRef ? (
                <p className="mt-2 text-caption text-muted">Screenshot: {item.screenshotRef}</p>
              ) : null}
            </GlassCard>
          </li>
        ))}
        {running ? (
          <li>
            <GlassCard className="p-4" beam>
              {reduced ? (
                <p className="text-caption text-muted">Working…</p>
              ) : (
                <TypingAnimation className="text-caption text-muted" duration={40}>
                  {detail.run.status === "planning" ? "Planning steps…" : "Stepping through the plan…"}
                </TypingAnimation>
              )}
            </GlassCard>
          </li>
        ) : null}
      </ol>

      {!running ? <AgentResults detail={detail} /> : null}
    </div>
  );
}
