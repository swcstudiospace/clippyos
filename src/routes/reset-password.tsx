import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { completePasswordReset } from "@/lib/server/team-access";
import { OrbsBackground } from "@/components/layout/orbs-background";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShineBorder } from "@/components/magicui/shine-border";
import { ClippyMark } from "@/components/brand/clippy-mark";
import { userFacingErrorMessage } from "@/lib/errors";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const search = useRouterState({ select: (s) => s.location.searchStr });
  const token = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await completePasswordReset({ data: { token, password } });
      setDone(true);
      toast.success("Password updated");
    } catch (err) {
      setError(userFacingErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-bg px-4 py-10">
      <OrbsBackground />
      <GlassCard className="relative z-10 w-full max-w-sm overflow-hidden px-6 py-8">
        <ShineBorder />
        <div className="relative z-[1] mb-6 flex items-center gap-3">
          <ClippyMark size={40} />
          <h1 className="text-section font-semibold tracking-tight">Reset password</h1>
        </div>
        {done ? (
          <div className="relative z-[1] flex flex-col gap-3">
            <p className="text-body text-muted">Your password is updated. Sign in with the new one.</p>
            <Button asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        ) : (
          <form className="relative z-[1] flex flex-col gap-3" onSubmit={(event) => void onSubmit(event)}>
            <p className="text-caption text-muted">
              Use the link an Owner copied from Team access. Links expire in one hour.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error ? (
              <p className="text-caption text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={busy || token.length < 16}>
              {busy ? "Saving…" : "Update password"}
            </Button>
          </form>
        )}
      </GlassCard>
    </main>
  );
}
