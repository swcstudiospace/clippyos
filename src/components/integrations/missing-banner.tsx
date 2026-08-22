import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BANNER_BY_PATH, INTEGRATIONS_QUERY_KEY, INTEGRATION_COPY } from "@/lib/integrations";
import { getIntegrationsStatus } from "@/lib/server/integrations";
import { useIntegrationsUi } from "@/components/integrations/provider";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "agency-admin-banner-dismissed";

function readDismissed(): string[] {
  try {
    const raw = window.sessionStorage.getItem(DISMISS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function MissingIntegrationBanners() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { openGuide } = useIntegrationsUi();
  const statusQuery = useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: () => getIntegrationsStatus(),
  });
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  const items = statusQuery.data?.items;
  if (!items) return null;

  const needed = BANNER_BY_PATH.filter((entry) => entry.match(pathname))
    .map((entry) => items[entry.id])
    .filter(
      (item, index, list) =>
        item &&
        item.health !== "connected" &&
        !dismissed.includes(item.id) &&
        list.findIndex((row) => row.id === item.id) === index,
    );

  if (needed.length === 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-2">
      {needed.map((item) => {
        const copy = INTEGRATION_COPY[item.id];
        return (
          <div
            key={item.id}
            className="flex flex-col gap-2 rounded-control border border-border bg-secondary-surface/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            role="status"
          >
            <p className="text-caption">
              This feature requires {copy.name} to be configured.{" "}
              <button
                type="button"
                className="text-accent underline-offset-2 hover:underline"
                onClick={() => openGuide(item.id)}
              >
                Set it up now →
              </button>
            </p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const next = [...dismissed, item.id];
                setDismissed(next);
                try {
                  window.sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next));
                } catch {
                  /* ignore */
                }
              }}
            >
              Dismiss
            </Button>
          </div>
        );
      })}
    </div>
  );
}
