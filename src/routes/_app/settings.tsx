import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Database,
  Download,
  KeyRound,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { applyPendingAgencyMigrations, getSupabaseStatus } from "@/lib/server/settings";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { AiTrainingSection } from "@/components/settings/ai-training";
import { IntegrationsPanel } from "@/components/settings/integrations-panel";
import { SocialPublishersPanel } from "@/components/settings/social-publishers";
import { LinearPanel } from "@/components/settings/linear-panel";
import { GrokBotPanel } from "@/components/settings/grok-bot-panel";
import { ClippyOsMcpPanel } from "@/components/settings/clippy-os-mcp-panel";
import { TeamAccessPanel } from "@/components/settings/team-access";
import { SafetyPanel } from "@/components/settings/safety-panel";
import { AutomationPanel } from "@/components/settings/automation-panel";
import { AddonsPanel } from "@/components/settings/addons-panel";
import { SkillsPanel } from "@/components/settings/skills-panel";
import { LlmProvidersPanel } from "@/components/settings/llm-providers";
import { MediaPipelinePanel } from "@/components/settings/media-pipeline";
import { PortalPanel } from "@/components/settings/portal-panel";
import { DesktopInstallPanel } from "@/components/desktop-install";
import { captureClientError, userFacingErrorMessage } from "@/lib/errors";
import { copyTextToClipboard, downloadTextFile } from "@/lib/clipboard";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useCurrentUserState();
  const statusQuery = useQuery({
    queryKey: ["supabase-status"],
    queryFn: () => getSupabaseStatus(),
  });
  const applyMigrations = useMutation({
    mutationFn: () => applyPendingAgencyMigrations(),
    onSuccess: async (result) => {
      await statusQuery.refetch();
      if (result.schemaReady) {
        toast.success("Agency tables are ready");
        return;
      }
      toast.message(
        result.missing.length > 0
          ? `Still missing: ${result.missing.join(", ")}`
          : "Migrations applied. Re-check tables.",
      );
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  useEffect(() => {
    function scrollToHash() {
      if (typeof window === "undefined") return;
      const id = window.location.hash.replace(/^#/, "");
      if (!id) return;
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [statusQuery.data]);

  if (statusQuery.isPending) return <SettingsSkeleton />;
  if (statusQuery.isError || !statusQuery.data) {
    return (
      <div className="mx-auto max-w-6xl">
        <Header />
        <ErrorState
          className="mt-8 max-w-3xl"
          title="Could not reach workspace data"
          description="Sign in again and retry. Your project URL is configured; this check needs an active session."
          onRetry={() => void statusQuery.refetch()}
        />
      </div>
    );
  }

  const status = statusQuery.data;
  const connected = status.authHealth && status.jwksHealth;
  const readyCount = status.tables.filter((table) => table.exists).length;

  return (
    <div className="mx-auto max-w-6xl">
      <Header />

      <div className="mt-8 flex flex-col gap-8">
        <section id="desktop" className="scroll-mt-24">
          <DesktopInstallPanel />
        </section>
        <section id="llm" className="scroll-mt-24">
          <LlmProvidersPanel />
        </section>
        <section id="addons-registry" className="scroll-mt-24">
          <AddonsPanel />
        </section>
        <section id="skills" className="scroll-mt-24">
          <SkillsPanel />
        </section>
        <section id="integrations" className="scroll-mt-24">
          <IntegrationsPanel />
        </section>
        <section id="clippy-mcp-section" className="scroll-mt-24">
          <ClippyOsMcpPanel />
        </section>
        <section id="publishers" className="scroll-mt-24">
          <SocialPublishersPanel />
        </section>
        <section id="linear" className="scroll-mt-24">
          <LinearPanel />
        </section>
        <section id="grok-bot-section" className="scroll-mt-24">
          <GrokBotPanel />
        </section>
        <section id="media" className="scroll-mt-24">
          <MediaPipelinePanel />
        </section>
        <AutomationPanel />
        <SafetyPanel />
        <PortalPanel />
        <section id="team" className="scroll-mt-24">
          <TeamAccessPanel />
        </section>

        <div className="flex max-w-3xl flex-col gap-4">
          <GlassCard>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
                  <Database className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-card font-semibold tracking-tight">Supabase project</h2>
                  <p className="text-caption text-muted">{status.projectRef}</p>
                </div>
              </div>
              <Badge tone={statusTone(connected ? "CONNECTED" : "ERROR")}>
                {connected ? "Connected" : "Unreachable"}
              </Badge>
            </div>
            <ul className="mt-5 flex flex-col gap-3">
              <StatusRow
                label="Auth API"
                ok={status.authHealth}
                detail="User registration and session service"
              />
              <StatusRow
                label="Signing keys"
                ok={status.jwksHealth}
                detail="JWT verification endpoint"
              />
              <StatusRow
                label="Admin API key"
                ok={status.adminConfigured}
                detail={
                  status.adminConfigured
                    ? "Server can write agency data and bypass row-level security"
                    : "Not set on this host — apply schema from the SQL editor"
                }
              />
            </ul>
          </GlassCard>

          <GlassCard>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-card font-semibold tracking-tight">Workspace tables</h2>
                  <p className="text-caption text-muted">
                    {readyCount} of {status.tables.length} ready
                  </p>
                </div>
              </div>
              <Badge tone={statusTone(status.schemaReady ? "CONNECTED" : "PENDING")}>
                {status.schemaReady ? "Ready" : "Needs schema"}
              </Badge>
            </div>
            <p className="mt-4 text-body text-muted">
              {status.schemaReady
                ? "Agency tables are live in your project. Row-level security keeps the public key from reading fees or payments."
                : "Tables are not created yet. Apply pending migrations against DATABASE_URL, or copy the schema and run it in the Supabase SQL editor as a fallback."}
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {status.tables.map((table) => (
                <li
                  key={table.name}
                  className="flex items-center justify-between gap-2 rounded-control bg-secondary-surface/60 px-3 py-2"
                >
                  <span className="font-mono text-caption">{table.name}</span>
                  <span
                    className={cn(
                      "text-caption",
                      table.exists ? "text-success" : "text-muted",
                    )}
                  >
                    {table.exists ? "Ready" : "Missing"}
                  </span>
                </li>
              ))}
            </ul>
            {!status.schemaReady ? (
              <div className="mt-5 flex flex-col gap-2">
                <Button
                  onClick={() => applyMigrations.mutate()}
                  className="min-h-11 w-fit"
                  disabled={!status.postgresConfigured || applyMigrations.isPending}
                >
                  {applyMigrations.isPending ? "Applying…" : "Apply pending migrations"}
                </Button>
                {!status.postgresConfigured ? (
                  <p className="text-caption text-muted">
                    Set DATABASE_URL to the Supabase Postgres URI (not the REST URL) to apply
                    migrations from this screen.
                  </p>
                ) : null}
              </div>
            ) : null}
            <SchemaCopy sql={status.schemaSql} />
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
                <KeyRound className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-card font-semibold tracking-tight">Sign-in</h2>
                <p className="text-caption text-muted">How operators enter this workspace</p>
              </div>
            </div>
            <ul className="mt-5 flex flex-col gap-3 text-body">
              <li className="flex flex-col gap-0.5">
                <span className="font-medium">Google and X</span>
                <span className="text-caption text-muted">
                  Workspace login for this app. Required in the live preview.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-medium">Email and password</span>
                <span className="text-caption text-muted">
                  Creates a workspace session and also registers the account with
                  your Supabase Auth project when reachable.
                </span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span className="font-medium">Super Admin Access</span>
                <span className="text-caption text-muted">
                  Password on the login screen, set under Team access. Hashed in
                  AppSetting — never hard-coded.
                </span>
              </li>
            </ul>
            <Separator className="my-5" />
            <div className="flex items-start gap-3">
              {status.adminConfigured ? (
                <Check className="mt-0.5 size-4 text-success" aria-hidden="true" />
              ) : (
                <Unplug className="mt-0.5 size-4 text-muted" aria-hidden="true" />
              )}
              <p className="text-caption text-muted">
                Signed in as {user?.primaryEmail ?? user?.displayName ?? user?.id ?? "operator"}
                {status.operatorRole ? ` · ${status.operatorRole}` : ""}.
                Data writes go through server functions after this session is verified.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>

      <AiTrainingSection />
    </div>
  );
}

function Header() {
  return (
    <PageHeader
      title="Settings"
      description="Add-ons, Skills, LLM Providers, ClippyOS MCP, Hermes Connect, and workspace data. Keys stay on the server with admin-only field security."
    />
  );
}

function StatusRow({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <li className="flex items-start justify-between gap-3">
      <div>
        <p className="text-body font-medium">{label}</p>
        <p className="text-caption text-muted">{detail}</p>
      </div>
      <Badge tone={statusTone(ok ? "CONNECTED" : "PENDING")}>{ok ? "On" : "Off"}</Badge>
    </li>
  );
}

function SchemaCopy({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const ready = sql.trim().length > 0;

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => {
      const field = areaRef.current;
      if (!field) return;
      field.focus();
      field.select();
    }, 50);
    return () => window.clearTimeout(handle);
  }, [open]);

  async function copy() {
    if (!ready) {
      toast.error("Schema SQL isn’t available yet. Retry in a moment.");
      return;
    }
    const ok = await copyTextToClipboard(sql);
    if (ok) {
      setCopied(true);
      toast.success("Schema SQL copied");
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }
    captureClientError(new Error("clipboard-blocked"), { source: "copy-schema" });
    setOpen(true);
    toast.message("Clipboard is blocked here. Select the SQL below, or download the file.");
  }

  function download() {
    if (!ready) {
      toast.error("Schema SQL isn’t available yet. Retry in a moment.");
      return;
    }
    const ok = downloadTextFile("agency-admin-schema.sql", sql);
    if (ok) {
      toast.success("Download started");
      return;
    }
    setOpen(true);
    toast.message("Download was blocked. Select the SQL below and copy it.");
  }

  return (
    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button variant="secondary" onClick={() => void copy()} className="min-h-11" disabled={!ready}>
        {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        {copied ? "Copied" : "Copy schema SQL"}
      </Button>
      <Button variant="secondary" onClick={download} className="min-h-11" disabled={!ready}>
        <Download className="size-4" aria-hidden="true" />
        Download .sql
      </Button>
      <a
        href="/api/agency-schema"
        download="agency-admin-schema.sql"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-button bg-transparent px-4 text-body font-medium text-fg hover:bg-glass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        Open as file
      </a>
      <Button variant="ghost" onClick={() => setOpen(true)} className="min-h-11" disabled={!ready}>
        View SQL
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[min(100%-2rem,48rem)]">
          <DialogTitle>Workspace schema</DialogTitle>
          <DialogDescription>
            Paste this into the Supabase SQL editor (SQL → New query) and run it.
            Safe to re-run. Select all, then copy if the clipboard button is blocked.
          </DialogDescription>
          <Textarea
            ref={areaRef}
            readOnly
            value={sql}
            spellCheck={false}
            className="mt-4 min-h-64 font-mono text-caption"
            aria-label="Workspace schema SQL"
            onFocus={(event) => event.currentTarget.select()}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                areaRef.current?.focus();
                areaRef.current?.select();
              }}
            >
              Select all
            </Button>
            <Button onClick={() => void copy()}>
              <Copy className="size-4" aria-hidden="true" />
              Copy
            </Button>
            <Button variant="secondary" onClick={download}>
              <Download className="size-4" aria-hidden="true" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <Header />
      <p className="mt-6 text-body text-muted">Checking your project…</p>
      <div className="mt-4 flex max-w-3xl flex-col gap-4">
        <Skeleton className="h-48 w-full rounded-card" />
        <Skeleton className="h-72 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
      <div className="mt-10">
        <Skeleton className="h-8 w-48 rounded-control" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full rounded-control" />
        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Skeleton className="h-96 w-full rounded-card" />
          <Skeleton className="h-96 w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}
