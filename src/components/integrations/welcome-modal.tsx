import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { INTEGRATION_IDS, INTEGRATIONS_QUERY_KEY, INTEGRATION_COPY } from "@/lib/integrations";
import { completeFirstLaunch, getIntegrationsStatus } from "@/lib/server/integrations";
import { useIntegrationsUi } from "@/components/integrations/provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClippyMark } from "@/components/brand/clippy-mark";

export function WelcomeModal() {
  const queryClient = useQueryClient();
  const { openGuide } = useIntegrationsUi();
  const statusQuery = useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: () => getIntegrationsStatus(),
  });
  const skip = useMutation({
    mutationFn: () => completeFirstLaunch(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
    },
  });

  const data = statusQuery.data;
  const aiMissing = data && data.items.ai.health === "not_configured";
  const open = Boolean(data && !data.firstLaunchCompleted && aiMissing);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) skip.mutate();
      }}
    >
      <DialogContent className="flex max-h-[min(90dvh,40rem)] w-[min(100%-2rem,32rem)] flex-col overflow-y-auto">
        <div className="flex items-center gap-3 pr-8">
          <ClippyMark size={40} />
          <DialogTitle>Welcome to ClippyOS</DialogTitle>
        </div>
        <DialogDescription>
          Connect integrations in this order. AI is required for ideation,
          thumbnails, analysis, and the Discord agent.
        </DialogDescription>
        <ul className="mt-4 flex flex-col gap-2">
          {INTEGRATION_IDS.map((id) => {
            const copy = INTEGRATION_COPY[id];
            return (
              <li
                key={id}
                className="flex items-center justify-between gap-2 rounded-control bg-secondary-surface/50 px-3 py-2"
              >
                <p className="text-body font-medium">{copy.name}</p>
                <Badge tone={copy.required ? "orange" : "neutral"}>
                  {copy.required ? "Required" : "Optional"}
                </Badge>
              </li>
            );
          })}
        </ul>
        <div className="sticky bottom-0 mt-5 flex flex-wrap gap-2 bg-elevated/80 pt-2 backdrop-blur-sm">
          <Button
            onClick={() => {
              skip.mutate();
              openGuide("ai");
            }}
          >
            Get Started
          </Button>
          <Button variant="ghost" onClick={() => skip.mutate()} disabled={skip.isPending}>
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
