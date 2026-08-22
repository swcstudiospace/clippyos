import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CLIENT_ONBOARDING_COPY,
  CLIENT_ONBOARDING_STEPS,
  parseClientChecklist,
  type ClientOnboardingChecklist,
} from "@/lib/billing";
import { setClientOnboardingStep } from "@/lib/server/clients";
import { GlassCard } from "@/components/ui/glass-card";
import { toast } from "sonner";
import { userFacingErrorMessage } from "@/lib/errors";

export function ClientOnboardingChecklistCard({
  clientId,
  checklist,
}: {
  clientId: string;
  checklist: ClientOnboardingChecklist | null | undefined;
}) {
  const queryClient = useQueryClient();
  const parsed = parseClientChecklist(checklist);
  const doneCount = CLIENT_ONBOARDING_STEPS.filter((step) => parsed.steps[step].done).length;
  const toggle = useMutation({
    mutationFn: (input: { step: (typeof CLIENT_ONBOARDING_STEPS)[number]; done: boolean }) =>
      setClientOnboardingStep({ data: { clientId, step: input.step, done: input.done } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      await queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  return (
    <GlassCard>
      <h2 className="text-card font-semibold tracking-tight">Client onboarding</h2>
      <p className="mt-1 text-caption text-muted">
        {doneCount} of {CLIENT_ONBOARDING_STEPS.length} complete. Per-client, not the written guide.
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {CLIENT_ONBOARDING_STEPS.map((step) => {
          const copy = CLIENT_ONBOARDING_COPY[step];
          const rec = parsed.steps[step];
          return (
            <li key={step} className="flex items-start gap-3 rounded-control bg-secondary-surface/40 px-3 py-2">
              <input
                type="checkbox"
                className="mt-1 size-4"
                checked={rec.done}
                disabled={toggle.isPending}
                onChange={(event) => toggle.mutate({ step, done: event.target.checked })}
                aria-label={copy.title}
              />
              <div>
                <p className="text-body font-medium">{copy.title}</p>
                <p className="text-caption text-muted">{copy.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
