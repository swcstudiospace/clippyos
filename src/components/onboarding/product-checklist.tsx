import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PRODUCT_ONBOARDING_COPY,
  PRODUCT_ONBOARDING_QUERY_KEY,
  PRODUCT_ONBOARDING_STEPS,
} from "@/lib/billing";
import {
  dismissProductOnboarding,
  getProductOnboarding,
  setProductOnboardingStep,
} from "@/lib/server/billing-fns";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

export function ProductOnboardingCard({ entitled }: { entitled: boolean }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: PRODUCT_ONBOARDING_QUERY_KEY,
    queryFn: () => getProductOnboarding(),
    enabled: entitled,
  });
  const toggle = useMutation({
    mutationFn: (input: { step: (typeof PRODUCT_ONBOARDING_STEPS)[number]; done: boolean }) =>
      setProductOnboardingStep({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PRODUCT_ONBOARDING_QUERY_KEY });
    },
  });
  const dismiss = useMutation({
    mutationFn: () => dismissProductOnboarding(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PRODUCT_ONBOARDING_QUERY_KEY });
    },
  });

  const state = query.data;
  if (!entitled || !state || state.dismissed) return null;
  const remaining = PRODUCT_ONBOARDING_STEPS.filter((step) => !state.steps[step].done).length;
  if (remaining === 0) return null;

  return (
    <GlassCard className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-card font-semibold tracking-tight">Welcome to ClippyOS</h2>
          <p className="mt-1 text-caption text-muted">
            {remaining} step{remaining === 1 ? "" : "s"} left after purchase.
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => dismiss.mutate()} disabled={dismiss.isPending}>
          Dismiss
        </Button>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {PRODUCT_ONBOARDING_STEPS.map((step) => {
          const copy = PRODUCT_ONBOARDING_COPY[step];
          const done = state.steps[step].done;
          return (
            <li key={step} className="flex items-start gap-3 rounded-control bg-secondary-surface/40 px-3 py-2">
              <input
                type="checkbox"
                className="mt-1 size-4"
                checked={done}
                onChange={(event) => toggle.mutate({ step, done: event.target.checked })}
                aria-label={copy.title}
              />
              <div className="min-w-0">
                <p className="text-body font-medium">{copy.title}</p>
                <p className="text-caption text-muted">{copy.body}</p>
                <a href={copy.href} className="text-caption text-accent underline-offset-4 hover:underline">
                  Open
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
