import { useEffect, useState } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { APP_NAME, SIDEBAR_STORAGE_KEY } from "@/lib/constants";
import { Sidebar, SidebarNav } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { OrbsBackground } from "@/components/layout/orbs-background";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { SplashScreen } from "@/components/layout/splash-screen";
import { BrandLockup } from "@/components/brand/clippy-mark";
import { IntegrationsProvider, useIntegrationsUi } from "@/components/integrations/provider";
import { WelcomeModal } from "@/components/integrations/welcome-modal";
import { SetupGuideSheet } from "@/components/integrations/setup-guide";
import { MissingIntegrationBanners } from "@/components/integrations/missing-banner";
import { BillingGate } from "@/components/billing/gate";
import { ProductOnboardingCard } from "@/components/onboarding/product-checklist";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { BILLING_QUERY_KEY } from "@/lib/billing";
import { getBillingSnapshot } from "@/lib/server/billing-fns";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsed());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem("clippy-login-audited") === "1") return;
      window.sessionStorage.setItem("clippy-login-audited", "1");
    } catch {
      return;
    }
    void import("@/lib/server/safety-fns")
      .then((mod) => mod.recordLoginFn())
      .catch(() => {});
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* storage blocked */
      }
      return next;
    });
  }

  return (
    <IntegrationsProvider>
      <div className="relative min-h-dvh bg-bg text-fg">
        <OrbsBackground />
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />
        <div
          className={cn(
            "relative z-10 min-h-dvh min-w-0 transition-[margin] duration-(--motion-fast) ease-[var(--ease-out)] motion-reduce:transition-none",
            collapsed ? "md:ml-sidebar-collapsed" : "md:ml-sidebar",
          )}
        >
          <TopBar onOpenNav={() => setMobileOpen(true)} />
          <main
            id="main"
            className="relative min-w-0 overflow-x-clip px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-8 md:py-8"
          >
            <MissingIntegrationBanners />
            <GatedOutlet />
          </main>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">
              Primary sections of {APP_NAME}
            </SheetDescription>
            <div className="flex h-full flex-col">
              <div className="px-6 pb-3 pt-2">
                <BrandLockup />
              </div>
              <SidebarNav
                collapsed={false}
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
        <WelcomeModal />
        <GuideHost />
      </div>
    </IntegrationsProvider>
  );
}

function GatedOutlet() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const billing = useQuery({
    queryKey: BILLING_QUERY_KEY,
    queryFn: () => getBillingSnapshot(),
  });
  if (billing.isPending) return <SplashScreen label="Checking access" />;
  const snapshot = billing.data;
  if (snapshot?.enforced && !snapshot.entitled) {
    const allowed = pathname.startsWith("/settings") || pathname.startsWith("/billing");
    if (snapshot.role === "owner" && allowed) return <Outlet />;
    return <BillingGate snapshot={snapshot} />;
  }
  return (
    <>
      {pathname === "/home" ? (
        <ProductOnboardingCard entitled={Boolean(snapshot?.entitled)} />
      ) : null}
      <Outlet />
    </>
  );
}

function GuideHost() {
  const { guide, closeGuide } = useIntegrationsUi();
  return (
    <SetupGuideSheet
      id={guide}
      open={guide !== null}
      onOpenChange={(open) => {
        if (!open) closeGuide();
      }}
    />
  );
}

export function AppShellSkeleton() {
  return <SplashScreen label="Loading your workspace" />;
}
