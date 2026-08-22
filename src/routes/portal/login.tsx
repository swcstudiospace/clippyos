import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { OrbsBackground } from "@/components/layout/orbs-background";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ClippyMark } from "@/components/brand/clippy-mark";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShineBorder } from "@/components/magicui/shine-border";
import { AuroraText } from "@/components/magicui/aurora-text";
import { Particles } from "@/components/magicui/particles";
import { setPortalBearerToken } from "@/lib/portal";
import {
  activatePortalInviteFn,
  peekPortalInviteFn,
  portalLoginFn,
} from "@/lib/server/portal-fns";
import { captureClientError, userFacingErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

type Search = { invite?: string };

export const Route = createFileRoute("/portal/login")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    invite: typeof search.invite === "string" ? search.invite : undefined,
  }),
  component: PortalLoginPage,
});

function PortalLoginPage() {
  const router = useRouter();
  const { invite } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const preview = useQuery({
    queryKey: ["portal-invite", invite],
    queryFn: () => peekPortalInviteFn({ data: { token: invite! } }),
    enabled: Boolean(invite),
    retry: false,
  });

  useEffect(() => {
    if (preview.data?.email) setEmail(preview.data.email);
  }, [preview.data?.email]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (password.length < 8) {
      setFormError("Use a password of at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const result = invite
        ? await activatePortalInviteFn({
            data: { token: invite, password, name: name.trim() || undefined },
          })
        : await portalLoginFn({ data: { email: email.trim(), password } });
      setPortalBearerToken(result.token);
      await router.navigate({ to: "/portal/home" });
    } catch (error) {
      captureClientError(error, { source: "portal-login" });
      setFormError(userFacingErrorMessage(error));
      toast.error(userFacingErrorMessage(error));
      setBusy(false);
    }
  }

  const agency = preview.data?.agencyName ?? "Client portal";
  const inviteMode = Boolean(invite);

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-bg px-4 py-10">
      <OrbsBackground />
      <Particles quantity={28} />
      <div className="absolute top-3 right-3 z-20">
        <ThemeToggle />
      </div>
      <GlassCard className="relative z-10 w-full max-w-sm overflow-hidden px-6 py-8">
        <ShineBorder />
        <div className="relative z-[1] mb-6 flex items-center gap-3">
          <ClippyMark size={40} />
          <div>
            <h1 className="text-section font-semibold tracking-tight">
              <AuroraText>{agency}</AuroraText>
            </h1>
            <p className="text-caption text-muted">
              {inviteMode
                ? `Activate access for ${preview.data?.clientName ?? "your brand"}`
                : "Brand portal — production updates only"}
            </p>
          </div>
        </div>

        {preview.isError ? (
          <p className="relative z-[1] mb-4 text-caption text-danger">
            {userFacingErrorMessage(preview.error)} This invite may have expired. Ask your
            producer for a new link.
          </p>
        ) : null}

        <form className="relative z-[1] flex flex-col gap-4" onSubmit={onSubmit}>
          {inviteMode ? (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="portal-name">Your name</Label>
                <Input
                  id="portal-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Optional"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="portal-email">Email</Label>
                <Input id="portal-email" value={email} readOnly />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="portal-email">Email</Label>
              <Input
                id="portal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="portal-password">
              {inviteMode ? "Set a password" : "Password"}
            </Label>
            <Input
              id="portal-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={inviteMode ? "new-password" : "current-password"}
              required
              minLength={8}
            />
          </div>
          {formError ? <p className="text-caption text-danger">{formError}</p> : null}
          <Button type="submit" disabled={busy || (inviteMode && preview.isError)}>
            {busy ? "Working…" : inviteMode ? "Activate access" : "Open portal"}
          </Button>
        </form>

        <p className="relative z-[1] mt-6 text-center text-caption text-muted">
          Agency team?{" "}
          <Link to="/login" className="text-fg underline-offset-4 hover:underline">
            Staff sign in
          </Link>
        </p>
      </GlassCard>
    </main>
  );
}
