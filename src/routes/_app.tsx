import { createFileRoute } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AppShell, AppShellSkeleton } from "@/components/layout/app-shell";

export const Route = createFileRoute("/_app")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <AppShellSkeleton />;
  if (!user) return <RedirectToSignIn />;
  return <AppShell />;
}
