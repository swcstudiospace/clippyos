import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { IntegrationId } from "@/lib/integrations";

type Ctx = {
  guide: IntegrationId | null;
  openGuide: (id: IntegrationId) => void;
  closeGuide: () => void;
};

const IntegrationsUi = createContext<Ctx | null>(null);

export function IntegrationsProvider({ children }: { children: ReactNode }) {
  const [guide, setGuide] = useState<IntegrationId | null>(null);
  const value = useMemo(
    () => ({
      guide,
      openGuide: setGuide,
      closeGuide: () => setGuide(null),
    }),
    [guide],
  );
  return <IntegrationsUi.Provider value={value}>{children}</IntegrationsUi.Provider>;
}

export function useIntegrationsUi(): Ctx {
  const ctx = useContext(IntegrationsUi);
  if (!ctx) {
    return {
      guide: null,
      openGuide: () => undefined,
      closeGuide: () => undefined,
    };
  }
  return ctx;
}
