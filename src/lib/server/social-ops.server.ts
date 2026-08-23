/**
 * Hermes-facing Social / Daytona operations.
 * Never returns DAYTONA_API_KEY, VNC passwords, cookies, or social passwords.
 * Start is never implied by status/list/read.
 */
import {
  SOCIAL_PLATFORMS,
  type SocialPlatform,
  type SocialPost,
} from "@/lib/entities";
import { sanitizeText } from "@/lib/sanitize";
import { isTrustedImageUrl } from "@/lib/thumbnails";
import { readPlaybookPolicies } from "@/lib/server/autonomy-policy.server";
import { emitAutonomyEvent } from "@/lib/server/autonomy-events.server";
import type { WebhookEventType } from "@/lib/autonomy";
import { readClients } from "@/lib/server/clients";
import {
  ensureComputerUseStack,
  getSocialMachineStatus,
  listSocialWindows,
  openPlatformInMachine,
  setSocialAutoStopMinutes,
  startSocialMachine,
  stopSocialMachine,
  takeSocialScreenshot,
  transferAndOpenUpload,
} from "@/lib/server/daytona.server";
import {
  appendAudit,
  attachPostsToJobs,
  collectAssets,
  insertSocialJob,
  insertSocialPost,
  patchSocialJob,
  patchSocialPost,
  peekSocialHealth,
  readSessions,
  readSocialJobs,
  readSocialPosts,
  runningLock,
  socialNewId,
  socialNowIso,
  writeSessions,
} from "@/lib/server/social";
import {
  SOCIAL_MAX_CONCURRENT_JOBS,
  parseYoutubeJobOptions,
  sessionToHealth,
  toPublicMachineStatus,
  type CostGuard,
  type PlatformHealth,
  type SocialJobView,
  type SocialUploadMode,
  type YoutubeJobOptions,
} from "@/lib/social";
import type { SocialPreferredRail } from "@/lib/publishers";
import { parsePreferredRail } from "@/lib/publishers";
import {
  isTrustedMediaUrl,
  listPublisherStatuses,
  providerFor,
  publishViaApi,
  resolveRail,
  sourceFromProvider,
  type RailComputer,
} from "@/lib/server/social-publish.server";


function asPlatform(value: unknown): SocialPlatform | null {
  return SOCIAL_PLATFORMS.includes(value as SocialPlatform)
    ? (value as SocialPlatform)
    : null;
}

function emitSocial(type: WebhookEventType, entityType: string, entityId: string, data: Record<string, unknown>) {
  void emitAutonomyEvent({ type, entityType, entityId, data });
  void import("@/lib/server/safety-hooks.server")
    .then((mod) => mod.onSocialEvent(type, entityType, entityId, data))
    .catch(() => {});
}

type RailPlan = {
  rails: Map<SocialPlatform, "API" | "BROWSER">;
  computers: Map<SocialPlatform, RailComputer>;
  grokConnected: boolean;
  grokPrefer: boolean;
  fallbackToDaytona: boolean;
  machine: Awaited<ReturnType<typeof getSocialMachineStatus>>;
};

async function planRails(input: {
  platforms: SocialPlatform[];
  preferredRail: SocialPreferredRail;
  fallbackToBrowser: boolean;
  mode: SocialUploadMode;
}): Promise<RailPlan> {
  const grokMod = await import("@/lib/server/grok-bot.server");
  const [machine, publishers, grokConnected, grokPrefer, grokConfig] = await Promise.all([
    getSocialMachineStatus(),
    listPublisherStatuses(),
    grokMod.grokBotIsConnected(),
    grokMod.grokBotShouldTakeComputer(),
    grokMod.readGrokBotConfig(),
  ]);
  const fallbackToDaytona = grokConfig.fallbackToDaytona !== false;
  const rails = new Map<SocialPlatform, "API" | "BROWSER">();
  const computers = new Map<SocialPlatform, RailComputer>();
  for (const platform of input.platforms) {
    try {
      const resolved = await resolveRail({
        platform,
        preferred: input.preferredRail,
        fallbackToBrowser: input.fallbackToBrowser,
        daytonaConfigured: machine.configured,
        machineRunning: machine.state === "running",
        mode: input.mode,
        grokBotConnected: grokConnected,
        grokBotPrefer: grokPrefer,
        fallbackToDaytona,
      });
      rails.set(platform, resolved.rail);
      computers.set(platform, resolved.computer);
    } catch (error) {
      const code = error instanceof Error ? error.message : "NO_PUBLISH_RAIL";
      if (input.preferredRail === "API") {
        throw new Error(code === "PUBLISHER_NOT_ELIGIBLE" ? code : "PUBLISHER_NOT_ELIGIBLE");
      }
      if (input.preferredRail === "GROK_BOT" && !grokConnected && !(fallbackToDaytona && machine.configured)) {
        throw new Error("GROK_BOT_NOT_CONNECTED");
      }
      if (grokConnected && (grokPrefer || !machine.configured || input.preferredRail === "GROK_BOT")) {
        rails.set(platform, "BROWSER");
        computers.set(platform, "grok_bot");
      } else if (machine.configured) {
        rails.set(platform, "BROWSER");
        computers.set(platform, "daytona");
      } else if (publishers[platform].eligible) {
        rails.set(platform, "API");
        computers.set(platform, null);
      } else {
        throw new Error(
          code === "DAYTONA_UNAVAILABLE" || code === "GROK_BOT_NOT_CONNECTED" ? "NO_PUBLISH_RAIL" : code,
        );
      }
    }
  }
  return { rails, computers, grokConnected, grokPrefer, fallbackToDaytona, machine };
}

async function enqueueGrokBotSocialJob(input: {
  actorId: string;
  jobId: string;
  clientId: string;
  clientName: string;
  platforms: SocialPlatform[];
  caption: string | null;
  mediaUrl: string | null;
  assetId: string | null;
  mode: SocialUploadMode;
  existingPosts?: SocialPost[];
}): Promise<void> {
  const grok = await import("@/lib/server/grok-bot.server");
  const stamp = socialNowIso();
  for (const platform of input.platforms) {
    const existing = input.existingPosts?.find((row) => row.platform === platform);
    const id = existing?.id ?? socialNewId();
    if (!existing) {
      await insertSocialPost({
        id,
        client_id: input.clientId,
        platform,
        status: "queued",
        content_ref: input.assetId,
        media_url: input.mediaUrl,
        caption: input.caption,
        external_url: null,
        screenshot_url: null,
        source: "GROK_BOT",
        attention_reason: "Queued for the Grok Bot computer.",
        job_id: input.jobId,
        rail: "BROWSER",
        external_post_id: null,
        created_at: stamp,
        updated_at: stamp,
        created_by: input.actorId,
      });
    } else {
      await patchSocialPost(id, {
        status: "queued",
        source: "GROK_BOT",
        rail: "BROWSER",
        attention_reason: "Queued for the Grok Bot computer.",
      });
    }
  }
  await grok.enqueueGrokBotWork({
    kind: "social_upload",
    title: `Upload ${input.clientName} · ${input.platforms.join(", ")}`,
    brief: `Upload this clip on YOUR computer (not Daytona). Platforms: ${input.platforms.join(", ")}. Mode: ${input.mode}. Caption:\n${input.caption ?? ""}\nMedia: ${input.mediaUrl ?? "(none)"}\nJob ${input.jobId}. After posting, grokbot.complete_work with posts: [{ platform, status, externalUrl }]. If a site needs login, complete_work ok=false error=needs_login.`,
    payload: {
      jobId: input.jobId,
      clientId: input.clientId,
      platforms: input.platforms,
      caption: input.caption,
      mediaUrl: input.mediaUrl,
      assetId: input.assetId,
      mode: input.mode,
    },
  });
}


function deriveJobStatus(posts: SocialPost[]): SocialJobView["status"] {
  if (posts.length === 0) return "queued";
  if (posts.every((row) => row.status === "succeeded")) return "succeeded";
  if (posts.every((row) => row.status === "failed")) return "failed";
  if (posts.some((row) => row.status === "running" || row.status === "queued")) return "running";
  if (posts.some((row) => row.status === "needs_attention")) return "needs_attention";
  if (posts.some((row) => row.status === "succeeded")) return "needs_attention";
  return "failed";
}

async function jobView(id: string): Promise<SocialJobView | null> {
  const [jobs, posts] = await Promise.all([readSocialJobs(), readSocialPosts()]);
  const job = jobs.find((row) => row.id === id);
  if (!job) return null;
  return attachPostsToJobs([job], posts)[0] ?? null;
}

export async function socialGetMachineStatus() {
  const machine = await getSocialMachineStatus();
  return toPublicMachineStatus(machine);
}

export async function socialStartMachine(input: {
  actorId: string;
  waitUntilReady?: boolean;
}) {
  let machine;
  try {
    machine = await startSocialMachine();
  } catch (error) {
    emitSocial("social.machine.error", "social", "social-machine", {
      message: "The Social Machine could not start.",
      at: socialNowIso(),
    });
    throw error;
  }
  if (input.waitUntilReady && machine.state !== "running") {
    for (let i = 0; i < 8; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      machine = await getSocialMachineStatus();
      if (machine.state === "running" || machine.state === "error") break;
    }
  }
  await appendAudit({
    actorId: input.actorId,
    action: "social.start_machine",
    detail: machine.sandboxId ?? "started",
  });
  const at = socialNowIso();
  const opaque = machine.sandboxId ? machine.sandboxId.slice(-8) : "social-machine";
  emitSocial("social.machine.started", "social", opaque, { sandboxIdOpaque: opaque, at });
  emitSocial("social.machine_started", "social", opaque, { state: machine.state, at });
  if (machine.state === "error") {
    emitSocial("social.machine.error", "social", opaque, {
      message: "The Social Machine started in an error state.",
      at,
    });
  }
  return toPublicMachineStatus(machine);
}

export async function socialStopMachine(input: {
  actorId: string;
  reason?: "operator" | "auto_stop" | "force" | "error";
}) {
  const machine = await stopSocialMachine();
  await appendAudit({
    actorId: input.actorId,
    action: "social.stop_machine",
    detail: input.reason ?? "stopped",
  });
  const at = socialNowIso();
  const opaque = machine.sandboxId ? machine.sandboxId.slice(-8) : "social-machine";
  const reason = input.reason ?? "operator";
  emitSocial("social.machine.stopped", "social", opaque, { reason, at });
  emitSocial("social.machine_stopped", "social", opaque, { state: machine.state, reason, at });
  return toPublicMachineStatus(machine);
}

export async function socialSetAutoStop(input: { actorId: string; minutes: number }) {
  const machine = await setSocialAutoStopMinutes(input.minutes);
  await appendAudit({
    actorId: input.actorId,
    action: "social.set_auto_stop",
    detail: String(input.minutes),
  });
  return toPublicMachineStatus(machine);
}

export async function socialEnsureComputerUse(input: { actorId: string }) {
  const result = await ensureComputerUseStack();
  await appendAudit({
    actorId: input.actorId,
    action: "social.ensure_computer_use",
    detail: result.computerUse ? "started" : "unavailable",
  });
  return result;
}

export async function socialGetDesktopPreview() {
  const machine = await getSocialMachineStatus();
  return {
    operatorOnly: true as const,
    available: machine.state === "running" && Boolean(machine.previewUrl),
    message:
      "Desktop preview is operator UI only. Use social.take_screenshot for automation evidence.",
  };
}

export async function socialTakeScreenshot(input: { actorId: string }) {
  const shot = await takeSocialScreenshot();
  await appendAudit({
    actorId: input.actorId,
    action: "social.take_screenshot",
    detail: shot.screenshotRef,
  });
  return {
    screenshotRef: shot.screenshotRef,
    capturedAt: shot.capturedAt,
    mimeType: shot.mimeType,
    dataUrl: shot.dataUrl,
  };
}

export async function socialListOpenWindows() {
  return listSocialWindows();
}

export async function socialListPlatforms(): Promise<{
  platforms: PlatformHealth[];
}> {
  const sessions = await readSessions();
  return {
    platforms: SOCIAL_PLATFORMS.map((platform) => ({
      platform,
      sessionStatus: sessionToHealth(sessions[platform]),
      lastCheckedAt: null,
    })),
  };
}

export async function socialGetPlatformStatus(platformRaw: unknown) {
  const platform = asPlatform(platformRaw);
  if (!platform) throw new Error("VALIDATION");
  const sessions = await readSessions();
  return {
    platform,
    sessionStatus: sessionToHealth(sessions[platform]),
    lastCheckedAt: null,
  };
}

export async function socialMarkPlatformSession(input: {
  actorId: string;
  platform: unknown;
  state: unknown;
}) {
  const platform = asPlatform(input.platform);
  if (!platform) throw new Error("VALIDATION");
  const state =
    input.state === "logged_in" || input.state === "not_logged_in" || input.state === "unknown"
      ? input.state
      : input.state === "needs_login"
        ? "not_logged_in"
        : null;
  if (!state) throw new Error("VALIDATION");
  const sessions = await readSessions();
  sessions[platform] = state;
  await writeSessions(sessions);
  await appendAudit({
    actorId: input.actorId,
    action: "social.mark_platform_session",
    detail: `${platform}:${state}`,
  });
  const checkedAt = socialNowIso();
  if (state === "not_logged_in") {
    emitSocial("social.session.needs_login", "social_platform", platform, {
      platform,
      checkedAt,
    });
  } else if (state === "logged_in") {
    emitSocial("social.session.healthy", "social_platform", platform, {
      platform,
      checkedAt,
    });
  }
  return {
    platform,
    sessionStatus: sessionToHealth(state),
    lastCheckedAt: checkedAt,
  };
}

export async function socialOpenPlatform(input: { actorId: string; platform: unknown }) {
  const platform = asPlatform(input.platform);
  if (!platform) throw new Error("VALIDATION");
  await openPlatformInMachine(platform);
  await appendAudit({
    actorId: input.actorId,
    action: "social.open_platform",
    detail: platform,
  });
  return { ok: true, platform };
}

export async function socialCheckSessionHealth(input: {
  actorId: string;
  platform?: unknown;
}) {
  const machine = await getSocialMachineStatus();
  const sessions = await readSessions();
  const targets = input.platform ? [asPlatform(input.platform)] : [...SOCIAL_PLATFORMS];
  const platforms = targets.filter((row): row is SocialPlatform => Boolean(row));
  if (platforms.length === 0) throw new Error("VALIDATION");

  const results: PlatformHealth[] = [];
  let screenshotRef: string | null = null;
  if (machine.state === "running") {
    try {
      await ensureComputerUseStack();
    } catch {
      /* still report marked sessions */
    }
    for (const platform of platforms) {
      try {
        await openPlatformInMachine(platform);
      } catch {
        /* marked status still returned */
      }
    }
    try {
      const shot = await takeSocialScreenshot();
      screenshotRef = shot.screenshotRef;
    } catch {
      screenshotRef = null;
    }
  }
  const checkedAt = socialNowIso();
  for (const platform of platforms) {
    results.push({
      platform,
      sessionStatus: sessionToHealth(sessions[platform]),
      lastCheckedAt: checkedAt,
    });
  }
  await appendAudit({
    actorId: input.actorId,
    action: "social.check_session_health",
    detail: platforms.join(","),
  });
  for (const row of results) {
    if (row.sessionStatus === "needs_login") {
      emitSocial("social.session.needs_login", "social_platform", row.platform, {
        platform: row.platform,
        checkedAt,
        evidenceScreenshotRef: screenshotRef,
      });
    } else if (row.sessionStatus === "logged_in") {
      emitSocial("social.session.healthy", "social_platform", row.platform, {
        platform: row.platform,
        checkedAt,
      });
    }
  }
  return {
    machineState: machine.state,
    screenshotRef,
    platforms: results,
  };
}

export async function socialListUploadableAssets(clientId?: string) {
  const assets = await collectAssets();
  return {
    assets: clientId ? assets.filter((row) => row.clientId === clientId) : assets,
  };
}

export async function socialResolveAsset(input: { clientId: string; assetId: string }) {
  const assets = await collectAssets();
  const asset = assets.find((row) => row.id === input.assetId);
  if (!asset || asset.clientId !== input.clientId) throw new Error("ASSET_MISSING");
  return { asset, eligible: true };
}

function rollupJob(view: SocialJobView): SocialJobView {
  if (view.status === "cancelled" || view.status === "awaiting_approval") return view;
  const status = deriveJobStatus(view.posts);
  return { ...view, status };
}

export async function socialGetUploadJob(id: string): Promise<SocialJobView> {
  const view = await jobView(id);
  if (!view) throw new Error("JOB_MISSING");
  return rollupJob(view);
}

export async function socialListUploadJobs(filter: {
  clientId?: string;
  platform?: string;
  status?: string;
  since?: string;
}): Promise<{ jobs: SocialJobView[] }> {
  const [jobs, posts] = await Promise.all([readSocialJobs(), readSocialPosts()]);
  let views = attachPostsToJobs(jobs, posts).map(rollupJob);
  if (filter.clientId) views = views.filter((row) => row.clientId === filter.clientId);
  if (filter.platform) {
    views = views.filter((row) => row.platforms.includes(filter.platform as SocialPlatform));
  }
  if (filter.status) views = views.filter((row) => row.status === filter.status);
  if (filter.since) views = views.filter((row) => row.createdAt >= filter.since!);
  return { jobs: views };
}

export async function socialListPosts(filter: {
  clientId?: string;
  platform?: string;
  status?: string;
}): Promise<{ posts: SocialPost[] }> {
  let posts = await readSocialPosts();
  if (filter.clientId) posts = posts.filter((row) => row.clientId === filter.clientId);
  if (filter.platform) posts = posts.filter((row) => row.platform === filter.platform);
  if (filter.status) posts = posts.filter((row) => row.status === filter.status);
  return {
    posts: posts.map((post) => ({
      ...post,
      screenshotUrl: post.screenshotUrl ? "social-desktop-latest" : null,
    })),
  };
}

export async function socialGetPost(id: string) {
  const posts = await readSocialPosts();
  const post = posts.find((row) => row.id === id);
  if (!post) throw new Error("POST_MISSING");
  return {
    ...post,
    screenshotUrl: post.screenshotUrl ? "social-desktop-latest" : null,
  };
}

export async function socialPlanDistribution(input: { clientId: string; assetId?: string }) {
  const policies = await readPlaybookPolicies();
  const [sessions, posts, assets, publishers] = await Promise.all([
    readSessions(),
    readSocialPosts(),
    collectAssets(),
    listPublisherStatuses(),
  ]);
  if (input.assetId) {
    const asset = assets.find((row) => row.id === input.assetId && row.clientId === input.clientId);
    if (!asset) throw new Error("ASSET_MISSING");
  }
  const recommended: SocialPlatform[] = [];
  const rails: Record<SocialPlatform, "API" | "BROWSER" | "skip"> = {
    instagram: "skip",
    x: "skip",
    tiktok: "skip",
    youtube: "skip",
  };
  for (const platform of SOCIAL_PLATFORMS) {
    const session = sessions[platform];
    const apiOk = publishers[platform].eligible;
    if (!apiOk && policies.socialRequireLoggedInPlatformsOnly && session !== "logged_in") {
      rails[platform] = "skip";
      continue;
    }
    const recentFail = posts.some(
      (post) =>
        post.clientId === input.clientId &&
        post.platform === platform &&
        post.status === "failed" &&
        (!input.assetId || post.contentRef === input.assetId),
    );
    if (recentFail && !apiOk) continue;
    recommended.push(platform);
    rails[platform] = apiOk ? "API" : "BROWSER";
  }
  return {
    suggestionOnly: true,
    clientId: input.clientId,
    assetId: input.assetId ?? null,
    recommended,
    preferredRail: "AUTO" as const,
    rails,
    skipped: SOCIAL_PLATFORMS.filter((platform) => !recommended.includes(platform)),
  };
}

export async function socialGetCostGuard(): Promise<CostGuard> {
  const [machine, jobs] = await Promise.all([getSocialMachineStatus(), readSocialJobs()]);
  const policies = await readPlaybookPolicies();
  const activeJobs = jobs.filter((job) => job.status === "running" || job.status === "queued").length;
  const idleMs = policies.socialIdleStopMinutes * 60_000;
  const recommendStop =
    machine.state === "running" &&
    activeJobs === 0 &&
    (machine.runningMs ?? 0) >= Math.max(idleMs, 5 * 60_000);
  return {
    running: machine.state === "running",
    durationMs: machine.runningMs,
    autoStopMinutes: machine.autoStopMinutes,
    activeJobs,
    recommendStop,
  };
}

export async function socialForceStop(input: { actorId: string }) {
  const machine = await getSocialMachineStatus();
  if (machine.state !== "running" && machine.state !== "starting") {
    return { stopped: false, ...toPublicMachineStatus(machine) };
  }
  const stopped = await socialStopMachine({ ...input, reason: "force" });
  return { stopped: true, ...stopped };
}

async function runPlatformsForJob(input: {
  actorId: string;
  jobId: string;
  clientId: string;
  clientName: string;
  platforms: SocialPlatform[];
  caption: string | null;
  mediaUrl: string | null;
  assetId: string | null;
  existingPosts?: SocialPost[];
  preferredRail: SocialPreferredRail;
  fallbackToBrowser: boolean;
  mode: SocialUploadMode;
  youtube?: YoutubeJobOptions | null;
  mediaMeta?: {
    durationSec?: number | null;
    width?: number | null;
    height?: number | null;
    title?: string | null;
  } | null;
}): Promise<void> {
  const sessions = await readSessions();
  const machine = await getSocialMachineStatus();
  runningLock.busy = true;
  try {
    for (const platform of input.platforms) {
      const existing = input.existingPosts?.find((row) => row.platform === platform);
      const id = existing?.id ?? socialNewId();
      const stamp = socialNowIso();
      let rail: "API" | "BROWSER" = "BROWSER";
      try {
        const resolved = await resolveRail({
          platform,
          preferred: input.preferredRail,
          fallbackToBrowser: input.fallbackToBrowser,
          daytonaConfigured: machine.configured,
          machineRunning: machine.state === "running",
          mode: input.mode,
          grokBotConnected: false,
          grokBotPrefer: false,
        });
        rail = resolved.rail;
      } catch {
        if (input.preferredRail === "API") {
          rail = "API";
        } else if (machine.configured) {
          rail = "BROWSER";
        } else {
          throw new Error("NO_PUBLISH_RAIL");
        }
      }

      if (!existing) {
        await insertSocialPost({
          id,
          client_id: input.clientId,
          platform,
          status: "running",
          content_ref: input.assetId,
          media_url: input.mediaUrl,
          caption: input.caption,
          external_url: null,
          screenshot_url: null,
          source: rail === "API" ? sourceFromProvider(providerFor(platform)) : "DAYTONA",
          attention_reason: null,
          job_id: input.jobId,
          rail,
          external_post_id: null,
          created_at: stamp,
          updated_at: stamp,
          created_by: input.actorId,
        });
      } else {
        await patchSocialPost(id, {
          status: "running",
          attention_reason: null,
          rail,
          source: rail === "API" ? sourceFromProvider(providerFor(platform)) : "DAYTONA",
        });
      }

      if (rail === "API") {
        try {
          const published = await publishViaApi(platform, {
            mediaUrl: input.mediaUrl,
            caption: input.caption ?? "",
            mode: input.mode,
            jobId: input.jobId,
            postId: id,
            sessionId: existing?.resumableSessionId ?? null,
            youtube: platform === "youtube" ? input.youtube : null,
            mediaMeta: platform === "youtube" ? input.mediaMeta : null,
            onStatus: async (message) => {
              await patchSocialPost(id, { attention_reason: message });
            },
            onProgress: async (progress) => {
              await patchSocialPost(id, {
                upload_percent: progress.percent,
                upload_phase: progress.phase,
                resumable_session_id: progress.sessionId,
                attention_reason:
                  progress.phase === "uploading"
                    ? `Uploading… ${progress.percent}%`
                    : progress.phase === "processing"
                      ? "Processing media…"
                      : progress.phase === "init"
                        ? "Starting resumable upload…"
                        : "Publishing…",
              });
            },
          });
          await patchSocialPost(id, {
            status: published.status,
            external_url: published.externalUrl,
            external_post_id: published.externalPostId,
            attention_reason: published.reason ?? null,
            rail: "API",
            source: sourceFromProvider(published.provider),
            tiktok_post_mode: published.tiktokPostMode ?? null,
            ig_container_id: published.igContainerId ?? null,
            ...(published.status === "succeeded"
              ? { upload_percent: 100, upload_phase: "publishing" }
              : {}),
          });
          await appendAudit({
            actorId: input.actorId,
            action: "social_upload",
            detail: `${platform}:${input.clientName}:${published.status}:API`,
          });
          if (published.status === "succeeded") {
            emitSocial("social.upload.succeeded", "social_post", id, {
              jobId: input.jobId,
              clientId: input.clientId,
              platform,
              postId: id,
              externalUrl: published.externalUrl,
              externalPostId: published.externalPostId,
              rail: "API",
              provider: published.provider,
              assetRef: input.assetId,
              mode: input.mode,
              tiktokPostMode: published.tiktokPostMode ?? null,
              igContainerId: published.igContainerId ?? null,
              actorId: input.actorId,
            });
            void import("@/lib/server/library-storage.server")
              .then((mod) => mod.pinMediaUrlOnPublish(input.mediaUrl))
              .catch(() => {});
            if (published.externalPostId) {
              void import("@/lib/server/social")
                .then(async (mod) => {
                  const posts = await mod.readSocialPosts();
                  const post = posts.find((row) => row.id === id);
                  if (!post) return;
                  const { onSocialUploadSucceeded } = await import("@/lib/server/performance-fetch.server");
                  await onSocialUploadSucceeded({ post, actorId: input.actorId });
                })
                .catch(() => {});
            }
          } else if (published.status === "needs_attention") {
            emitSocial("social.upload.needs_attention", "social_post", id, {
              jobId: input.jobId,
              clientId: input.clientId,
              platform,
              reason: published.reason,
              rail: "API",
            });
          }
          continue;
        } catch (error) {
          const code = error instanceof Error ? error.message : "PUBLISHER_REJECTED";
          const canFallback =
            !isPermanentXFailure(platform, code) &&
            input.fallbackToBrowser &&
            input.preferredRail !== "API" &&
            machine.configured &&
            machine.state === "running";
          if (!canFallback) {
            await patchSocialPost(id, {
              status: "failed",
              attention_reason: userFacingPublishError(code),
              rail: "API",
            });
            emitSocial("social.upload.failed", "social_post", id, {
              jobId: input.jobId,
              clientId: input.clientId,
              platform,
              errorCode: code,
              rail: "API",
              message: userFacingPublishError(code),
              actorId: input.actorId,
            });
            continue;
          }
          rail = "BROWSER";
          await patchSocialPost(id, {
            rail: "BROWSER",
            source: "DAYTONA",
            attention_reason: "API publish failed — falling back to Computer Use.",
          });
        }
      }

      const needsLogin = sessions[platform] === "not_logged_in";
      try {
        const result = await transferAndOpenUpload({
          platform,
          caption: input.caption,
          mediaUrl: input.mediaUrl,
          postId: id,
        });
        await patchSocialPost(id, {
          status: "needs_attention",
          screenshot_url: result.screenshot,
          rail: "BROWSER",
          source: "DAYTONA",
          attention_reason: needsLogin
            ? `Log into ${platform} in the desktop, then finish the publish.`
            : result.reason,
        });
        await appendAudit({
          actorId: input.actorId,
          action: "social_upload",
          detail: `${platform}:${input.clientName}:needs_attention:BROWSER`,
        });
        emitSocial("social.upload.needs_attention", "social_post", id, {
          jobId: input.jobId,
          clientId: input.clientId,
          platform,
          reason: needsLogin ? "needs_login" : result.reason,
          rail: "BROWSER",
        });
        if (needsLogin) {
          emitSocial("social.session.needs_login", "social_platform", platform, {
            platform,
            checkedAt: socialNowIso(),
            evidenceScreenshotRef: result.screenshot,
          });
        }
      } catch (error) {
        const stopped = error instanceof Error && error.message === "MACHINE_STOPPED";
        await patchSocialPost(id, {
          status: "failed",
          rail: "BROWSER",
          attention_reason: stopped
            ? "The Social Machine stopped before the upload finished."
            : "The upload job failed. Retry after the machine is running, or connect the API publisher.",
        });
        await appendAudit({
          actorId: input.actorId,
          action: "social_upload",
          detail: `${platform}:${input.clientName}:failed:BROWSER`,
        });
        emitSocial("social.upload.failed", "social_post", id, {
          jobId: input.jobId,
          clientId: input.clientId,
          platform,
          errorCode: stopped ? "MACHINE_STOPPED" : "UPLOAD_FAILED",
          rail: "BROWSER",
          message: stopped
            ? "The Social Machine stopped before the upload finished."
            : "The upload job failed.",
        });
        if (stopped) {
          await patchSocialJob(input.jobId, { error_code: "MACHINE_STOPPED" });
        }
      }
    }
  } finally {
    runningLock.busy = false;
  }
  const view = await jobView(input.jobId);
  if (view) {
    const status = deriveJobStatus(view.posts);
    await patchSocialJob(input.jobId, { status });
    void import("@/lib/server/linear.server")
      .then((mod) =>
        mod.notifyLinearOfEntity({
          entityType: "SocialUploadJob",
          entityId: input.jobId,
          status: status.toUpperCase(),
          failed: status === "failed",
          title: `[Social] ${status} — ${view.clientId}`,
          labels: ["social"],
        }),
      )
      .catch(() => {});
    if (status === "needs_attention") {
      emitSocial("social.job_needs_attention", "social_job", input.jobId, {
        clientId: view.clientId,
        status,
      });
    }
    if (status === "succeeded") {
      emitSocial("social.job_completed", "social_job", input.jobId, {
        clientId: view.clientId,
        status,
      });
      for (const post of view.posts) {
        if (post.status !== "succeeded") continue;
        emitSocial("social.upload.succeeded", "social_post", post.id, {
          jobId: input.jobId,
          clientId: view.clientId,
          platform: post.platform,
          postId: post.id,
          externalUrl: post.externalUrl,
          externalPostId: post.externalPostId,
          rail: post.rail,
          provider: post.source,
          assetRef: post.contentRef,
          mode: view.mode,
        });
        if (post.externalPostId) {
          void import("@/lib/server/performance-fetch.server")
            .then((mod) => mod.onSocialUploadSucceeded({ post, actorId: input.actorId }))
            .catch(() => {});
        }
      }
    }
    if (status === "failed") {
      emitSocial("social.job_completed", "social_job", input.jobId, {
        clientId: view.clientId,
        status,
      });
    }
  }
}

function isPermanentXFailure(platform: SocialPlatform, code: string): boolean {
  if (platform === "instagram") {
    return (
      code === "IG_PROFESSIONAL_REQUIRED" ||
      code === "IG_ACCOUNT_MISSING" ||
      code === "IG_MEDIA_UNSUPPORTED" ||
      code === "IG_APP_REVIEW" ||
      code === "MEDIA_TOO_LARGE" ||
      code === "MEDIA_REQUIRED" ||
      code === "UNTRUSTED_IMAGE" ||
      code === "JOB_CANCELLED"
    );
  }
  if (platform === "tiktok") {
    return (
      code === "MEDIA_TOO_LARGE" ||
      code === "MEDIA_REQUIRED" ||
      code === "UNTRUSTED_IMAGE" ||
      code === "TIKTOK_MEDIA_UNSUPPORTED" ||
      code === "JOB_CANCELLED"
    );
  }
  if (platform === "youtube") {
    return (
      code === "MEDIA_TOO_LARGE" ||
      code === "MEDIA_REQUIRED" ||
      code === "UNTRUSTED_IMAGE" ||
      code === "YT_MEDIA_UNSUPPORTED" ||
      code === "YT_INVALID_METADATA" ||
      code === "YOUTUBE_QUOTA" ||
      code === "JOB_CANCELLED"
    );
  }
  if (platform !== "x") return false;
  return (
    code === "MEDIA_TOO_LARGE" ||
    code === "MEDIA_REQUIRED" ||
    code === "UNTRUSTED_IMAGE" ||
    code === "X_MEDIA_UNSUPPORTED" ||
    /must be \d+ MB or smaller/i.test(code) ||
    /not a supported X media type/i.test(code) ||
    code === "JOB_CANCELLED"
  );
}

function userFacingPublishError(code: string): string {
  switch (code) {
    case "PUBLISHER_NOT_CONNECTED":
    case "PUBLISHER_NOT_ELIGIBLE":
      return "That platform isn’t connected for API publishing.";
    case "PUBLISHER_TOKEN_EXPIRED":
      return "The platform token expired. Reconnect in Settings.";
    case "IG_PROFESSIONAL_REQUIRED":
      return "Instagram API publishing needs a professional account.";
    case "IG_APP_REVIEW":
      return "Instagram needs App Review for content publish, or this app is still in Development mode (test users only).";
    case "IG_CONTAINER_FAILED":
      return "Instagram couldn’t finish processing the Reel. Re-encode as MP4 ~9:16 and try again.";
    case "IG_MEDIA_UNSUPPORTED":
      return "Instagram Reels need a short MP4 video. Photos stay on Computer Use.";
    case "TIKTOK_AUDIT_REQUIRED":
      return "TikTok rejected Direct Post (app audit). Inbox draft or browser rail still work.";
    case "TIKTOK_MEDIA_UNSUPPORTED":
      return "TikTok API publishing needs an MP4 (or QuickTime) video.";
    case "IG_PUBLIC_URL_REQUIRED":
      return "Instagram API needs a public HTTPS media URL.";
    case "MEDIA_REQUIRED":
    case "MEDIA_FETCH_FAILED":
    case "MEDIA_TOO_LARGE":
      return "The media file couldn’t be sent to the platform API.";
    case "X_MEDIA_UNSUPPORTED":
      return "X only accepts images (JPEG/PNG/WebP), GIFs, or MP4 video.";
    case "YOUTUBE_QUOTA":
      return "YouTube API quota is exhausted. Wait for the daily reset, or use Computer Use.";
    case "YT_INVALID_METADATA":
      return "YouTube rejected the title, description, or tags.";
    case "YT_MEDIA_UNSUPPORTED":
      return "YouTube API upload needs an MP4 video.";
    case "PUBLISHER_RATE_LIMIT":
      return "Capacity — retrying. The platform rate-limited this publish.";
    case "PUBLISHER_REJECTED":
      return "The platform rejected the publish. Try the browser rail or check the asset.";
    case "JOB_CANCELLED":
      return "That upload was cancelled.";
    case "UPLOAD_SESSION_MISSING":
      return "The resumable upload session expired. Retry to start a new transfer.";
    default:
      if (/must be \d+ MB or smaller/i.test(code)) return code;
      return "API publish failed. The browser rail can still be used if Daytona is running.";
  }
}

export async function socialGetPublisherStatus() {
  const [publishers, machine, sessions] = await Promise.all([
    listPublisherStatuses(),
    getSocialMachineStatus(),
    readSessions(),
  ]);
  return {
    publishers: SOCIAL_PLATFORMS.map((platform) => ({
      ...publishers[platform],
      configured: publishers[platform].appConfigured || publishers[platform].connected,
      username: publishers[platform].handle,
      eligible: publishers[platform].eligible,
      browserSession: sessionToHealth(sessions[platform]),
      machineState: machine.state,
      recommendedRail:
        publishers[platform].eligible ? "API" : machine.configured ? "BROWSER" : "unavailable",
    })),
    tiktok: {
      configured: publishers.tiktok.appConfigured && publishers.tiktok.connected,
      openId: publishers.tiktok.tiktok?.openId ?? publishers.tiktok.accountId,
      postModeDefault: publishers.tiktok.tiktok?.postModeDefault ?? "UPLOAD_TO_INBOX",
      auditStatus: publishers.tiktok.tiktok?.auditStatus ?? "UNAUDITED",
      eligibleDirectPost: Boolean(publishers.tiktok.tiktok?.eligibleDirectPost),
      eligibleInbox: Boolean(publishers.tiktok.tiktok?.eligibleInbox),
    },
    instagram: {
      configured: publishers.instagram.appConfigured && publishers.instagram.connected,
      username: publishers.instagram.handle,
      igUserId: publishers.instagram.instagram?.igUserId ?? publishers.instagram.accountId,
      accountType: publishers.instagram.instagram?.accountType ?? "UNKNOWN",
      eligibleReelsPublish: Boolean(publishers.instagram.instagram?.eligibleReelsPublish),
    },
    youtube: {
      configured: publishers.youtube.appConfigured && publishers.youtube.connected,
      channelId: publishers.youtube.youtube?.channelId ?? publishers.youtube.accountId,
      channelTitle: publishers.youtube.youtube?.channelTitle ?? publishers.youtube.handle,
      eligible: publishers.youtube.eligible,
    },
    notes: {
      instagram:
        "Instagram API rail is Reels publish for professional accounts only. Draft mode does not publish to IG via Graph.",
      tiktok:
        "TikTok uses Content Posting API when connected. Draft jobs go to inbox. Public Direct Post needs an audited app — unaudited publish is forced to inbox, not a public post.",
      x: "X uses the official API when connected (user OAuth). Draft jobs stay local — X has no draft API. Otherwise Computer Use.",
      youtube:
        "YouTube uses Data API v3 resumable upload when connected. Draft jobs land private. Publish default is unlisted unless you set public (still gated by approvals). Per-client OAuth is phase 2 — v1 uploads go to the workspace publish channel.",
    },
  };
}

export async function createUploadJobInternal(input: {
  actorId: string;
  clientId: string;
  assetId?: string;
  mediaAssetId?: string;
  platforms: SocialPlatform[];
  caption?: string;
  mediaUrl?: string | null;
  mode?: SocialUploadMode;
  idempotencyKey?: string;
  allowAutoStart: boolean;
  requireLoggedIn: boolean;
  preferredRail?: SocialPreferredRail;
  fallbackToBrowser?: boolean;
  youtube?: YoutubeJobOptions | null;
}): Promise<SocialJobView> {
  const policies = await readPlaybookPolicies();
  const allowAutoStart = input.allowAutoStart || policies.socialAutoStartForUpload;
  const requireLoggedIn = input.requireLoggedIn || policies.socialRequireLoggedInPlatformsOnly;
  const mode: SocialUploadMode = input.mode ?? policies.socialDefaultUploadMode;
  const preferredRail: SocialPreferredRail = input.preferredRail ?? "AUTO";
  const fallbackToBrowser = input.fallbackToBrowser ?? preferredRail !== "API";

  if (input.idempotencyKey) {
    const existing = (await readSocialJobs()).find(
      (row) => row.idempotencyKey === input.idempotencyKey,
    );
    if (existing) {
      const view = await jobView(existing.id);
      if (view) return rollupJob(view);
    }
  }

  const jobs = await readSocialJobs();
  const active = jobs.filter((job) => job.status === "running" || job.status === "queued").length;
  if (runningLock.busy || active >= SOCIAL_MAX_CONCURRENT_JOBS) {
    throw new Error("UPLOAD_IN_PROGRESS");
  }

  const clients = await readClients();
  const client = clients.find((row) => row.id === input.clientId && !row.deletedAt);
  if (!client) throw new Error("CLIENT_MISSING");

  const assets = await collectAssets();
  const asset = input.assetId ? assets.find((row) => row.id === input.assetId) : null;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (
    input.assetId &&
    !input.mediaAssetId &&
    !uuid.test(input.assetId) &&
    (!asset || asset.clientId !== input.clientId)
  ) {
    throw new Error("ASSET_MISSING");
  }
  let mediaUrl = (input.mediaUrl ?? asset?.mediaUrl ?? null)?.trim() || null;
  let libraryAssetId: string | null = input.mediaAssetId ?? null;
  if (!libraryAssetId && input.assetId && uuid.test(input.assetId)) libraryAssetId = input.assetId;
  if (libraryAssetId) {
    const { resolvePublishAsset } = await import("@/lib/server/library-pipeline.server");
    const resolved = await resolvePublishAsset({
      mediaAssetId: libraryAssetId,
      clientId: input.clientId,
      platforms: input.platforms,
    });
    libraryAssetId = resolved.asset.id;
    mediaUrl = resolved.mediaUrl ?? mediaUrl;
  }
  if (mediaUrl && !isTrustedMediaUrl(mediaUrl) && !isTrustedImageUrl(mediaUrl)) {
    throw new Error("UNTRUSTED_IMAGE");
  }
  const caption = sanitizeText((input.caption ?? asset?.caption ?? "").slice(0, 2200));
  let youtube = input.youtube ?? null;
  if (youtube?.thumbAssetId && !youtube.thumbUrl) {
    try {
      const { resolvePublishAsset } = await import("@/lib/server/library-pipeline.server");
      const thumb = await resolvePublishAsset({
        mediaAssetId: youtube.thumbAssetId,
        clientId: input.clientId,
      });
      youtube = { ...youtube, thumbUrl: thumb.mediaUrl };
    } catch {
      /* optional thumbnail */
    }
  }
  let mediaMeta: {
    durationSec?: number | null;
    width?: number | null;
    height?: number | null;
    title?: string | null;
  } | null = null;
  if (libraryAssetId) {
    try {
      const { getAsset } = await import("@/lib/server/library.server");
      const lib = await getAsset(libraryAssetId);
      if (lib) {
        mediaMeta = {
          durationSec: lib.durationSec,
          width: lib.width,
          height: lib.height,
          title: lib.title,
        };
      }
    } catch {
      /* optional */
    }
  }

  let platforms = input.platforms.filter((platform) => SOCIAL_PLATFORMS.includes(platform));
  if (platforms.length === 0) throw new Error("VALIDATION");

  const sessions = await readSessions();
  const plan = await planRails({ platforms, preferredRail, fallbackToBrowser, mode });
  const { rails, computers, machine } = plan;

  if (requireLoggedIn) {
    const blocked = platforms.filter(
      (platform) => computers.get(platform) === "daytona" && sessions[platform] === "not_logged_in",
    );
    platforms = platforms.filter((platform) => !blocked.includes(platform));
    if (platforms.length === 0) throw new Error("PLATFORM_NEEDS_LOGIN");
  }

  const grokPlatforms = () => platforms.filter((platform) => computers.get(platform) === "grok_bot");
  let localPlatforms = platforms.filter((platform) => computers.get(platform) !== "grok_bot");
  const needsDaytona = () => localPlatforms.some((platform) => computers.get(platform) === "daytona");
  const apiEligible = () => localPlatforms.some((platform) => rails.get(platform) === "API");

  if (mode === "publish") {
    const { readApprovalPolicy } = await import("@/lib/server/approvals.server");
    const { requiresSocialPublishApproval } = await import("@/lib/safety");
    const policy = await readApprovalPolicy();
    if (requiresSocialPublishApproval(policy, platforms)) {
      const id = socialNewId();
      const stamp = socialNowIso();
      await insertSocialJob({
        id,
        client_id: input.clientId,
        asset_id: libraryAssetId ?? asset?.id ?? null,
        media_asset_id: libraryAssetId,
        caption: caption || null,
        mode,
        status: "awaiting_approval",
        platforms: JSON.stringify(platforms),
        idempotency_key: input.idempotencyKey ?? null,
        error_code: "AWAITING_APPROVAL",
        preferred_rail: preferredRail,
        fallback_to_browser: fallbackToBrowser ? "1" : "0",
        options: youtube ? JSON.stringify(youtube) : null,
        created_at: stamp,
        updated_at: stamp,
        created_by: input.actorId,
      });
      const { createApprovalRequest } = await import("@/lib/server/approvals.server");
      await createApprovalRequest({
        clientId: input.clientId,
        type: "PUBLISH_SOCIAL",
        resourceType: "SocialUploadJob",
        resourceId: id,
        title: `Publish ${client.name}`,
        summary: `${platforms.join(", ")} · ${caption ? caption.slice(0, 80) : "No caption"}`,
        payload: {
          platforms,
          caption: caption || null,
          mediaUrl,
          mediaAssetId: libraryAssetId,
          assetId: libraryAssetId ?? asset?.id ?? null,
          preferredRail,
          fallbackToBrowser,
          mode,
          clientName: client.name,
          ytTitle: youtube?.title ?? null,
          ytDescription: youtube?.description ?? null,
          ytTags: youtube?.tags ?? null,
          ytPrivacy: youtube?.privacyStatus ?? null,
          ytMarkShorts: youtube?.markShorts ?? null,
          ytThumbAssetId: youtube?.thumbAssetId ?? null,
          ytThumbUrl: youtube?.thumbUrl ?? null,
          ytCategoryId: youtube?.categoryId ?? null,
        },
        requestedBy: input.actorId,
      });
      emitSocial("social.job_created", "social_job", id, {
        clientId: input.clientId,
        platforms,
        mode,
        preferredRail,
        awaitingApproval: true,
        actorId: input.actorId,
      });
      await appendAudit({
        actorId: input.actorId,
        action: "social.create_upload_job",
        detail: `${input.clientId}:${platforms.join(",")}:awaiting_approval`,
      });
      const view = await jobView(id);
      if (!view) throw new Error("JOB_MISSING");
      return rollupJob(view);
    }
  }

  if (needsDaytona() && !machine.configured) {
    if (apiEligible()) {
      localPlatforms = localPlatforms.filter((platform) => rails.get(platform) === "API");
    } else if (grokPlatforms().length === 0) {
      throw new Error("DAYTONA_UNAVAILABLE");
    } else {
      localPlatforms = [];
    }
    platforms = [...grokPlatforms(), ...localPlatforms];
  }

  if (needsDaytona() && machine.state !== "running" && machine.state !== "starting") {
    if (allowAutoStart && machine.configured) {
      await startSocialMachine();
    } else if (!apiEligible() && grokPlatforms().length === 0) {
      throw new Error("MACHINE_STOPPED");
    } else if (!apiEligible()) {
      localPlatforms = localPlatforms.filter((platform) => rails.get(platform) === "API");
      platforms = [...grokPlatforms(), ...localPlatforms];
    }
  }

  if (platforms.length === 0) throw new Error("NO_PUBLISH_RAIL");

  const id = socialNewId();
  const stamp = socialNowIso();
  await insertSocialJob({
    id,
    client_id: input.clientId,
    asset_id: libraryAssetId ?? asset?.id ?? null,
    media_asset_id: libraryAssetId,
    caption: caption || null,
    mode,
    status: "running",
    platforms: JSON.stringify(platforms),
    idempotency_key: input.idempotencyKey ?? null,
    error_code: null,
    preferred_rail: preferredRail,
    fallback_to_browser: fallbackToBrowser ? "1" : "0",
    options: youtube ? JSON.stringify(youtube) : null,
    created_at: stamp,
    updated_at: stamp,
    created_by: input.actorId,
  });
  emitSocial("social.job_created", "social_job", id, {
    clientId: input.clientId,
    platforms,
    mode,
    preferredRail,
  });
  await appendAudit({
    actorId: input.actorId,
    action: "social.create_upload_job",
    detail: `${input.clientId}:${platforms.join(",")}:${preferredRail}`,
  });
  await writeAuditStart(input.actorId, id, platforms);

  const grokNow = grokPlatforms();
  if (grokNow.length) {
    await enqueueGrokBotSocialJob({
      actorId: input.actorId,
      jobId: id,
      clientId: input.clientId,
      clientName: client.name,
      platforms: grokNow,
      caption: caption || null,
      mediaUrl,
      assetId: libraryAssetId ?? asset?.id ?? null,
      mode,
    });
  }

  if (localPlatforms.length) {
    await runPlatformsForJob({
      actorId: input.actorId,
      jobId: id,
      clientId: input.clientId,
      clientName: client.name,
      platforms: localPlatforms,
      caption: caption || null,
      mediaUrl,
      assetId: libraryAssetId ?? asset?.id ?? null,
      preferredRail,
      fallbackToBrowser,
      mode,
      youtube,
      mediaMeta,
    });
  }

  const view = await jobView(id);
  if (!view) throw new Error("JOB_MISSING");
  return rollupJob(view);
}

export async function resumeUploadJobAfterApproval(input: {
  actorId: string;
  jobId: string;
  payload: import("@/lib/safety").JsonRecord;
}): Promise<SocialJobView> {
  const view = await jobView(input.jobId);
  if (!view) throw new Error("JOB_MISSING");
  if (view.status !== "awaiting_approval") return rollupJob(view);

  const platforms = view.platforms;
  const caption =
    typeof input.payload.caption === "string" ? input.payload.caption : view.caption;
  const mediaUrl = typeof input.payload.mediaUrl === "string" ? input.payload.mediaUrl : null;
  const assetId =
    typeof input.payload.assetId === "string"
      ? input.payload.assetId
      : typeof input.payload.mediaAssetId === "string"
        ? input.payload.mediaAssetId
        : view.assetId;
  const preferredRail = view.preferredRail ?? "AUTO";
  const fallbackToBrowser = view.fallbackToBrowser ?? preferredRail !== "API";
  const mode = view.mode;
  const youtube = view.youtube ?? parseYoutubeJobOptions(input.payload);
  const clientName =
    typeof input.payload.clientName === "string" ? input.payload.clientName : view.clientId;

  const plan = await planRails({ platforms, preferredRail, fallbackToBrowser, mode });
  const grokPlatforms = platforms.filter((platform) => plan.computers.get(platform) === "grok_bot");
  let localPlatforms = platforms.filter((platform) => plan.computers.get(platform) !== "grok_bot");
  const needsDaytona = localPlatforms.some((platform) => plan.computers.get(platform) === "daytona");
  if (needsDaytona && plan.machine.state !== "running" && plan.machine.state !== "starting") {
    const policies = await readPlaybookPolicies();
    if (policies.socialAutoStartForUpload && plan.machine.configured) {
      await startSocialMachine();
    } else {
      localPlatforms = localPlatforms.filter((platform) => plan.rails.get(platform) === "API");
    }
  }

  await patchSocialJob(view.id, { status: "running", error_code: null });
  await writeAuditStart(input.actorId, view.id, platforms);
  if (grokPlatforms.length) {
    await enqueueGrokBotSocialJob({
      actorId: input.actorId,
      jobId: view.id,
      clientId: view.clientId,
      clientName,
      platforms: grokPlatforms,
      caption,
      mediaUrl,
      assetId,
      mode,
    });
  }
  if (localPlatforms.length) {
    await runPlatformsForJob({
      actorId: input.actorId,
      jobId: view.id,
      clientId: view.clientId,
      clientName,
      platforms: localPlatforms,
      caption,
      mediaUrl,
      assetId,
      preferredRail,
      fallbackToBrowser,
      mode,
      youtube,
    });
  }
  const next = await jobView(view.id);
  if (!next) throw new Error("JOB_MISSING");
  return rollupJob(next);
}

async function writeAuditStart(actorId: string, jobId: string, platforms: SocialPlatform[]) {
  await appendAudit({
    actorId,
    action: "social.publish.started",
    detail: `${jobId}:${platforms.join(",")}`,
  });
  const { writeAuditEvent } = await import("@/lib/server/audit.server");
  await writeAuditEvent({
    actorUserId: actorId,
    actorType: actorId.startsWith("agent:") ? "HERMES" : "USER",
    action: "social.publish.started",
    entityType: "social_job",
    entityId: jobId,
    jobId,
    summary: `Publish started for ${platforms.join(", ")}`,
    metadata: { platforms },
  });
}

export async function rejectUploadJobAfterApproval(input: {
  actorId: string;
  jobId: string;
  note?: string | null;
}): Promise<SocialJobView> {
  const view = await jobView(input.jobId);
  if (!view) throw new Error("JOB_MISSING");
  await patchSocialJob(view.id, { status: "cancelled", error_code: "REJECTED" });
  await appendAudit({
    actorId: input.actorId,
    action: "social.publish.rejected",
    detail: input.note ?? view.id,
  });
  const next = await jobView(view.id);
  if (!next) throw new Error("JOB_MISSING");
  return { ...next, status: "cancelled" as const };
}

export async function socialRetryUploadJob(input: { actorId: string; jobId: string }) {
  const policies = await readPlaybookPolicies();
  const view = await jobView(input.jobId);
  if (!view) throw new Error("JOB_MISSING");
  if (view.status === "cancelled") throw new Error("JOB_CANCELLED");
  if (view.status === "awaiting_approval") throw new Error("AWAITING_APPROVAL");
  const failed = view.posts.filter(
    (post) => post.status === "failed" || post.status === "needs_attention",
  );
  if (failed.length === 0) return rollupJob(view);
  const preferredRail = view.preferredRail ?? "AUTO";
  const fallbackToBrowser = view.fallbackToBrowser ?? preferredRail !== "API";
  const failedPlatforms = failed.map((post) => post.platform);
  const plan = await planRails({
    platforms: failedPlatforms,
    preferredRail,
    fallbackToBrowser,
    mode: view.mode,
  });
  const grokPlatforms = failedPlatforms.filter((platform) => plan.computers.get(platform) === "grok_bot");
  let localPlatforms = failedPlatforms.filter((platform) => plan.computers.get(platform) !== "grok_bot");
  const needsDaytona = localPlatforms.some((platform) => plan.computers.get(platform) === "daytona");
  if (needsDaytona && plan.machine.state !== "running" && plan.machine.state !== "starting") {
    if (!policies.socialAutoStartForUpload || !plan.machine.configured) {
      const anyApi = localPlatforms.some((platform) => plan.rails.get(platform) === "API");
      if (!anyApi && grokPlatforms.length === 0) throw new Error("MACHINE_STOPPED");
      localPlatforms = localPlatforms.filter((platform) => plan.rails.get(platform) === "API");
    } else {
      await startSocialMachine();
    }
  }
  const clients = await readClients();
  const client = clients.find((row) => row.id === view.clientId);
  await patchSocialJob(view.id, { status: "running", error_code: null });
  if (grokPlatforms.length) {
    await enqueueGrokBotSocialJob({
      actorId: input.actorId,
      jobId: view.id,
      clientId: view.clientId,
      clientName: client?.name ?? view.clientId,
      platforms: grokPlatforms,
      caption: view.caption,
      mediaUrl: failed[0]?.mediaUrl ?? null,
      assetId: view.assetId,
      mode: view.mode,
      existingPosts: failed.filter((post) => grokPlatforms.includes(post.platform)),
    });
  }
  if (localPlatforms.length) {
    await runPlatformsForJob({
      actorId: input.actorId,
      jobId: view.id,
      clientId: view.clientId,
      clientName: client?.name ?? view.clientId,
      platforms: localPlatforms,
      caption: view.caption,
      mediaUrl: failed[0]?.mediaUrl ?? null,
      assetId: view.assetId,
      existingPosts: failed.filter((post) => localPlatforms.includes(post.platform)),
      preferredRail,
      fallbackToBrowser,
      mode: view.mode,
      youtube: view.youtube,
    });
  }
  const next = await jobView(view.id);
  if (!next) throw new Error("JOB_MISSING");
  return rollupJob(next);
}

export async function socialCancelUploadJob(input: { actorId: string; jobId: string }) {
  const view = await jobView(input.jobId);
  if (!view) throw new Error("JOB_MISSING");
  if (view.status === "succeeded" || view.status === "cancelled") return rollupJob(view);
  const { cancelChunkedUploadsForJob } = await import("@/lib/server/chunked-upload.server");
  await cancelChunkedUploadsForJob(input.jobId);
  try {
    const grok = await import("@/lib/server/grok-bot.server");
    await grok.cancelGrokBotWorkByPayload("jobId", view.id);
  } catch {
    /* optional */
  }
  for (const post of view.posts) {
    if (post.status === "queued" || post.status === "running") {
      await patchSocialPost(post.id, {
        status: "failed",
        attention_reason: "Cancelled by operator or agent.",
      });
    }
  }
  await patchSocialJob(view.id, { status: "cancelled", error_code: "CANCELLED" });
  await appendAudit({
    actorId: input.actorId,
    action: "social.cancel_upload_job",
    detail: view.id,
  });
  try {
    const { cancelApprovalsForResource } = await import("@/lib/server/approvals.server");
    await cancelApprovalsForResource("SocialUploadJob", view.id);
  } catch {
    /* optional */
  }
  const next = await jobView(view.id);
  if (!next) throw new Error("JOB_MISSING");
  return { ...next, status: "cancelled" as const };
}

export async function socialBulkCreateUploadJobs(input: {
  actorId: string;
  jobs: Array<{
    clientId: string;
    assetId?: string;
    platforms: SocialPlatform[];
    caption?: string;
    mode?: SocialUploadMode;
    idempotencyKey?: string;
    preferredRail?: SocialPreferredRail;
    fallbackToBrowser?: boolean;
  }>;
}) {
  const policies = await readPlaybookPolicies();
  const batch = input.jobs.slice(0, policies.socialMaxBulkJobsPerRun);
  const created: SocialJobView[] = [];
  const errors: Array<{ index: number; code: string }> = [];
  for (let i = 0; i < batch.length; i += 1) {
    const row = batch[i];
    try {
      const job = await createUploadJobInternal({
        actorId: input.actorId,
        clientId: row.clientId,
        assetId: row.assetId,
        platforms: row.platforms,
        caption: row.caption,
        mode: row.mode,
        idempotencyKey: row.idempotencyKey,
        allowAutoStart: policies.socialAutoStartForUpload,
        requireLoggedIn: policies.socialRequireLoggedInPlatformsOnly,
        preferredRail: row.preferredRail ?? "AUTO",
        fallbackToBrowser: row.fallbackToBrowser,
      });
      created.push(job);
    } catch (error) {
      errors.push({
        index: i,
        code: error instanceof Error ? error.message.slice(0, 80) : "UPLOAD_FAILED",
      });
    }
  }
  return {
    jobs: created,
    skipped: input.jobs.length - batch.length,
    errors,
    maxBatch: policies.socialMaxBulkJobsPerRun,
  };
}

export { peekSocialHealth };

function platformsFrom(payload: Record<string, unknown>): SocialPlatform[] {
  const raw = payload.platforms;
  if (!Array.isArray(raw)) return [];
  return raw.map(asPlatform).filter((row): row is SocialPlatform => Boolean(row));
}

function preferredRailFrom(payload: Record<string, unknown>): SocialPreferredRail {
  return parsePreferredRail(payload.preferredRail ?? payload.preferred_rail);
}

export async function handleSocialAction(
  action: string,
  payload: Record<string, unknown>,
  actorId: string,
): Promise<unknown | undefined> {
  switch (action) {
    case "social.get_machine_status":
      return socialGetMachineStatus();
    case "social.start_machine":
      return socialStartMachine({
        actorId,
        waitUntilReady: payload.waitUntilReady === true,
      });
    case "social.stop_machine":
      return socialStopMachine({ actorId });
    case "social.set_auto_stop": {
      const minutes = Number(payload.minutes ?? payload.autoStopMinutes);
      if (!Number.isFinite(minutes)) throw new Error("VALIDATION");
      return socialSetAutoStop({ actorId, minutes });
    }
    case "social.ensure_computer_use":
      return socialEnsureComputerUse({ actorId });
    case "social.get_desktop_preview":
      return socialGetDesktopPreview();
    case "social.take_screenshot":
      return socialTakeScreenshot({ actorId });
    case "social.list_open_windows":
      return socialListOpenWindows();
    case "social.list_platforms":
      return socialListPlatforms();
    case "social.get_publisher_status":
      return socialGetPublisherStatus();
    case "social.get_platform_status":
      return socialGetPlatformStatus(payload.platform ?? payload.id);
    case "social.mark_platform_session":
      return socialMarkPlatformSession({
        actorId,
        platform: payload.platform ?? payload.id,
        state: payload.state ?? payload.sessionStatus,
      });
    case "social.open_platform":
      return socialOpenPlatform({ actorId, platform: payload.platform ?? payload.id });
    case "social.check_session_health":
      return socialCheckSessionHealth({ actorId, platform: payload.platform });
    case "social.list_uploadable_assets":
      return socialListUploadableAssets(
        typeof payload.clientId === "string" ? payload.clientId : undefined,
      );
    case "social.resolve_asset": {
      const clientId = String(payload.clientId ?? "");
      const assetId = String(payload.assetId ?? payload.id ?? "");
      if (!clientId || !assetId) throw new Error("VALIDATION");
      return socialResolveAsset({ clientId, assetId });
    }
    case "social.create_upload_job": {
      let clientId = String(payload.clientId ?? "");
      if (!clientId && typeof payload.mediaAssetId === "string") {
        const { getAsset } = await import("@/lib/server/library.server");
        const asset = await getAsset(payload.mediaAssetId);
        clientId = asset?.clientId ?? "";
      }
      const platforms = platformsFrom(payload);
      if (!clientId || platforms.length === 0) throw new Error("VALIDATION");
      const policies = await readPlaybookPolicies();
      return createUploadJobInternal({
        actorId,
        clientId,
        assetId: typeof payload.assetId === "string" ? payload.assetId : undefined,
        mediaAssetId: typeof payload.mediaAssetId === "string" ? payload.mediaAssetId : undefined,
        platforms,
        caption: typeof payload.caption === "string" ? payload.caption : undefined,
        mediaUrl: typeof payload.mediaUrl === "string" ? payload.mediaUrl : null,
        mode: payload.mode === "publish" || payload.mode === "draft" ? payload.mode : undefined,
        idempotencyKey:
          typeof payload.idempotencyKey === "string" ? payload.idempotencyKey : undefined,
        allowAutoStart: policies.socialAutoStartForUpload,
        requireLoggedIn: policies.socialRequireLoggedInPlatformsOnly,
        preferredRail: preferredRailFrom(payload),
        fallbackToBrowser:
          typeof payload.fallbackToBrowser === "boolean"
            ? payload.fallbackToBrowser
            : typeof payload.fallback_to_browser === "boolean"
              ? payload.fallback_to_browser
              : undefined,
        youtube: parseYoutubeJobOptions(payload),
      });
    }
    case "social.get_upload_job":
      return socialGetUploadJob(String(payload.id ?? payload.jobId ?? ""));
    case "social.list_upload_jobs":
      return socialListUploadJobs({
        clientId: typeof payload.clientId === "string" ? payload.clientId : undefined,
        platform: typeof payload.platform === "string" ? payload.platform : undefined,
        status: typeof payload.status === "string" ? payload.status : undefined,
        since: typeof payload.since === "string" ? payload.since : undefined,
      });
    case "social.retry_upload_job":
      return socialRetryUploadJob({
        actorId,
        jobId: String(payload.id ?? payload.jobId ?? ""),
      });
    case "social.cancel_upload_job":
      return socialCancelUploadJob({
        actorId,
        jobId: String(payload.id ?? payload.jobId ?? ""),
      });
    case "social.list_posts":
      return socialListPosts({
        clientId: typeof payload.clientId === "string" ? payload.clientId : undefined,
        platform: typeof payload.platform === "string" ? payload.platform : undefined,
        status: typeof payload.status === "string" ? payload.status : undefined,
      });
    case "social.get_post":
      return socialGetPost(String(payload.id ?? payload.postId ?? ""));
    case "social.plan_distribution": {
      const clientId = String(payload.clientId ?? "");
      if (!clientId) throw new Error("VALIDATION");
      return socialPlanDistribution({
        clientId,
        assetId: typeof payload.assetId === "string" ? payload.assetId : undefined,
      });
    }
    case "social.bulk_create_upload_jobs": {
      const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
      return socialBulkCreateUploadJobs({
        actorId,
        jobs: jobs.map((row) => {
          const rec = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
          return {
            clientId: String(rec.clientId ?? ""),
            assetId: typeof rec.assetId === "string" ? rec.assetId : undefined,
            platforms: Array.isArray(rec.platforms)
              ? rec.platforms
                  .map(asPlatform)
                  .filter((item): item is SocialPlatform => Boolean(item))
              : [],
            caption: typeof rec.caption === "string" ? rec.caption : undefined,
            mode: rec.mode === "publish" || rec.mode === "draft" ? rec.mode : undefined,
            idempotencyKey: typeof rec.idempotencyKey === "string" ? rec.idempotencyKey : undefined,
            preferredRail: preferredRailFrom(rec),
            fallbackToBrowser:
              typeof rec.fallbackToBrowser === "boolean" ? rec.fallbackToBrowser : undefined,
          };
        }),
      });
    }
    case "social.get_cost_guard":
      return socialGetCostGuard();
    case "social.force_stop_if_running":
      return socialForceStop({ actorId });
    default:
      return undefined;
  }
}

