import { Link } from "@tanstack/react-router";
import { APP_NAME } from "@/lib/constants";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { OrbsBackground } from "@/components/layout/orbs-background";
import { Meteors } from "@/components/magicui/meteors";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { ClippyMark } from "@/components/brand/clippy-mark";

export function NotFound() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-bg px-6 text-fg">
      <OrbsBackground />
      <GlassCard className="relative z-10 w-full max-w-md overflow-hidden px-8 py-10 text-center">
        <Meteors number={8} />
        <div className="relative z-[1] flex flex-col items-center">
          <ClippyMark size={44} />
          <p className="mt-4 text-caption font-medium text-muted">404</p>
          <h1 className="mt-2 text-page font-semibold tracking-tight">
            <SparklesText>Page not found</SparklesText>
          </h1>
          <p className="mt-2 text-body text-muted">
            That route does not exist in {APP_NAME}.
          </p>
          <Button asChild className="mt-6">
            <Link to="/">Back to ClippyOS</Link>
          </Button>
        </div>
      </GlassCard>
    </main>
  );
}
