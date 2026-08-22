/**
 * Higher-level browser automation on the Social Machine.
 * Does not start a stopped VM.
 */
import {
  getRunningSocialSandbox,
  openPlatformInMachine,
  takeSocialScreenshot,
  transferAndOpenUpload,
} from "@/lib/server/daytona.server";
import { visionAnalyze } from "@/lib/server/vision.server";
import { PLATFORM_UPLOAD_URL, PLATFORM_HOME_URL } from "@/lib/social";
import type { SocialPlatform } from "@/lib/entities";
import { openUrlCommand, parseSocialMachineOs } from "@/lib/social-machine";

async function openUrl(url: string): Promise<void> {
  const { sandbox } = await getRunningSocialSandbox();
  const os = parseSocialMachineOs(sandbox.labels?.os ?? sandbox.snapshot);
  await sandbox.process.executeCommand(openUrlCommand(os === "linux" ? "linux" : "windows", url), undefined, undefined, 20);
}

export async function browserOpenUrl(input: { url?: unknown }) {
  const url = String(input.url ?? "").trim();
  if (!/^https:\/\//i.test(url)) throw new Error("VALIDATION");
  await openUrl(url);
  return { ok: true as const, url };
}

export async function browserWaitForText(input: { text?: unknown; timeoutMs?: unknown }) {
  const needle = String(input.text ?? "").trim().slice(0, 80);
  if (!needle) throw new Error("VALIDATION");
  const timeoutMs = Math.min(Math.max(Number(input.timeoutMs ?? 8000), 1000), 30_000);
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const shot = await takeSocialScreenshot();
    if (shot.dataUrl) {
      try {
        const result = await visionAnalyze({
          imageUrl: shot.dataUrl,
          prompt: `Does this screenshot contain the text ${JSON.stringify(needle)}? Reply YES or NO then a one-line reason.`,
        });
        if (/^yes\b/i.test(result.description)) {
          return { found: true, screenshotRef: shot.screenshotRef, description: result.description };
        }
      } catch {
        /* keep polling */
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1800));
  }
  return { found: false, screenshotRef: "social-desktop-latest" };
}

export async function browserUploadFile(input: {
  platform?: unknown;
  mediaUrl?: unknown;
  caption?: unknown;
  postId?: unknown;
}) {
  const platform = String(input.platform ?? "") as SocialPlatform;
  if (platform !== "instagram" && platform !== "x" && platform !== "tiktok" && platform !== "youtube") {
    throw new Error("VALIDATION");
  }
  return transferAndOpenUpload({
    platform,
    caption: typeof input.caption === "string" ? input.caption : null,
    mediaUrl: typeof input.mediaUrl === "string" ? input.mediaUrl : null,
    postId: String(input.postId ?? crypto.randomUUID()),
  });
}

export async function browserGetPageSummary() {
  const shot = await takeSocialScreenshot();
  if (!shot.dataUrl) {
    return {
      screenshotRef: shot.screenshotRef,
      summary: "Screenshot captured but too large to analyze inline. Open Social to view the desktop.",
    };
  }
  const analyzed = await visionAnalyze({
    imageUrl: shot.dataUrl,
    prompt: "Summarize the current browser page: site, visible UI, any login wall, and next operator action.",
  });
  return {
    screenshotRef: shot.screenshotRef,
    summary: analyzed.description,
  };
}

export async function browserOpenPlatformUpload(platform: SocialPlatform) {
  await getRunningSocialSandbox();
  const url = PLATFORM_UPLOAD_URL[platform] || PLATFORM_HOME_URL[platform];
  await openUrl(url);
  return { ok: true as const, platform, url };
}

export async function browserOpenInstagramUpload() {
  return browserOpenPlatformUpload("instagram");
}
export async function browserOpenXCompose() {
  return browserOpenPlatformUpload("x");
}
export async function browserOpenTiktokUpload() {
  return browserOpenPlatformUpload("tiktok");
}

export { openPlatformInMachine };
