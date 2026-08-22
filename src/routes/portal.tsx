import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { PortalShell } from "@/components/portal/shell";

export const Route = createFileRoute("/portal")({
  component: PortalLayout,
});

function PortalLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (
    pathname === "/portal/login" ||
    pathname === "/portal" ||
    pathname === "/portal/"
  ) {
    return <Outlet />;
  }
  return <PortalShell />;
}
