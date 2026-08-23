import { useMemo, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { OrbsBackground } from "@/components/layout/orbs-background";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SplashScreen } from "@/components/layout/splash-screen";
import { ClippyMark } from "@/components/brand/clippy-mark";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShineBorder } from "@/components/magicui/shine-border";
import { AuroraText } from "@/components/magicui/aurora-text";
import { Particles } from "@/components/magicui/particles";
import { APP_NAME } from "@/lib/constants";
import { userFacingErrorMessage } from "@/lib/errors";
import { loginUrlForAuthorize } from "@/lib/mcp-oauth";
import { decideMcpOAuthConsentFn, getMcpOAuthConsentFn } from "@/lib/server/mcp-oauth-fns";

function readAuthorizeSearch(searchStr: string) {
  const params = new URLSearchParams(searchStr.startsWith("?") ? searchStr.slice(1) : searchStr);
  return {
    response_type: params.get("response_type") || "code",
    client_id: params.get("client_id") || "",
    redirect_uri: params.get("redirect_uri") || "",
    state: params.get("state") || undefined,
    code_challenge: params.get("code_challenge") || "",
    code_challenge_method: params.get("code_challenge_method") || "S256",
    scope: params.get("scope") || undefined,
    resource: params.get("resource") || undefined,
  };
}

export function McpOAuthConsentPage() {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const fields = useMemo(() => readAuthorizeSearch(searchStr), [searchStr]);
  const [formError, setFormError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["mcp-oauth-consent", fields],
    queryFn: () => getMcpOAuthConsentFn({ data: fields }),
    enabled: Boolean(fields.client_id && fields.redirect_uri && fields.code_challenge),
  });

  const decide = useMutation({
    mutationFn: (decision: "allow" | "deny") => decideMcpOAuthConsentFn({ data: { ...fields, decision } }),
    onSuccess: (result) => {
      window.location.assign(result.redirectUrl);
    },
    onError: (error) => setFormError(userFacingErrorMessage(error)),
  });

  const signInHref = loginUrlForAuthorize(`${pathname}${searchStr}`);

  if (!fields.client_id || !fields.redirect_uri || !fields.code_challenge) {
    return (
      <Shell>
        <h1 className="text-section font-semibold tracking-tight">
          <AuroraText>Connect ClippyOS</AuroraText>
        </h1>
        <p className="mt-3 text-body text-muted">
          This link is missing OAuth details. Start from grok.com/connectors → New Connector → Custom, and paste the
          ClippyOS MCP URL.
        </p>
        <Button asChild className="mt-6 min-h-11 w-full">
          <Link to="/settings">Open Settings</Link>
        </Button>
      </Shell>
    );
  }

  if (query.isPending) return <SplashScreen label="Checking connector" />;

  const consent = query.data;
  const error = formError || consent?.error || (query.isError ? userFacingErrorMessage(query.error) : null);

  if (error && !consent?.clientName) {
    return (
      <Shell>
        <h1 className="text-section font-semibold tracking-tight">Couldn’t continue</h1>
        <p className="mt-3 text-body text-muted">{error}</p>
        <Button asChild variant="secondary" className="mt-6 min-h-11 w-full">
          <Link to="/settings">Back to Settings</Link>
        </Button>
      </Shell>
    );
  }

  if (consent && !consent.signedIn) {
    return (
      <Shell>
        <h1 className="text-section font-semibold tracking-tight">
          <AuroraText>Sign in to connect</AuroraText>
        </h1>
        <p className="mt-3 text-body text-muted">
          {consent.clientName || "A Grok connector"} wants to use ClippyOS. Sign in as an admin, then approve the
          connection.
        </p>
        <Button asChild className="mt-6 min-h-11 w-full">
          <a href={signInHref}>Sign in</a>
        </Button>
      </Shell>
    );
  }

  if (consent && !consent.isAdmin) {
    return (
      <Shell>
        <h1 className="text-section font-semibold tracking-tight">Ask an admin</h1>
        <p className="mt-3 text-body text-muted">
          Only a ClippyOS admin can connect Grok (or another MCP client) to this workspace.
        </p>
        <Button asChild variant="secondary" className="mt-6 min-h-11 w-full">
          <Link to="/home">Back to ClippyOS</Link>
        </Button>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-section font-semibold tracking-tight">
            <AuroraText>Connect {consent?.clientName || "Grok"}</AuroraText>
          </h1>
          <p className="mt-2 text-body text-muted">
            Allow this client to call ClippyOS tools. Publish still waits on Approvals. Secrets never leave the server.
          </p>
        </div>
        <Badge tone="blue">OAuth</Badge>
      </div>
      {error ? <p className="mb-4 text-caption text-danger">{error}</p> : null}
      <dl className="grid gap-3 rounded-control bg-secondary-surface/60 px-3 py-3 text-caption">
        <div>
          <dt className="text-muted">Client</dt>
          <dd className="mt-0.5 font-medium">{consent?.clientName}</dd>
        </div>
        <div>
          <dt className="text-muted">Returns to</dt>
          <dd className="mt-0.5 break-all font-medium">{consent?.redirectHost}</dd>
        </div>
        <div>
          <dt className="text-muted">Access</dt>
          <dd className="mt-0.5 font-medium">{consent?.scopeLabels || "List tools"}</dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-col gap-2">
        <Button
          className="min-h-11 w-full"
          disabled={decide.isPending}
          onClick={() => decide.mutate("allow")}
        >
          <ShieldCheck className="size-4" aria-hidden="true" />
          {decide.isPending ? "Connecting…" : "Allow access"}
        </Button>
        <Button
          variant="secondary"
          className="min-h-11 w-full"
          disabled={decide.isPending}
          onClick={() => decide.mutate("deny")}
        >
          <ShieldOff className="size-4" aria-hidden="true" />
          Deny
        </Button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-bg px-4 py-10">
      <OrbsBackground />
      <Particles quantity={28} />
      <div className="absolute top-3 right-3 z-20">
        <ThemeToggle />
      </div>
      <GlassCard className="relative z-10 w-full max-w-md overflow-hidden px-6 py-8">
        <ShineBorder />
        <div className="relative z-[1] mb-6 flex items-center gap-3">
          <ClippyMark size={40} />
          <p className="text-caption text-muted">{APP_NAME} MCP</p>
        </div>
        <div className="relative z-[1]">{children}</div>
      </GlassCard>
    </main>
  );
}
