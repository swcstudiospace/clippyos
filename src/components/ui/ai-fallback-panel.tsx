import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { INTEGRATION_COPY, type IntegrationId } from "@/lib/integrations";
import { useIntegrationsUi } from "@/components/integrations/provider";

export function AIFallbackPanel({
  title = "This tool will be available once you connect your API key",
  integration = "ai",
}: {
  title?: string;
  integration?: IntegrationId;
}) {
  const [open, setOpen] = useState(false);
  const { openGuide } = useIntegrationsUi();
  const copy = INTEGRATION_COPY[integration];
  return (
    <div className="rounded-control bg-secondary-surface/60 px-4 py-4">
      <p className="text-body">{title}</p>
      <p className="mt-2 text-caption text-muted">
        This feature requires {copy.name} to be configured.{" "}
        <button
          type="button"
          className="text-accent underline-offset-2 hover:underline"
          onClick={() => openGuide(integration)}
        >
          Set it up now →
        </button>
      </p>
      <Collapsible.Root open={open} onOpenChange={setOpen}>
        <Collapsible.Trigger asChild>
          <button
            type="button"
            className="mt-2 inline-flex min-h-11 items-center gap-1 text-caption text-muted hover:text-fg"
            aria-expanded={open}
          >
            Here’s how
            <ChevronDown
              className={cn(
                "size-4 transition-transform duration-(--motion-fast) ease-[var(--ease-out)] motion-reduce:transition-none",
                open && "rotate-180",
              )}
              aria-hidden="true"
            />
          </button>
        </Collapsible.Trigger>
        <Collapsible.Content className="overflow-hidden">
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-caption text-muted">
            <li>Open the setup guide from the link above, or go to Settings → Integrations.</li>
            <li>
              Paste the {copy.name} credential and run Test Connection. Keys stay on the
              server and never appear in the browser.
            </li>
            <li>
              Return here and run the action again. It activates on the next use
              without a reload.
            </li>
          </ol>
          <Link to="/settings" className="mt-3 inline-flex min-h-11 items-center text-caption text-accent">
            Go to Settings
          </Link>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
}
