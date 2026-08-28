import { createFileRoute, Link, Navigate, useRouterState } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, isLivePreviewHost, setPreviewSessionToken, signIn } from "@/lib/auth/client";
import { resolveGoogleSocial } from "@/lib/auth/google-social";
import { isReservedOwnerEmail } from "@/lib/auth/email-password";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { mcpOAuthLoginRedirect } from "@/lib/mcp-oauth";
import { captureClientError, userFacingErrorMessage } from "@/lib/errors";
import { unlockSuperAdmin } from "@/lib/server/team-access";
import { OrbsBackground } from "@/components/layout/orbs-background";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SplashScreen } from "@/components/layout/splash-screen";
import { ClippyMark } from "@/components/brand/clippy-mark";
import { AuroraText } from "@/components/magicui/aurora-text";
import { Particles } from "@/components/magicui/particles";
import { ShineBorder } from "@/components/magicui/shine-border";
import { CoolMode } from "@/components/magicui/cool-mode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  loader: () => ({ googleConfigured: Boolean(resolveGoogleSocial()) }),
  component: LoginPage,
});

function LoginPage() {
  const { user, isPending } = useCurrentUserState();
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const wantsAccess = searchStr.includes("intent=access");
  const oauthRedirect = mcpOAuthLoginRedirect(searchStr);
  useEffect(() => {
    if (user && oauthRedirect) window.location.replace(oauthRedirect);
  }, [user, oauthRedirect]);
  if (isPending) return <SplashScreen label="Loading" />;
  if (user && oauthRedirect) return <SplashScreen label="Continuing" />;
  if (user) return <Navigate to={wantsAccess ? "/billing" : "/home"} />;
  return <LoginForm />;
}

function ProviderGlyph({ id }: { id: string }) {
  const letter = id.includes("google") ? "G" : "X";
  return (
    <span
      className="grid size-5 place-items-center text-caption font-semibold"
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}

function LoginForm() {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const wantsAccess = searchStr.includes("intent=access");
  const oauthRedirect = mcpOAuthLoginRedirect(searchStr);
  const afterSignIn = oauthRedirect ?? (wantsAccess ? "/billing" : "/home");
  const { googleConfigured } = Route.useLoaderData();
  const oauthProviders = isLivePreviewHost()
    ? GROK_PROVIDERS
    : googleConfigured
      ? [{ providerId: "google", label: "Google" }]
      : [];
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(wantsAccess ? "signup" : "signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saOpen, setSaOpen] = useState(false);
  const [saPassword, setSaPassword] = useState("");
  const [saBusy, setSaBusy] = useState(false);
  const [saError, setSaError] = useState<string | null>(null);

  async function onOauth(providerId: string) {
    setFormError(null);
    setOauthBusy(providerId);
    try {
      await signIn(providerId, {
        callbackURL: afterSignIn,
        errorCallbackURL: "/login",
      });
    } catch (error) {
      captureClientError(error, { source: "oauth" });
      setFormError(userFacingErrorMessage(error));
      setOauthBusy(null);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (mode === "forgot") {
      if (!email.trim()) {
        setFormError("Enter the email for that account.");
        return;
      }
      setBusy(true);
      try {
        await import("@/lib/server/team-access").then((mod) =>
          mod.requestPasswordReset({ data: { email: email.trim() } }),
        );
        toast.success("If that account exists, ask an Owner to copy a reset link from Settings → Team access.");
        setMode("signin");
      } catch (error) {
        captureClientError(error, { source: "email-auth" });
        setFormError(userFacingErrorMessage(error));
      }
      setBusy(false);
      return;
    }
    if (!email.trim() || password.length < 8) {
      setFormError("Enter a valid email and a password of at least 8 characters.");
      return;
    }
    if (mode === "signup" && isReservedOwnerEmail(email)) {
      setFormError("Owner accounts cannot self-register.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.trim(),
        });
        if (error) throw new Error("Could not create account");
      } else {
        const { error } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (error) throw new Error("Could not sign in");
      }
      window.location.assign(oauthRedirect ?? (mode === "signup" || wantsAccess ? "/billing" : "/home"));
    } catch (error) {
      captureClientError(error, { source: "email-auth" });
      setFormError(userFacingErrorMessage(error));
      toast.error(userFacingErrorMessage(error));
      setBusy(false);
    }
  }

  async function onSuperAdmin(event: FormEvent) {
    event.preventDefault();
    setSaError(null);
    if (saPassword.length < 8) {
      setSaError("Enter the Super Admin password.");
      return;
    }
    setSaBusy(true);
    try {
      const result = await unlockSuperAdmin({ data: { password: saPassword } });
      if (isLivePreviewHost()) setPreviewSessionToken(result.token);
      window.location.assign("/home");
    } catch (error) {
      captureClientError(error, { source: "super-admin" });
      setSaError(userFacingErrorMessage(error));
      toast.error(userFacingErrorMessage(error));
      setSaBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-bg px-4 py-10">
      <OrbsBackground />
      <Particles quantity={42} />
      <div className="absolute top-3 left-3 z-20">
        <Button asChild variant="ghost" size="sm">
          <Link to="/">Back to ClippyOS</Link>
        </Button>
      </div>
      <div className="absolute top-3 right-3 z-20">
        <ThemeToggle />
      </div>
      <GlassCard className="relative z-10 w-full max-w-sm overflow-hidden px-6 py-8">
        <ShineBorder />
        <div className="relative z-[1] mb-6 flex items-center gap-3">
          <ClippyMark size={40} />
          <div>
            <h1 className="text-section font-semibold tracking-tight">
              <AuroraText>{APP_NAME}</AuroraText>
            </h1>
            <p className="text-caption text-muted">{APP_TAGLINE}</p>
          </div>
        </div>
        <p className="relative z-[1] mb-5 text-body text-muted">
          {mode === "signup" || wantsAccess
            ? "Create your workspace, then choose a plan. ClippyOS is subscription-gated — Request a Demo on the landing if you want a walkthrough first."
            : "Sign in to the private OS. New teams subscribe on the next step."}
        </p>

        {authEnabled ? (
          oauthProviders.length > 0 ? (
          <div className="relative z-[1] flex flex-col gap-2">
            {oauthProviders.map((provider) => (
              <Button
                key={provider.providerId}
                variant="secondary"
                className="w-full justify-center"
                disabled={oauthBusy !== null || busy || saBusy}
                onClick={() => void onOauth(provider.providerId)}
              >
                <ProviderGlyph id={provider.providerId} />
                {oauthBusy === provider.providerId
                  ? "Connecting…"
                  : `Continue with ${provider.label}`}
              </Button>
            ))}
          </div>
          ) : null
        ) : (
          <p className="relative z-[1] text-body text-muted">Sign-in is disabled.</p>
        )}

        <div className="relative z-[1] my-5 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-caption text-muted">or email</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={(event) => void onSubmit(event)} className="relative z-[1] flex flex-col gap-3">
          {mode === "signup" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          {mode !== "forgot" ? (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          ) : (
            <p className="text-caption text-muted">
              Password reset emails aren’t sent from this workspace. An Owner can copy a
              one-hour reset link in Settings → Team access. Super Admin Access still works
              if you set that password.
            </p>
          )}
          {formError ? (
            <p className="text-caption text-danger" role="alert">
              {formError}
            </p>
          ) : null}
          <CoolMode>
            <Button type="submit" className="mt-1 w-full" disabled={busy || oauthBusy !== null || saBusy}>
              {busy
                ? "Please wait…"
                : mode === "signup"
                  ? "Continue to checkout"
                  : mode === "forgot"
                    ? "Request reset"
                    : "Sign in"}
            </Button>
          </CoolMode>
        </form>

        {mode === "signin" ? (
          <button
            type="button"
            className="relative z-[1] mt-3 w-full text-center text-caption text-muted underline-offset-4 hover:text-fg hover:underline"
            onClick={() => {
              setMode("forgot");
              setFormError(null);
            }}
          >
            Forgot password?
          </button>
        ) : null}

        <button
          type="button"
          className="relative z-[1] mt-4 w-full text-center text-caption text-muted underline-offset-4 hover:text-fg hover:underline"
          onClick={() => {
            setMode((current) => (current === "signin" ? "signup" : "signin"));
            setFormError(null);
          }}
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "Need an account? Create one"}
        </button>
        <p className="relative z-[1] mt-3 text-center text-caption text-muted">
          Brand stakeholder?{" "}
          <Link to="/portal/login" className="text-fg underline-offset-4 hover:underline">
            Open the client portal
          </Link>
        </p>

        <Separator className="relative z-[1] my-4" />
        <Button
          variant="secondary"
          className="relative z-[1] w-full"
          disabled={busy || oauthBusy !== null || saBusy}
          onClick={() => {
            setSaError(null);
            setSaOpen(true);
          }}
        >
          Super Admin Access
        </Button>
      </GlassCard>

      <Dialog
        open={saOpen}
        onOpenChange={(open) => {
          setSaOpen(open);
          if (!open) {
            setSaPassword("");
            setSaError(null);
          }
        }}
      >
        <DialogContent>
          <DialogTitle>Super Admin Access</DialogTitle>
          <DialogDescription>
            Enter the Super Admin password from Settings → Team access. The
            password is never stored in the browser.
          </DialogDescription>
          <form className="mt-4 flex flex-col gap-3" onSubmit={(event) => void onSuperAdmin(event)}>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sa-login-password">Password</Label>
              <Input
                id="sa-login-password"
                type="password"
                autoComplete="current-password"
                value={saPassword}
                onChange={(event) => setSaPassword(event.target.value)}
                minLength={8}
                required
              />
            </div>
            {saError ? (
              <p className="text-caption text-danger" role="alert">
                {saError}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" disabled={saBusy}>
                {saBusy ? "Checking…" : "Unlock"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setSaOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
