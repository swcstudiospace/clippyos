import { createFileRoute, Link } from "@tanstack/react-router";
import { GlassCard } from "@/components/ui/glass-card";
import { PageHeader } from "@/components/ui/page-header";

export const Route = createFileRoute("/portal/help")({
  component: PortalHelpPage,
});

function PortalHelpPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Help"
        description="This portal is a read-only window into production, with optional sign-off on publishes."
      />
      <GlassCard>
        <h2 className="text-card font-semibold tracking-tight">What you can do</h2>
        <ul className="mt-3 flex flex-col gap-2 text-body text-muted">
          <li>See the current production stage for your brand.</li>
          <li>Preview ready videos and images.</li>
          <li>Approve a post or request changes before it goes live.</li>
        </ul>
      </GlassCard>
      <GlassCard>
        <h2 className="text-card font-semibold tracking-tight">What you cannot see</h2>
        <ul className="mt-3 flex flex-col gap-2 text-body text-muted">
          <li>Team costs, invoices, or payment amounts.</li>
          <li>Internal tools, agents, or other clients.</li>
          <li>Workspace settings and API keys.</li>
        </ul>
      </GlassCard>
      <GlassCard>
        <h2 className="text-card font-semibold tracking-tight">Need a change?</h2>
        <p className="mt-2 text-body text-muted">
          Request changes on an approval with a short note. Your producer is notified immediately.
          For access issues, ask them to send a new invite — revoked logins stop working instantly.
        </p>
        <p className="mt-3 text-caption text-muted">
          Staff?{" "}
          <Link to="/login" className="text-fg underline-offset-4 hover:underline">
            Open the agency workspace
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
