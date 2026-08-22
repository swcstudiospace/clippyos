import { Link, Navigate, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clapperboard,
  HelpCircle,
  Home,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { OrbsBackground } from "@/components/layout/orbs-background";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SplashScreen } from "@/components/layout/splash-screen";
import { ClippyMark } from "@/components/brand/clippy-mark";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PORTAL_HOME_KEY, PORTAL_QUERY_KEY, setPortalBearerToken } from "@/lib/portal";
import { getPortalHomeFn, getPortalSessionFn, portalLogoutFn } from "@/lib/server/portal-fns";
import { initials } from "@/lib/format";

const NAV = [
  { to: "/portal/home", label: "Home", icon: Home },
  { to: "/portal/assets", label: "Assets", icon: Clapperboard },
  { to: "/portal/approvals", label: "Approvals", icon: ShieldCheck },
  { to: "/portal/activity", label: "Activity", icon: CheckCircle2 },
  { to: "/portal/help", label: "Help", icon: HelpCircle },
] as const;

export function PortalShell() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const session = useQuery({
    queryKey: PORTAL_QUERY_KEY,
    queryFn: () => getPortalSessionFn(),
    retry: false,
  });
  const home = useQuery({
    queryKey: PORTAL_HOME_KEY,
    queryFn: () => getPortalHomeFn(),
    enabled: Boolean(session.data),
  });

  const logout = useMutation({
    mutationFn: () => portalLogoutFn(),
    onSettled: async () => {
      setPortalBearerToken(null);
      await router.navigate({ to: "/portal/login" });
    },
  });

  if (session.isPending) return <SplashScreen label="Opening portal" />;
  if (session.isError || !session.data) {
    return <Navigate to="/portal/login" />;
  }

  const settings = home.data?.settings;
  const client = home.data?.client;
  const pending = home.data?.pendingApprovals ?? 0;
  const agency = settings?.agencyName ?? "Client portal";

  return (
    <div className="relative min-h-dvh bg-bg text-fg">
      <OrbsBackground />
      <a href="#portal-main" className="skip-link">
        Skip to content
      </a>
      <header className="sticky top-0 z-20 border-b border-border/80 bg-bg/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="" className="size-9 rounded-control object-cover" />
          ) : (
            <ClippyMark size={36} />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-caption text-muted">{agency}</p>
            <p className="truncate text-body font-semibold tracking-tight">
              {client?.name ?? "Your brand"}
            </p>
          </div>
          {session.data.preview ? (
            <Badge tone="orange">Preview</Badge>
          ) : null}
          {client?.channelThumbnail ? (
            <img
              src={client.channelThumbnail}
              alt=""
              className="hidden size-9 rounded-full object-cover sm:block"
            />
          ) : (
            <span className="hidden size-9 place-items-center rounded-full bg-secondary-surface text-caption font-semibold sm:grid">
              {initials(client?.name ?? "C")}
            </span>
          )}
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
        <nav
          aria-label="Portal"
          className="mx-auto hidden max-w-5xl gap-1 px-3 pb-2 md:flex"
        >
          {NAV.map((item) => {
            const active = pathname === item.to || (item.to === "/portal/home" && pathname === "/portal");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-caption font-medium",
                  active ? "bg-secondary-surface text-fg" : "text-muted hover:text-fg",
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
                {item.to === "/portal/approvals" && pending > 0 ? (
                  <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[0.65rem] text-accent-fg">
                    {pending}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </header>

      <main
        id="portal-main"
        className="relative z-10 mx-auto max-w-5xl px-4 py-6 pb-28 md:pb-10"
      >
        <Outlet />
      </main>

      <nav
        aria-label="Portal mobile"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="grid grid-cols-5">
          {NAV.map((item) => {
            const active = pathname === item.to;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 text-[0.65rem] font-medium",
                    active ? "text-accent" : "text-muted",
                  )}
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
