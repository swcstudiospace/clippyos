import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Copy, PlugZap, Unplug } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { copyTextToClipboard } from "@/lib/clipboard";
import { userFacingErrorMessage } from "@/lib/errors";
import { PLATFORM_LABELS, SOCIAL_QUERY_KEY } from "@/lib/social";
import {
  PUBLISHERS_QUERY_KEY,
  TIKTOK_MODE_LABELS,
  type PublisherStatus,
  type TikTokPublisherDetails,
  type YoutubePublisherDetails,
} from "@/lib/publishers";
import {
  disconnectPublisherFn,
  getSocialPublishers,
  savePublisherAppFn,
  selectInstagramAccountFn,
  setTikTokAuditFn,
  setTikTokDomainFn,
  setTikTokModeFn,
  startPublisherOAuthFn,
  testPublisherFn,
  setYoutubePublishDefaultsFn,
} from "@/lib/server/publisher-fns";
import { getLearningPolicyFn } from "@/lib/server/performance-fns";
import { LEARNING_POLICY_KEY } from "@/lib/performance";
import type { SocialPlatform } from "@/lib/entities";

const PROVIDERS: SocialPlatform[] = ["x", "tiktok", "instagram", "youtube"];

const GUIDES: Record<
  SocialPlatform,
  { title: string; time: string; steps: Array<{ title: string; body: string }> }
> = {
  x: {
    title: "X (API publish)",
    time: "~10 min",
    steps: [
      {
        title: "Create a Project and App",
        body: "In the X Developer Portal, create a Project and an App with OAuth 2.0. User-context tokens are required — app-only Bearer tokens cannot post.",
      },
      {
        title: "Set the callback URL",
        body: "Paste the callback URL from this card into User authentication settings. Copy it from the OAuth callback row above.",
      },
      {
        title: "Enable user auth and scopes",
        body: "Enable tweet.read, tweet.write, users.read, media.write, and offline.access.",
      },
      {
        title: "Save, Connect X, Test Connection",
        body: "Paste Client ID and Client Secret, Save, then Connect X. Test verifies the user token without posting. X has no draft API — draft jobs stay local until Publish. Computer Use remains the fallback.",
      },
    ],
  },
  tiktok: {
    title: "TikTok Content Posting API",
    time: "~15 min",
    steps: [
      {
        title: "Create a TikTok app",
        body: "In TikTok for Developers, create an app and add Login Kit plus the Content Posting API product.",
      },
      {
        title: "Set the redirect URL",
        body: "Paste the Agency Admin callback URL from this page into the TikTok app’s redirect URI list.",
      },
      {
        title: "Request scopes",
        body: "Request user.info.basic, video.upload (inbox drafts), and video.publish (Direct Post). Each creator must consent this app.",
      },
      {
        title: "Audit for public Direct Post",
        body: "Until TikTok approves the content posting audit, public Direct Post is usually blocked. Keep default mode on Inbox drafts. Mark Audited here only after TikTok approves the app.",
      },
      {
        title: "Connect the creator account",
        body: "Save the client key and secret, Connect TikTok, then Test Connection. Test never posts. Optional: add a verified domain to allow PULL_FROM_URL instead of chunked upload.",
      },
    ],
  },
  instagram: {
    title: "Instagram (Reels API)",
    time: "~15–20 min",
    steps: [
      {
        title: "Create a Meta app (Business type)",
        body: "In Meta for Developers, create a Business-type app. Development mode only works for role-based test users until App Review.",
      },
      {
        title: "Add Instagram and the redirect URL",
        body: "Add the Instagram product and Facebook Login for Business. Paste the Agency Admin callback URL from this page into Valid OAuth Redirect URIs.",
      },
      {
        title: "Use a professional Instagram account",
        body: "Convert or use a Business or Creator account linked to a Facebook Page. Personal Instagram accounts cannot publish via API — use Computer Use for those logins.",
      },
      {
        title: "Permissions and App Review",
        body: "Request instagram_basic, instagram_content_publish, pages_show_list, and pages_read_engagement. For live traffic beyond testers, complete App Review for instagram_content_publish.",
      },
      {
        title: "Connect and select the IG account",
        body: "Save App ID and App Secret, Connect Instagram, then pick the professional account. Test Connection reads metadata and never publishes.",
      },
    ],
  },
  youtube: {
    title: "YouTube (Publish)",
    time: "~15 min",
    steps: [
      {
        title: "Create a Google Cloud project",
        body: "Enable YouTube Data API v3. This OAuth client is for upload — it is separate from the public Data API key used for analytics.",
      },
      {
        title: "Create an OAuth web client",
        body: "Credentials → OAuth 2.0 Client ID → Web application. Paste the Agency Admin callback URL into Authorized redirect URIs.",
      },
      {
        title: "Sensitive scope + test users",
        body: "youtube.upload is a sensitive scope. Until Google verifies the app, only listed test users can grant it. Request youtube.upload and youtube.readonly.",
      },
      {
        title: "Save, Connect, Test",
        body: "Paste Client ID and Secret, Save, then Connect YouTube. Test lists the channel (channels.list mine=true) and never uploads. Draft jobs land private. Computer Use remains the fallback.",
      },
    ],
  },
};

export function SocialPublishersPanel() {
  const query = useQuery({
    queryKey: PUBLISHERS_QUERY_KEY,
    queryFn: () => getSocialPublishers(),
  });
  const metricsQuery = useQuery({
    queryKey: LEARNING_POLICY_KEY,
    queryFn: () => getLearningPolicyFn(),
  });
  const [guide, setGuide] = useState<SocialPlatform | null>(null);

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-section font-semibold tracking-tight">Social publishers</h2>
          <p className="mt-1 text-body text-muted">
            Native APIs for X, TikTok, Instagram, and YouTube. Computer Use stays the fallback.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {PROVIDERS.map((id) => (
            <Skeleton key={id} className="h-64 w-full rounded-card" />
          ))}
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-section font-semibold tracking-tight">Social publishers</h2>
        <ErrorState
          title="Couldn’t load publishers"
          description="Status couldn’t be read. Try again."
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  const snapshot = query.data;
  const isAdmin = Boolean(snapshot.canEditIntegrations);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-section font-semibold tracking-tight">Social publishers</h2>
        <p className="mt-1 text-body text-muted">
          OAuth tokens stay on the server and are never returned to Hermes. Passwords are never
          stored. Daytona Computer Use remains the login / CAPTCHA rail.
        </p>
      </div>
      <GlassCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-caption font-medium">OAuth callback URL</p>
          <p className="mt-1 break-all font-mono text-caption text-muted">{snapshot.callbackUrl}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={async () => {
            const ok = await copyTextToClipboard(snapshot.callbackUrl);
            toast[ok ? "success" : "error"](ok ? "Callback URL copied" : "Couldn’t copy");
          }}
        >
          <Copy className="size-4" aria-hidden="true" />
          Copy
        </Button>
      </GlassCard>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {PROVIDERS.map((platform) => (
          <PublisherCard
            key={platform}
            platform={platform}
            status={snapshot.publishers[platform]}
            isAdmin={isAdmin}
            igAccounts={snapshot.instagramAccounts}
            tiktokMode={snapshot.tiktokPublishMode}
            tiktok={snapshot.tiktok}
            youtube={snapshot.youtube}
            metricsReady={Boolean(metricsQuery.data?.metricsApi?.[platform])}
            onGuide={() => setGuide(platform)}
          />
        ))}
      </div>
      <Dialog open={guide !== null} onOpenChange={(open) => !open && setGuide(null)}>
        <DialogContent>
          {guide ? (
            <>
              <DialogTitle>{GUIDES[guide].title}</DialogTitle>
              <DialogDescription>{GUIDES[guide].time}</DialogDescription>
              <ol className="mt-4 flex list-decimal flex-col gap-3 pl-4 text-body">
                {GUIDES[guide].steps.map((step) => (
                  <li key={step.title}>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-caption text-muted">{step.body}</p>
                  </li>
                ))}
              </ol>
              {guide === "x" || guide === "tiktok" || guide === "instagram" || guide === "youtube" ? (
                <div className="mt-4 flex flex-col gap-2 rounded-control bg-secondary-surface/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="break-all font-mono text-caption">{snapshot.callbackUrl}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      const ok = await copyTextToClipboard(snapshot.callbackUrl);
                      toast[ok ? "success" : "error"](ok ? "Callback URL copied" : "Couldn’t copy");
                    }}
                  >
                    <Copy className="size-4" aria-hidden="true" />
                    Copy callback
                  </Button>
                </div>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PublisherCard({
  platform,
  status,
  isAdmin,
  igAccounts,
  tiktokMode,
  tiktok,
  youtube,
  metricsReady,
  onGuide,
}: {
  platform: SocialPlatform;
  status: PublisherStatus;
  isAdmin: boolean;
  igAccounts: Array<{
    igUserId: string;
    username: string;
    pageName: string;
    accountType?: "BUSINESS" | "CREATOR" | "UNKNOWN";
  }>;
  tiktokMode: "inbox" | "direct";
  tiktok: TikTokPublisherDetails;
  youtube: YoutubePublisherDetails;
  metricsReady?: boolean;
  onGuide: () => void;
}) {
  const queryClient = useQueryClient();
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { source?: string; ok?: boolean; provider?: string; error?: string };
      if (!data || data.source !== "clippy-social-oauth") return;
      if (data.provider && data.provider !== platform) return;
      void queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
      if (data.ok) toast.success(`${PLATFORM_LABELS[platform]} connected`);
      else toast.error(data.error || "Couldn’t connect");
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [platform, queryClient]);

  const save = useMutation({
    mutationFn: () =>
      savePublisherAppFn({
        data: { provider: platform, clientId, clientSecret },
      }),
    onSuccess: async () => {
      setClientId("");
      setClientSecret("");
      toast.success(`${PLATFORM_LABELS[platform]} app saved`);
      await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const connect = useMutation({
    mutationFn: () => startPublisherOAuthFn({ data: { provider: platform } }),
    onSuccess: async (data) => {
      const popup = window.open(data.url, "clippy-social-oauth", "popup=yes,width=560,height=740");
      if (!popup) {
        const ok = await copyTextToClipboard(data.url);
        toast.message(
          ok
            ? "Pop-up blocked — the connect URL is copied. Open it in a new tab."
            : "Pop-up blocked. Allow pop-ups, then Connect again.",
        );
      }
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const test = useMutation({
    mutationFn: () => testPublisherFn({ data: { provider: platform } }),
    onSuccess: async () => {
      toast.success("Connected");
      await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const disconnect = useMutation({
    mutationFn: () => disconnectPublisherFn({ data: { provider: platform } }),
    onSuccess: async () => {
      toast.success(`${PLATFORM_LABELS[platform]} disconnected`);
      await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const selectIg = useMutation({
    mutationFn: (igUserId: string) => selectInstagramAccountFn({ data: { igUserId } }),
    onSuccess: async () => {
      toast.success("Instagram account selected");
      await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const setMode = useMutation({
    mutationFn: (mode: "inbox" | "direct") => setTikTokModeFn({ data: { mode } }),
    onSuccess: async () => {
      toast.success("TikTok mode saved");
      await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const setAudit = useMutation({
    mutationFn: (status: "UNAUDITED" | "AUDITED" | "UNKNOWN") =>
      setTikTokAuditFn({ data: { status } }),
    onSuccess: async () => {
      toast.success("TikTok audit status saved");
      await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: SOCIAL_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const [domain, setDomain] = useState("");
  const saveDomain = useMutation({
    mutationFn: () => setTikTokDomainFn({ data: { domain } }),
    onSuccess: async () => {
      toast.success("Verified domain saved");
      setDomain("");
      await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  function onSave(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  const tone = status.tokenExpired
    ? "ERROR"
    : status.eligible
      ? "CONNECTED"
      : status.connected || status.appConfigured
        ? "PENDING"
        : "UNKNOWN";
  const label =
    platform === "instagram"
      ? status.tokenExpired
        ? "Token expired"
        : status.eligible
          ? status.handle
            ? `Connected (${status.handle})`
            : "Connected"
          : status.connected
            ? "Select account"
            : status.appConfigured
              ? "Not configured"
              : "Not configured"
      : platform === "x"
      ? status.tokenExpired
        ? "Token expired"
        : status.eligible
          ? "Connected"
          : status.appConfigured
            ? "Not configured"
            : "Not configured"
      : status.eligible
        ? "API ready"
        : status.connected
          ? "Connected"
          : status.appConfigured
            ? "App saved"
            : "Not connected";

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-card font-semibold tracking-tight">
            {platform === "x"
              ? "X (API publish)"
              : platform === "tiktok"
                ? "TikTok (Content Posting API)"
                : platform === "youtube"
                  ? "YouTube (Publish)"
                  : "Instagram (Reels API)"}
          </h3>
          <p className="text-caption text-muted">{status.note}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge tone={statusTone(tone)}>{label}</Badge>
          <Badge tone={metricsReady ? "green" : "neutral"}>
            {metricsReady ? "Metrics API" : "Manual stats"}
          </Badge>
        </div>
      </div>
      <p className="mt-3 text-caption text-muted">
        {status.handle ? `${status.handle} · ` : null}
        {status.last4 ? `app …${status.last4}` : "No app credentials yet"}
      </p>
      {status.reason ? <p className="mt-1 text-caption text-warning">{status.reason}</p> : null}

      {platform === "instagram" ? (
        <p className="mt-3 rounded-control bg-warning/10 px-3 py-2 text-caption text-warning">
          Personal accounts are not supported for API publish — use Browser upload for those logins.
        </p>
      ) : null}

      {isAdmin ? (
        <form className="mt-4 flex flex-col gap-3" onSubmit={onSave}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${platform}-client-id`}>
              {platform === "tiktok" ? "Client key" : "Client ID"}
            </Label>
            <Input
              id={`${platform}-client-id`}
              autoComplete="off"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              placeholder={status.last4 ? `Saved …${status.last4}` : "From the developer portal"}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`${platform}-secret`}>Client secret</Label>
            <Input
              id={`${platform}-secret`}
              type="password"
              autoComplete="off"
              value={clientSecret}
              onChange={(event) => setClientSecret(event.target.value)}
              placeholder="Never shown again"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={save.isPending || !clientId || !clientSecret}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!status.appConfigured || connect.isPending}
              onClick={() => connect.mutate()}
            >
              <PlugZap className="size-4" aria-hidden="true" />
              Connect
              {platform === "x"
                ? " X"
                : platform === "instagram"
                  ? " Instagram"
                  : platform === "tiktok"
                    ? " TikTok"
                    : platform === "youtube"
                      ? " YouTube"
                      : ""}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!status.connected || test.isPending}
              onClick={() => test.mutate()}
            >
              {platform === "x" || platform === "instagram" || platform === "youtube"
                ? "Test Connection"
                : "Test"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onGuide}>
              <BookOpen className="size-4" aria-hidden="true" />
              Setup Guide
            </Button>
            {status.connected || status.appConfigured ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={disconnect.isPending}
                onClick={() => disconnect.mutate()}
              >
                <Unplug className="size-4" aria-hidden="true" />
                Disconnect
              </Button>
            ) : null}
          </div>
        </form>
      ) : (
        <p className="mt-4 text-caption text-muted">Owner can connect publishers.</p>
      )}

      {platform === "instagram" && igAccounts.length > 0 ? (
        <div className="mt-4 flex flex-col gap-1.5">
          <Label htmlFor="ig-account">Professional account</Label>
          <Select
            value={status.accountId ?? undefined}
            onValueChange={(value) => selectIg.mutate(value)}
            disabled={!isAdmin || selectIg.isPending}
          >
            <SelectTrigger id="ig-account" aria-label="Instagram professional account">
              <SelectValue placeholder="Select IG professional account" />
            </SelectTrigger>
            <SelectContent>
              {igAccounts.map((account) => (
                <SelectItem key={account.igUserId} value={account.igUserId}>
                  @{account.username} · {account.pageName}
                  {account.accountType && account.accountType !== "UNKNOWN"
                    ? ` · ${account.accountType === "CREATOR" ? "Creator" : "Business"}`
                    : " · Professional"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {platform === "tiktok" && tiktok.auditStatus !== "AUDITED" ? (
        <p className="mt-3 rounded-control bg-warning/10 px-3 py-2 text-caption text-warning">
          Public Direct Post may be limited — using Upload to inbox (draft) by default.
        </p>
      ) : null}

      {platform === "tiktok" && status.connected ? (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={tiktokMode === "inbox" ? "secondary" : "ghost"}
              aria-pressed={tiktokMode === "inbox"}
              disabled={!isAdmin || setMode.isPending}
              onClick={() => setMode.mutate("inbox")}
            >
              {TIKTOK_MODE_LABELS.UPLOAD_TO_INBOX}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={tiktokMode === "direct" ? "secondary" : "ghost"}
              aria-pressed={tiktokMode === "direct"}
              disabled={!isAdmin || setMode.isPending}
              onClick={() => setMode.mutate("direct")}
            >
              {TIKTOK_MODE_LABELS.DIRECT_POST}
            </Button>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tiktok-audit">Content posting audit</Label>
            <Select
              value={tiktok.auditStatus}
              onValueChange={(value) =>
                setAudit.mutate(value as "UNAUDITED" | "AUDITED" | "UNKNOWN")
              }
              disabled={!isAdmin || setAudit.isPending}
            >
              <SelectTrigger id="tiktok-audit" aria-label="TikTok audit status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNAUDITED">Unaudited — inbox only</SelectItem>
                <SelectItem value="UNKNOWN">Unknown</SelectItem>
                <SelectItem value="AUDITED">Audited — Direct Post allowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tiktok-domain">Verified domain (PULL_FROM_URL)</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="tiktok-domain"
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                placeholder={tiktok.verifiedDomain ?? "cdn.example.com"}
                disabled={!isAdmin}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!isAdmin || saveDomain.isPending}
                onClick={() => saveDomain.mutate()}
              >
                Save domain
              </Button>
            </div>
            <p className="text-caption text-muted">
              Optional. Without a verified domain, clips upload in 5–64 MB chunks instead of a pull URL.
            </p>
          </div>
        </div>
      ) : null}

      {platform === "youtube" && status.connected ? (
        <YoutubeDefaults youtube={youtube} isAdmin={isAdmin} />
      ) : null}
    </GlassCard>
  );
}

function YoutubeDefaults({
  youtube,
  isAdmin,
}: {
  youtube: YoutubePublisherDetails;
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState(youtube.categoryId ?? "22");
  const save = useMutation({
    mutationFn: (input: { categoryId?: string; privacyDefault?: "private" | "unlisted" | "public" }) =>
      setYoutubePublishDefaultsFn({ data: input }),
    onSuccess: async () => {
      toast.success("YouTube defaults saved");
      await queryClient.invalidateQueries({ queryKey: PUBLISHERS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  return (
    <div className="mt-4 flex flex-col gap-3">
      <p className="text-caption text-muted">
        {youtube.channelTitle
          ? `Uploads go to ${youtube.channelTitle}. Per-client channels are phase 2.`
          : "Uploads go to the connected workspace channel."}
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="yt-category">Default category ID</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="yt-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            placeholder="22"
            disabled={!isAdmin}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!isAdmin || save.isPending}
            onClick={() => save.mutate({ categoryId })}
          >
            Save
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="yt-privacy">Default privacy (publish)</Label>
        <Select
          value={youtube.privacyDefault}
          onValueChange={(value) =>
            save.mutate({
              categoryId,
              privacyDefault: value as "private" | "unlisted" | "public",
            })
          }
          disabled={!isAdmin || save.isPending}
        >
          <SelectTrigger id="yt-privacy" aria-label="Default YouTube privacy">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="unlisted">Unlisted (safer default)</SelectItem>
            <SelectItem value="public">Public (still needs approval)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-caption text-muted">
        Draft jobs always upload as private. youtube.upload is a sensitive Google scope — unverified apps
        only work for listed test users.
      </p>
    </div>
  );
}
