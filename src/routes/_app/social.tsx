import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AIFallbackPanel } from "@/components/ui/ai-fallback-panel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { MachineBar } from "@/components/social/machine-bar";
import { PlatformCards } from "@/components/social/platform-cards";
import { DesktopSurface } from "@/components/social/desktop-surface";
import { UploadForm } from "@/components/social/upload-form";
import { ActivityList } from "@/components/social/activity-list";
import { SOCIAL_QUERY_KEY } from "@/lib/social";
import {
  getSocialSnapshot,
  markPlatformSession,
  openSocialPlatform,
  queueSocialUpload,
  refreshSocialDesktop,
  retrySocialUpload,
  cancelSocialUpload,
  startSocialDesktop,
  stopSocialDesktop,
  updateSocialPostStatus,
} from "@/lib/server/social";
import { userFacingErrorMessage } from "@/lib/errors";
import { SOCIAL_PLATFORMS, type SocialPlatform, type SocialPostStatus } from "@/lib/entities";
import type { PlatformSessionState, YoutubeJobOptions } from "@/lib/social";
import type { SocialPreferredRail } from "@/lib/publishers";
import { GROK_BOT_QUERY_KEY } from "@/lib/grok-bot";
import { getGrokBotStatusFn } from "@/lib/server/grok-bot-fns";

export const Route = createFileRoute("/_app/social")({
  component: SocialPage,
});

function SocialPage() {
  const queryClient = useQueryClient();
  const search = useRouterState({ select: (s) => s.location.search as Record<string, unknown> });
  const mediaAssetId = typeof search.mediaAssetId === "string" ? search.mediaAssetId : undefined;
  const initialPlatforms = useMemo(() => {
    const raw = search.platform ?? search.platforms;
    const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : [];
    return list.filter((item): item is SocialPlatform =>
      SOCIAL_PLATFORMS.includes(item as SocialPlatform),
    );
  }, [search.platform, search.platforms]);
  const initialMode =
    search.mode === "publish" || search.mode === "draft" ? search.mode : undefined;
  const [uploadOpen, setUploadOpen] = useState(Boolean(mediaAssetId));
  const grokQuery = useQuery({
    queryKey: GROK_BOT_QUERY_KEY,
    queryFn: () => getGrokBotStatusFn(),
  });
  const query = useQuery({
    queryKey: SOCIAL_QUERY_KEY,
    queryFn: () => getSocialSnapshot(),
    refetchInterval: (current) => {
      const state = current.state.data?.machine.state;
      const busy = current.state.data?.posts.some(
        (post) => post.status === "running" || post.status === "queued",
      );
      if (state === "starting" || state === "stopping" || busy) return 4000;
      if (state === "running") return 20000;
      return false;
    },
  });

  const start = useMutation({
    mutationFn: () => startSocialDesktop(),
    onSuccess: async (data) => {
      queryClient.setQueryData(SOCIAL_QUERY_KEY, data);
      toast.success("Social Machine started");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const stop = useMutation({
    mutationFn: () => stopSocialDesktop(),
    onSuccess: async (data) => {
      queryClient.setQueryData(SOCIAL_QUERY_KEY, data);
      toast.success("Social Machine hibernated — resume picks up the same Windows session");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const refresh = useMutation({
    mutationFn: () => refreshSocialDesktop(),
    onSuccess: (data) => queryClient.setQueryData(SOCIAL_QUERY_KEY, data),
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const open = useMutation({
    mutationFn: (platform: SocialPlatform) => openSocialPlatform({ data: { platform } }),
    onSuccess: () => toast.success("Opened in the Social Machine"),
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const mark = useMutation({
    mutationFn: (input: { platform: SocialPlatform; state: PlatformSessionState }) =>
      markPlatformSession({ data: input }),
    onSuccess: (data) => queryClient.setQueryData(SOCIAL_QUERY_KEY, data),
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const upload = useMutation({
    mutationFn: (input: {
      clientId: string;
      assetId?: string;
      mediaAssetId?: string;
      platforms: SocialPlatform[];
      caption: string;
      mediaUrl: string | null;
      preferredRail: SocialPreferredRail;
      mode: "draft" | "publish";
      youtube?: YoutubeJobOptions;
    }) => queueSocialUpload({ data: input }),
    onSuccess: (data, input) => {
      queryClient.setQueryData(SOCIAL_QUERY_KEY, data);
      setUploadOpen(false);
      if (input.mode === "draft") {
        toast.message("Upload queued as draft.");
        return;
      }
      const created = data.jobs
        .filter((job) => job.clientId === input.clientId && job.mode === "publish")
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
      toast.message(
        created?.status === "awaiting_approval"
          ? "Waiting for approval before this goes live."
          : "API publish started.",
      );
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const status = useMutation({
    mutationFn: (input: {
      id: string;
      status: Extract<SocialPostStatus, "succeeded" | "failed" | "needs_attention">;
    }) => updateSocialPostStatus({ data: input }),
    onSuccess: (data) => queryClient.setQueryData(SOCIAL_QUERY_KEY, data),
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const retry = useMutation({
    mutationFn: (jobId: string) => retrySocialUpload({ data: { jobId } }),
    onSuccess: (data) => {
      queryClient.setQueryData(SOCIAL_QUERY_KEY, data);
      toast.success("Resuming upload from the last chunk");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const cancel = useMutation({
    mutationFn: (jobId: string) => cancelSocialUpload({ data: { jobId } }),
    onSuccess: (data) => {
      queryClient.setQueryData(SOCIAL_QUERY_KEY, data);
      toast.message("Upload cancelled");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const client of query.data?.clients ?? []) map.set(client.id, client.name);
    return map;
  }, [query.data?.clients]);

  if (query.isPending) {
    return (
      <div className="mx-auto flex max-w-[100rem] flex-col gap-4">
        <PageHeader
          title="Social"
          description="On-demand posting to Instagram, X, and TikTok. Native APIs when connected; the machine stays off until you start it."
        />
        <Skeleton className="h-32 w-full rounded-card" />
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-40 rounded-card" />
          <Skeleton className="h-40 rounded-card" />
          <Skeleton className="h-40 rounded-card" />
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto max-w-[100rem]">
        <PageHeader title="Social" />
        <ErrorState
          className="mt-6"
          title="Couldn’t load Social"
          description="Status couldn’t be read. Try again."
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  const snapshot = query.data;
  const opening = open.isPending ? (open.variables as SocialPlatform | undefined) ?? null : null;

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-4 pb-24 md:pb-8">
      <PageHeader
        title="Social"
        description="On-demand posting to Instagram, X, and TikTok. Native APIs when connected; the machine stays off until you start it."
      />

      {!snapshot.machine.configured && !grokQuery.data?.hasKey ? (
        <AIFallbackPanel
          integration="daytona"
          title="Connect Daytona for Computer Use — or connect publisher APIs / Grok Bot in Settings to post without the machine"
        />
      ) : null}

      <MachineBar
        machine={snapshot.machine}
        onStart={() => start.mutate()}
        onStop={() => stop.mutate()}
        starting={start.isPending}
        stopping={stop.isPending}
      />

      <DesktopSurface
        machine={snapshot.machine}
        onRefresh={() => refresh.mutate()}
        refreshing={refresh.isPending}
      />

      <PlatformCards
        sessions={snapshot.sessions}
        publishers={snapshot.publishers}
        machineState={snapshot.machine.state}
        configured={snapshot.machine.configured}
        onOpen={(platform) => open.mutate(platform)}
        onMark={(platform, state) => mark.mutate({ platform, state })}
        opening={opening}
      />

      <div className="hidden md:block">
        <UploadForm
          clients={snapshot.clients}
          assets={snapshot.assets}
          sessions={snapshot.sessions}
          publishers={snapshot.publishers}
          machineState={snapshot.machine.state}
          configured={snapshot.machine.configured}
          grokBotConnected={Boolean(grokQuery.data?.hasKey && grokQuery.data.enabled)}
          pending={upload.isPending}
          initialMediaAssetId={mediaAssetId}
          initialPlatforms={initialPlatforms}
          initialMode={initialMode}
          onUpload={(input) => upload.mutate(input)}
        />
      </div>

      <ActivityList
        posts={snapshot.posts}
        jobs={snapshot.jobs}
        clientNames={names}
        onStatus={(id, next) => status.mutate({ id, status: next })}
        onResume={(jobId) => retry.mutate(jobId)}
        onCancel={(jobId) => cancel.mutate(jobId)}
        busyJobId={
          retry.isPending ? (retry.variables ?? null) : cancel.isPending ? (cancel.variables ?? null) : null
        }
        performance={snapshot.performance ?? []}
      />

      <div className="fixed inset-x-0 bottom-0 z-20 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
        <Button
          className="w-full"
          onClick={() => setUploadOpen(true)}
          aria-label="Open 1-click upload"
        >
          <Upload className="size-4" aria-hidden="true" />
          1-click upload
        </Button>
      </div>

      <Sheet open={uploadOpen} onOpenChange={setUploadOpen}>
        <SheetContent side="bottom" className="md:hidden">
          <SheetTitle>1-click upload</SheetTitle>
          <SheetDescription>
            Queue Instagram, X, or TikTok without using the desktop stream.
          </SheetDescription>
          <div className="mt-4">
            <UploadForm
              clients={snapshot.clients}
              assets={snapshot.assets}
              sessions={snapshot.sessions}
              publishers={snapshot.publishers}
              machineState={snapshot.machine.state}
              configured={snapshot.machine.configured}
              grokBotConnected={Boolean(grokQuery.data?.hasKey && grokQuery.data.enabled)}
              pending={upload.isPending}
              initialMediaAssetId={mediaAssetId}
              initialPlatforms={initialPlatforms}
              initialMode={initialMode}
              onUpload={(input) => upload.mutate(input)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
