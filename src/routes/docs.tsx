import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { ClippyMark } from "@/components/brand/clippy-mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/docs")({
  component: DocsPlaceholderPage,
});

function DocsPlaceholderPage() {
  return (
    <div className="relative min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <ClippyMark size={32} />
            <span className="text-body font-semibold tracking-tight">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="min-h-11">
              <Link to="/">Back</Link>
            </Button>
            <Button asChild className="min-h-11">
              <a href="/login?intent=access">Get Access</a>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
        <BookOpen className="size-10 text-accent" aria-hidden="true" />
        <h1 className="mt-6 text-page font-semibold tracking-tight">Documentation</h1>
        <p className="mt-3 text-body text-muted">
          {APP_TAGLINE}. The handbook — Social Machine, liaison APIs, Hermes, Linear, and storage —
          publishes on GitBook when this repository ships.
        </p>
        <p className="mt-4 text-caption text-muted">
          This page is the placeholder. Until GitBook is live, request a demo and we’ll walk the OS
          with you.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <a href="/#demo">Request a Demo</a>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/">Back to ClippyOS</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
