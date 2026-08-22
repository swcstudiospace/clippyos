import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { IntegrationId } from "@/lib/integrations";
import { INTEGRATIONS_QUERY_KEY, INTEGRATION_COPY } from "@/lib/integrations";
import { testIntegration } from "@/lib/server/integrations";
import { copyTextToClipboard } from "@/lib/clipboard";
import { userFacingErrorMessage } from "@/lib/errors";
import { GUIDES } from "@/components/integrations/guides";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";

export function SetupGuideSheet({
  id,
  open,
  onOpenChange,
}: {
  id: IntegrationId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const guide = id ? GUIDES[id] : null;
  const queryClient = useQueryClient();
  const test = useMutation({
    mutationFn: () => testIntegration({ data: id! }),
    onSuccess: async () => {
      toast.success("Connected");
      await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["ai-status"] });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {guide ? (
          <>
            <div className="pr-10">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle>{guide.title} setup</SheetTitle>
                <Badge tone="blue">{guide.time}</Badge>
                {INTEGRATION_COPY[guide.id].required ? (
                  <Badge tone="orange">Required</Badge>
                ) : (
                  <Badge tone="neutral">Optional</Badge>
                )}
              </div>
              <SheetDescription>{guide.intro}</SheetDescription>
            </div>
            <ol className="mt-6 flex flex-col gap-4">
              {guide.steps.map((step, index) => (
                <li key={step.title} className="rounded-control bg-secondary-surface/50 p-3">
                  <p className="text-caption font-medium text-muted">Step {index + 1}</p>
                  <h3 className="mt-1 text-body font-semibold">{step.title}</h3>
                  <p className="mt-1 text-caption text-muted">{step.body}</p>
                  {step.copy ? <CopyRow label={step.copy.label} value={step.copy.value} /> : null}
                </li>
              ))}
            </ol>
            <div className="mt-6">
              <h3 className="text-body font-semibold">Checklist</h3>
              <ul className="mt-2 flex flex-col gap-2">
                {guide.checklist.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-caption text-muted">
                    <Check className="mt-0.5 size-4 text-accent" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                disabled={!id || test.isPending}
                onClick={() => test.mutate()}
              >
                {test.isPending ? "Testing…" : "Test Connection"}
              </Button>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="mt-3 flex min-h-11 w-full items-center justify-between gap-2 rounded-control bg-elevated px-3 text-left"
      onClick={() => {
        void copyTextToClipboard(value).then((ok) => {
          if (ok) {
            setCopied(true);
            toast.success(`${label} copied`);
            window.setTimeout(() => setCopied(false), 1500);
          } else toast.error("Couldn’t copy");
        });
      }}
    >
      <span className="min-w-0">
        <span className="block text-caption text-muted">{label}</span>
        <span className="block truncate font-mono text-caption">{value}</span>
      </span>
      {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4 text-muted" />}
    </button>
  );
}
