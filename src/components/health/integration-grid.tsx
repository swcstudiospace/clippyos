import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { INTEGRATIONS_QUERY_KEY, INTEGRATION_IDS, type IntegrationId } from "@/lib/integrations";
import { testIntegration } from "@/lib/server/integrations";
import { HEALTH_QUERY_KEY, type HealthIntegrationCard, type HealthIntegrationTone } from "@/lib/health";
import { userFacingErrorMessage } from "@/lib/errors";
import { formatRelativeTime } from "@/lib/format";

function toneBadge(tone: HealthIntegrationTone): { label: string; tone: "green" | "orange" | "red" | "neutral" } {
  switch (tone) {
    case "connected":
      return { label: "Connected", tone: "green" };
    case "degraded":
      return { label: "Degraded", tone: "orange" };
    case "error":
      return { label: "Error", tone: "red" };
    default:
      return { label: "Not configured", tone: "neutral" };
  }
}

export function IntegrationGrid({
  cards,
  canTest,
}: {
  cards: HealthIntegrationCard[];
  canTest: boolean;
}) {
  const queryClient = useQueryClient();
  const test = useMutation({
    mutationFn: (id: IntegrationId) => testIntegration({ data: id }),
    onSuccess: () => {
      toast.success("Connection tested");
      void queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const badge = toneBadge(card.tone);
        const testId =
          card.testId && (INTEGRATION_IDS as readonly string[]).includes(card.testId)
            ? (card.testId as IntegrationId)
            : null;
        return (
          <GlassCard key={card.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-card font-semibold tracking-tight">{card.name}</h3>
                {card.detail ? <p className="mt-1 text-caption text-muted">{card.detail}</p> : null}
              </div>
              <Badge tone={badge.tone}>{badge.label}</Badge>
            </div>
            <p className="text-caption text-muted">
              {card.lastSuccessAt
                ? `Last ok ${formatRelativeTime(card.lastSuccessAt)}`
                : card.lastError
                  ? card.lastError
                  : "No test yet"}
            </p>
            {canTest && testId ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-h-11 w-full sm:w-auto"
                disabled={test.isPending}
                onClick={() => test.mutate(testId)}
              >
                Test
              </Button>
            ) : null}
          </GlassCard>
        );
      })}
    </div>
  );
}
