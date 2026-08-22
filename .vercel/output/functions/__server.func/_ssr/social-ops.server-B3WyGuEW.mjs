import { v as SOCIAL_PLATFORMS } from "./mappers-Bmic_hyw.mjs";
import { t as sanitizeText } from "./sanitize-DAA2oq7r.mjs";
import { i as readPlaybookPolicies } from "./autonomy-policy.server-HcFlL3K7.mjs";
import { n as emitAutonomyEvent } from "./autonomy-events.server-DCl-_J_B.mjs";
import { d as readClients } from "./clients-CmcyBPZd.mjs";
import { c as isTrustedImageUrl } from "./thumbnails-DY2H9c6H.mjs";
import { h as parseYoutubeJobOptions, v as sessionToHealth, y as toPublicMachineStatus } from "./social-CmuIUyLc.mjs";
import { a as listSocialWindows, d as stopSocialMachine, f as takeSocialScreenshot, i as getSocialMachineStatus, l as setSocialAutoStopMinutes, n as ensureComputerUseStack, p as transferAndOpenUpload, s as openPlatformInMachine, u as startSocialMachine } from "./daytona.server-Ccwltk3g.mjs";
import { appendAudit, attachPostsToJobs, collectAssets, insertSocialJob, insertSocialPost, patchSocialJob, patchSocialPost, readSessions, readSocialJobs, readSocialPosts, runningLock, socialNewId, socialNowIso, writeSessions } from "./social-Cwlrz0WD.mjs";
import { isTrustedMediaUrl, listPublisherStatuses, providerFor, publishViaApi, resolveRail, sourceFromProvider } from "./social-publish.server-Dke6bAyh.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/social-ops.server-B3WyGuEW.js
/**
* Hermes-facing Social / Daytona operations.
* Never returns DAYTONA_API_KEY, VNC passwords, cookies, or social passwords.
* Start is never implied by status/list/read.
*/
function asPlatform(value) {
	return SOCIAL_PLATFORMS.includes(value) ? value : null;
}
function emitSocial(type, entityType, entityId, data) {
	emitAutonomyEvent({
		type,
		entityType,
		entityId,
		data
	});
	import("./safety-hooks.server-CNuRbzza.mjs").then((mod) => mod.onSocialEvent(type, entityType, entityId, data)).catch(() => {});
}
function deriveJobStatus(posts) {
	if (posts.length === 0) return "queued";
	if (posts.every((row) => row.status === "succeeded")) return "succeeded";
	if (posts.every((row) => row.status === "failed")) return "failed";
	if (posts.some((row) => row.status === "running" || row.status === "queued")) return "running";
	if (posts.some((row) => row.status === "needs_attention")) return "needs_attention";
	if (posts.some((row) => row.status === "succeeded")) return "needs_attention";
	return "failed";
}
async function jobView(id) {
	const [jobs, posts] = await Promise.all([readSocialJobs(), readSocialPosts()]);
	const job = jobs.find((row) => row.id === id);
	if (!job) return null;
	return attachPostsToJobs([job], posts)[0] ?? null;
}
async function socialGetMachineStatus() {
	const machine = await getSocialMachineStatus();
	return toPublicMachineStatus(machine);
}
async function socialStartMachine(input) {
	let machine;
	try {
		machine = await startSocialMachine();
	} catch (error) {
		emitSocial("social.machine.error", "social", "social-machine", {
			message: "The Social Machine could not start.",
			at: socialNowIso()
		});
		throw error;
	}
	if (input.waitUntilReady && machine.state !== "running") for (let i = 0; i < 8; i += 1) {
		await new Promise((resolve) => setTimeout(resolve, 1500));
		machine = await getSocialMachineStatus();
		if (machine.state === "running" || machine.state === "error") break;
	}
	await appendAudit({
		actorId: input.actorId,
		action: "social.start_machine",
		detail: machine.sandboxId ?? "started"
	});
	const at = socialNowIso();
	const opaque = machine.sandboxId ? machine.sandboxId.slice(-8) : "social-machine";
	emitSocial("social.machine.started", "social", opaque, {
		sandboxIdOpaque: opaque,
		at
	});
	emitSocial("social.machine_started", "social", opaque, {
		state: machine.state,
		at
	});
	if (machine.state === "error") emitSocial("social.machine.error", "social", opaque, {
		message: "The Social Machine started in an error state.",
		at
	});
	return toPublicMachineStatus(machine);
}
async function socialStopMachine(input) {
	const machine = await stopSocialMachine();
	await appendAudit({
		actorId: input.actorId,
		action: "social.stop_machine",
		detail: input.reason ?? "stopped"
	});
	const at = socialNowIso();
	const opaque = machine.sandboxId ? machine.sandboxId.slice(-8) : "social-machine";
	const reason = input.reason ?? "operator";
	emitSocial("social.machine.stopped", "social", opaque, {
		reason,
		at
	});
	emitSocial("social.machine_stopped", "social", opaque, {
		state: machine.state,
		reason,
		at
	});
	return toPublicMachineStatus(machine);
}
async function socialSetAutoStop(input) {
	const machine = await setSocialAutoStopMinutes(input.minutes);
	await appendAudit({
		actorId: input.actorId,
		action: "social.set_auto_stop",
		detail: String(input.minutes)
	});
	return toPublicMachineStatus(machine);
}
async function socialEnsureComputerUse(input) {
	const result = await ensureComputerUseStack();
	await appendAudit({
		actorId: input.actorId,
		action: "social.ensure_computer_use",
		detail: result.computerUse ? "started" : "unavailable"
	});
	return result;
}
async function socialGetDesktopPreview() {
	const machine = await getSocialMachineStatus();
	return {
		operatorOnly: true,
		available: machine.state === "running" && Boolean(machine.previewUrl),
		message: "Desktop preview is operator UI only. Use social.take_screenshot for automation evidence."
	};
}
async function socialTakeScreenshot(input) {
	const shot = await takeSocialScreenshot();
	await appendAudit({
		actorId: input.actorId,
		action: "social.take_screenshot",
		detail: shot.screenshotRef
	});
	return {
		screenshotRef: shot.screenshotRef,
		capturedAt: shot.capturedAt,
		mimeType: shot.mimeType,
		dataUrl: shot.dataUrl
	};
}
async function socialListOpenWindows() {
	return listSocialWindows();
}
async function socialListPlatforms() {
	const sessions = await readSessions();
	return { platforms: SOCIAL_PLATFORMS.map((platform) => ({
		platform,
		sessionStatus: sessionToHealth(sessions[platform]),
		lastCheckedAt: null
	})) };
}
async function socialGetPlatformStatus(platformRaw) {
	const platform = asPlatform(platformRaw);
	if (!platform) throw new Error("VALIDATION");
	const sessions = await readSessions();
	return {
		platform,
		sessionStatus: sessionToHealth(sessions[platform]),
		lastCheckedAt: null
	};
}
async function socialMarkPlatformSession(input) {
	const platform = asPlatform(input.platform);
	if (!platform) throw new Error("VALIDATION");
	const state = input.state === "logged_in" || input.state === "not_logged_in" || input.state === "unknown" ? input.state : input.state === "needs_login" ? "not_logged_in" : null;
	if (!state) throw new Error("VALIDATION");
	const sessions = await readSessions();
	sessions[platform] = state;
	await writeSessions(sessions);
	await appendAudit({
		actorId: input.actorId,
		action: "social.mark_platform_session",
		detail: `${platform}:${state}`
	});
	const checkedAt = socialNowIso();
	if (state === "not_logged_in") emitSocial("social.session.needs_login", "social_platform", platform, {
		platform,
		checkedAt
	});
	else if (state === "logged_in") emitSocial("social.session.healthy", "social_platform", platform, {
		platform,
		checkedAt
	});
	return {
		platform,
		sessionStatus: sessionToHealth(state),
		lastCheckedAt: checkedAt
	};
}
async function socialOpenPlatform(input) {
	const platform = asPlatform(input.platform);
	if (!platform) throw new Error("VALIDATION");
	await openPlatformInMachine(platform);
	await appendAudit({
		actorId: input.actorId,
		action: "social.open_platform",
		detail: platform
	});
	return {
		ok: true,
		platform
	};
}
async function socialCheckSessionHealth(input) {
	const machine = await getSocialMachineStatus();
	const sessions = await readSessions();
	const platforms = (input.platform ? [asPlatform(input.platform)] : [...SOCIAL_PLATFORMS]).filter((row) => Boolean(row));
	if (platforms.length === 0) throw new Error("VALIDATION");
	const results = [];
	let screenshotRef = null;
	if (machine.state === "running") {
		try {
			await ensureComputerUseStack();
		} catch {}
		for (const platform of platforms) try {
			await openPlatformInMachine(platform);
		} catch {}
		try {
			screenshotRef = (await takeSocialScreenshot()).screenshotRef;
		} catch {
			screenshotRef = null;
		}
	}
	const checkedAt = socialNowIso();
	for (const platform of platforms) results.push({
		platform,
		sessionStatus: sessionToHealth(sessions[platform]),
		lastCheckedAt: checkedAt
	});
	await appendAudit({
		actorId: input.actorId,
		action: "social.check_session_health",
		detail: platforms.join(",")
	});
	for (const row of results) if (row.sessionStatus === "needs_login") emitSocial("social.session.needs_login", "social_platform", row.platform, {
		platform: row.platform,
		checkedAt,
		evidenceScreenshotRef: screenshotRef
	});
	else if (row.sessionStatus === "logged_in") emitSocial("social.session.healthy", "social_platform", row.platform, {
		platform: row.platform,
		checkedAt
	});
	return {
		machineState: machine.state,
		screenshotRef,
		platforms: results
	};
}
async function socialListUploadableAssets(clientId) {
	const assets = await collectAssets();
	return { assets: clientId ? assets.filter((row) => row.clientId === clientId) : assets };
}
async function socialResolveAsset(input) {
	const asset = (await collectAssets()).find((row) => row.id === input.assetId);
	if (!asset || asset.clientId !== input.clientId) throw new Error("ASSET_MISSING");
	return {
		asset,
		eligible: true
	};
}
function rollupJob(view) {
	if (view.status === "cancelled" || view.status === "awaiting_approval") return view;
	const status = deriveJobStatus(view.posts);
	return {
		...view,
		status
	};
}
async function socialGetUploadJob(id) {
	const view = await jobView(id);
	if (!view) throw new Error("JOB_MISSING");
	return rollupJob(view);
}
async function socialListUploadJobs(filter) {
	const [jobs, posts] = await Promise.all([readSocialJobs(), readSocialPosts()]);
	let views = attachPostsToJobs(jobs, posts).map(rollupJob);
	if (filter.clientId) views = views.filter((row) => row.clientId === filter.clientId);
	if (filter.platform) views = views.filter((row) => row.platforms.includes(filter.platform));
	if (filter.status) views = views.filter((row) => row.status === filter.status);
	if (filter.since) views = views.filter((row) => row.createdAt >= filter.since);
	return { jobs: views };
}
async function socialListPosts(filter) {
	let posts = await readSocialPosts();
	if (filter.clientId) posts = posts.filter((row) => row.clientId === filter.clientId);
	if (filter.platform) posts = posts.filter((row) => row.platform === filter.platform);
	if (filter.status) posts = posts.filter((row) => row.status === filter.status);
	return { posts: posts.map((post) => ({
		...post,
		screenshotUrl: post.screenshotUrl ? "social-desktop-latest" : null
	})) };
}
async function socialGetPost(id) {
	const post = (await readSocialPosts()).find((row) => row.id === id);
	if (!post) throw new Error("POST_MISSING");
	return {
		...post,
		screenshotUrl: post.screenshotUrl ? "social-desktop-latest" : null
	};
}
async function socialPlanDistribution(input) {
	const policies = await readPlaybookPolicies();
	const [sessions, posts, assets, publishers] = await Promise.all([
		readSessions(),
		readSocialPosts(),
		collectAssets(),
		listPublisherStatuses()
	]);
	if (input.assetId) {
		if (!assets.find((row) => row.id === input.assetId && row.clientId === input.clientId)) throw new Error("ASSET_MISSING");
	}
	const recommended = [];
	const rails = {
		instagram: "skip",
		x: "skip",
		tiktok: "skip",
		youtube: "skip"
	};
	for (const platform of SOCIAL_PLATFORMS) {
		const session = sessions[platform];
		const apiOk = publishers[platform].eligible;
		if (!apiOk && policies.socialRequireLoggedInPlatformsOnly && session !== "logged_in") {
			rails[platform] = "skip";
			continue;
		}
		if (posts.some((post) => post.clientId === input.clientId && post.platform === platform && post.status === "failed" && (!input.assetId || post.contentRef === input.assetId)) && !apiOk) continue;
		recommended.push(platform);
		rails[platform] = apiOk ? "API" : "BROWSER";
	}
	return {
		suggestionOnly: true,
		clientId: input.clientId,
		assetId: input.assetId ?? null,
		recommended,
		preferredRail: "AUTO",
		rails,
		skipped: SOCIAL_PLATFORMS.filter((platform) => !recommended.includes(platform))
	};
}
async function socialGetCostGuard() {
	const [machine, jobs] = await Promise.all([getSocialMachineStatus(), readSocialJobs()]);
	const policies = await readPlaybookPolicies();
	const activeJobs = jobs.filter((job) => job.status === "running" || job.status === "queued").length;
	const idleMs = policies.socialIdleStopMinutes * 6e4;
	const recommendStop = machine.state === "running" && activeJobs === 0 && (machine.runningMs ?? 0) >= Math.max(idleMs, 3e5);
	return {
		running: machine.state === "running",
		durationMs: machine.runningMs,
		autoStopMinutes: machine.autoStopMinutes,
		activeJobs,
		recommendStop
	};
}
async function socialForceStop(input) {
	const machine = await getSocialMachineStatus();
	if (machine.state !== "running" && machine.state !== "starting") return {
		stopped: false,
		...toPublicMachineStatus(machine)
	};
	return {
		stopped: true,
		...await socialStopMachine({
			...input,
			reason: "force"
		})
	};
}
async function runPlatformsForJob(input) {
	const sessions = await readSessions();
	const machine = await getSocialMachineStatus();
	runningLock.busy = true;
	try {
		for (const platform of input.platforms) {
			const existing = input.existingPosts?.find((row) => row.platform === platform);
			const id = existing?.id ?? socialNewId();
			const stamp = socialNowIso();
			let rail = "BROWSER";
			try {
				rail = (await resolveRail({
					platform,
					preferred: input.preferredRail,
					fallbackToBrowser: input.fallbackToBrowser,
					daytonaConfigured: machine.configured,
					machineRunning: machine.state === "running",
					mode: input.mode
				})).rail;
			} catch {
				if (input.preferredRail === "API") rail = "API";
				else if (machine.configured) rail = "BROWSER";
				else throw new Error("NO_PUBLISH_RAIL");
			}
			if (!existing) await insertSocialPost({
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
				created_by: input.actorId
			});
			else await patchSocialPost(id, {
				status: "running",
				attention_reason: null,
				rail,
				source: rail === "API" ? sourceFromProvider(providerFor(platform)) : "DAYTONA"
			});
			if (rail === "API") try {
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
							attention_reason: progress.phase === "uploading" ? `Uploading… ${progress.percent}%` : progress.phase === "processing" ? "Processing media…" : progress.phase === "init" ? "Starting resumable upload…" : "Publishing…"
						});
					}
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
					...published.status === "succeeded" ? {
						upload_percent: 100,
						upload_phase: "publishing"
					} : {}
				});
				await appendAudit({
					actorId: input.actorId,
					action: "social_upload",
					detail: `${platform}:${input.clientName}:${published.status}:API`
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
						actorId: input.actorId
					});
					import("./library-storage.server-DfxOTjeL.mjs").then((n) => n.a).then((n) => n.a).then((mod) => mod.pinMediaUrlOnPublish(input.mediaUrl)).catch(() => {});
					if (published.externalPostId) import("./social-Cwlrz0WD.mjs").then(async (mod) => {
						const post = (await mod.readSocialPosts()).find((row) => row.id === id);
						if (!post) return;
						const { onSocialUploadSucceeded } = await import("./performance-fetch.server-BDzg5W1p.mjs");
						await onSocialUploadSucceeded({
							post,
							actorId: input.actorId
						});
					}).catch(() => {});
				} else if (published.status === "needs_attention") emitSocial("social.upload.needs_attention", "social_post", id, {
					jobId: input.jobId,
					clientId: input.clientId,
					platform,
					reason: published.reason,
					rail: "API"
				});
				continue;
			} catch (error) {
				const code = error instanceof Error ? error.message : "PUBLISHER_REJECTED";
				if (!(!isPermanentXFailure(platform, code) && input.fallbackToBrowser && input.preferredRail !== "API" && machine.configured && machine.state === "running")) {
					await patchSocialPost(id, {
						status: "failed",
						attention_reason: userFacingPublishError(code),
						rail: "API"
					});
					emitSocial("social.upload.failed", "social_post", id, {
						jobId: input.jobId,
						clientId: input.clientId,
						platform,
						errorCode: code,
						rail: "API",
						message: userFacingPublishError(code),
						actorId: input.actorId
					});
					continue;
				}
				rail = "BROWSER";
				await patchSocialPost(id, {
					rail: "BROWSER",
					source: "DAYTONA",
					attention_reason: "API publish failed — falling back to Computer Use."
				});
			}
			const needsLogin = sessions[platform] === "not_logged_in";
			try {
				const result = await transferAndOpenUpload({
					platform,
					caption: input.caption,
					mediaUrl: input.mediaUrl,
					postId: id
				});
				await patchSocialPost(id, {
					status: "needs_attention",
					screenshot_url: result.screenshot,
					rail: "BROWSER",
					source: "DAYTONA",
					attention_reason: needsLogin ? `Log into ${platform} in the desktop, then finish the publish.` : result.reason
				});
				await appendAudit({
					actorId: input.actorId,
					action: "social_upload",
					detail: `${platform}:${input.clientName}:needs_attention:BROWSER`
				});
				emitSocial("social.upload.needs_attention", "social_post", id, {
					jobId: input.jobId,
					clientId: input.clientId,
					platform,
					reason: needsLogin ? "needs_login" : result.reason,
					rail: "BROWSER"
				});
				if (needsLogin) emitSocial("social.session.needs_login", "social_platform", platform, {
					platform,
					checkedAt: socialNowIso(),
					evidenceScreenshotRef: result.screenshot
				});
			} catch (error) {
				const stopped = error instanceof Error && error.message === "MACHINE_STOPPED";
				await patchSocialPost(id, {
					status: "failed",
					rail: "BROWSER",
					attention_reason: stopped ? "The Social Machine stopped before the upload finished." : "The upload job failed. Retry after the machine is running, or connect the API publisher."
				});
				await appendAudit({
					actorId: input.actorId,
					action: "social_upload",
					detail: `${platform}:${input.clientName}:failed:BROWSER`
				});
				emitSocial("social.upload.failed", "social_post", id, {
					jobId: input.jobId,
					clientId: input.clientId,
					platform,
					errorCode: stopped ? "MACHINE_STOPPED" : "UPLOAD_FAILED",
					rail: "BROWSER",
					message: stopped ? "The Social Machine stopped before the upload finished." : "The upload job failed."
				});
				if (stopped) await patchSocialJob(input.jobId, { error_code: "MACHINE_STOPPED" });
			}
		}
	} finally {
		runningLock.busy = false;
	}
	const view = await jobView(input.jobId);
	if (view) {
		const status = deriveJobStatus(view.posts);
		await patchSocialJob(input.jobId, { status });
		import("./linear.server-DI-z011N.mjs").then((n) => n.n).then((mod) => mod.notifyLinearOfEntity({
			entityType: "SocialUploadJob",
			entityId: input.jobId,
			status: status.toUpperCase(),
			failed: status === "failed",
			title: `[Social] ${status} — ${view.clientId}`,
			labels: ["social"]
		})).catch(() => {});
		if (status === "needs_attention") emitSocial("social.job_needs_attention", "social_job", input.jobId, {
			clientId: view.clientId,
			status
		});
		if (status === "succeeded") {
			emitSocial("social.job_completed", "social_job", input.jobId, {
				clientId: view.clientId,
				status
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
					mode: view.mode
				});
				if (post.externalPostId) import("./performance-fetch.server-BDzg5W1p.mjs").then((mod) => mod.onSocialUploadSucceeded({
					post,
					actorId: input.actorId
				})).catch(() => {});
			}
		}
		if (status === "failed") emitSocial("social.job_completed", "social_job", input.jobId, {
			clientId: view.clientId,
			status
		});
	}
}
function isPermanentXFailure(platform, code) {
	if (platform === "instagram") return code === "IG_PROFESSIONAL_REQUIRED" || code === "IG_ACCOUNT_MISSING" || code === "IG_MEDIA_UNSUPPORTED" || code === "IG_APP_REVIEW" || code === "MEDIA_TOO_LARGE" || code === "MEDIA_REQUIRED" || code === "UNTRUSTED_IMAGE" || code === "JOB_CANCELLED";
	if (platform === "tiktok") return code === "MEDIA_TOO_LARGE" || code === "MEDIA_REQUIRED" || code === "UNTRUSTED_IMAGE" || code === "TIKTOK_MEDIA_UNSUPPORTED" || code === "JOB_CANCELLED";
	if (platform === "youtube") return code === "MEDIA_TOO_LARGE" || code === "MEDIA_REQUIRED" || code === "UNTRUSTED_IMAGE" || code === "YT_MEDIA_UNSUPPORTED" || code === "YT_INVALID_METADATA" || code === "YOUTUBE_QUOTA" || code === "JOB_CANCELLED";
	if (platform !== "x") return false;
	return code === "MEDIA_TOO_LARGE" || code === "MEDIA_REQUIRED" || code === "UNTRUSTED_IMAGE" || code === "X_MEDIA_UNSUPPORTED" || /must be \d+ MB or smaller/i.test(code) || /not a supported X media type/i.test(code) || code === "JOB_CANCELLED";
}
function userFacingPublishError(code) {
	switch (code) {
		case "PUBLISHER_NOT_CONNECTED":
		case "PUBLISHER_NOT_ELIGIBLE": return "That platform isn’t connected for API publishing.";
		case "PUBLISHER_TOKEN_EXPIRED": return "The platform token expired. Reconnect in Settings.";
		case "IG_PROFESSIONAL_REQUIRED": return "Instagram API publishing needs a professional account.";
		case "IG_APP_REVIEW": return "Instagram needs App Review for content publish, or this app is still in Development mode (test users only).";
		case "IG_CONTAINER_FAILED": return "Instagram couldn’t finish processing the Reel. Re-encode as MP4 ~9:16 and try again.";
		case "IG_MEDIA_UNSUPPORTED": return "Instagram Reels need a short MP4 video. Photos stay on Computer Use.";
		case "TIKTOK_AUDIT_REQUIRED": return "TikTok rejected Direct Post (app audit). Inbox draft or browser rail still work.";
		case "TIKTOK_MEDIA_UNSUPPORTED": return "TikTok API publishing needs an MP4 (or QuickTime) video.";
		case "IG_PUBLIC_URL_REQUIRED": return "Instagram API needs a public HTTPS media URL.";
		case "MEDIA_REQUIRED":
		case "MEDIA_FETCH_FAILED":
		case "MEDIA_TOO_LARGE": return "The media file couldn’t be sent to the platform API.";
		case "X_MEDIA_UNSUPPORTED": return "X only accepts images (JPEG/PNG/WebP), GIFs, or MP4 video.";
		case "YOUTUBE_QUOTA": return "YouTube API quota is exhausted. Wait for the daily reset, or use Computer Use.";
		case "YT_INVALID_METADATA": return "YouTube rejected the title, description, or tags.";
		case "YT_MEDIA_UNSUPPORTED": return "YouTube API upload needs an MP4 video.";
		case "PUBLISHER_RATE_LIMIT": return "Capacity — retrying. The platform rate-limited this publish.";
		case "PUBLISHER_REJECTED": return "The platform rejected the publish. Try the browser rail or check the asset.";
		case "JOB_CANCELLED": return "That upload was cancelled.";
		case "UPLOAD_SESSION_MISSING": return "The resumable upload session expired. Retry to start a new transfer.";
		default:
			if (/must be \d+ MB or smaller/i.test(code)) return code;
			return "API publish failed. The browser rail can still be used if Daytona is running.";
	}
}
async function socialGetPublisherStatus() {
	const [publishers, machine, sessions] = await Promise.all([
		listPublisherStatuses(),
		getSocialMachineStatus(),
		readSessions()
	]);
	return {
		publishers: SOCIAL_PLATFORMS.map((platform) => ({
			...publishers[platform],
			configured: publishers[platform].appConfigured || publishers[platform].connected,
			username: publishers[platform].handle,
			eligible: publishers[platform].eligible,
			browserSession: sessionToHealth(sessions[platform]),
			machineState: machine.state,
			recommendedRail: publishers[platform].eligible ? "API" : machine.configured ? "BROWSER" : "unavailable"
		})),
		tiktok: {
			configured: publishers.tiktok.appConfigured && publishers.tiktok.connected,
			openId: publishers.tiktok.tiktok?.openId ?? publishers.tiktok.accountId,
			postModeDefault: publishers.tiktok.tiktok?.postModeDefault ?? "UPLOAD_TO_INBOX",
			auditStatus: publishers.tiktok.tiktok?.auditStatus ?? "UNAUDITED",
			eligibleDirectPost: Boolean(publishers.tiktok.tiktok?.eligibleDirectPost),
			eligibleInbox: Boolean(publishers.tiktok.tiktok?.eligibleInbox)
		},
		instagram: {
			configured: publishers.instagram.appConfigured && publishers.instagram.connected,
			username: publishers.instagram.handle,
			igUserId: publishers.instagram.instagram?.igUserId ?? publishers.instagram.accountId,
			accountType: publishers.instagram.instagram?.accountType ?? "UNKNOWN",
			eligibleReelsPublish: Boolean(publishers.instagram.instagram?.eligibleReelsPublish)
		},
		youtube: {
			configured: publishers.youtube.appConfigured && publishers.youtube.connected,
			channelId: publishers.youtube.youtube?.channelId ?? publishers.youtube.accountId,
			channelTitle: publishers.youtube.youtube?.channelTitle ?? publishers.youtube.handle,
			eligible: publishers.youtube.eligible
		},
		notes: {
			instagram: "Instagram API rail is Reels publish for professional accounts only. Draft mode does not publish to IG via Graph.",
			tiktok: "TikTok uses Content Posting API when connected. Draft jobs go to inbox. Public Direct Post needs an audited app — unaudited publish is forced to inbox, not a public post.",
			x: "X uses the official API when connected (user OAuth). Draft jobs stay local — X has no draft API. Otherwise Computer Use.",
			youtube: "YouTube uses Data API v3 resumable upload when connected. Draft jobs land private. Publish default is unlisted unless you set public (still gated by approvals). Per-client OAuth is phase 2 — v1 uploads go to the workspace publish channel."
		}
	};
}
async function createUploadJobInternal(input) {
	const policies = await readPlaybookPolicies();
	const allowAutoStart = input.allowAutoStart || policies.socialAutoStartForUpload;
	const requireLoggedIn = input.requireLoggedIn || policies.socialRequireLoggedInPlatformsOnly;
	const mode = input.mode ?? policies.socialDefaultUploadMode;
	const preferredRail = input.preferredRail ?? "AUTO";
	const fallbackToBrowser = input.fallbackToBrowser ?? preferredRail !== "API";
	if (input.idempotencyKey) {
		const existing = (await readSocialJobs()).find((row) => row.idempotencyKey === input.idempotencyKey);
		if (existing) {
			const view = await jobView(existing.id);
			if (view) return rollupJob(view);
		}
	}
	const active = (await readSocialJobs()).filter((job) => job.status === "running" || job.status === "queued").length;
	if (runningLock.busy || active >= 2) throw new Error("UPLOAD_IN_PROGRESS");
	const client = (await readClients()).find((row) => row.id === input.clientId && !row.deletedAt);
	if (!client) throw new Error("CLIENT_MISSING");
	const assets = await collectAssets();
	const asset = input.assetId ? assets.find((row) => row.id === input.assetId) : null;
	const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	if (input.assetId && !input.mediaAssetId && !uuid.test(input.assetId) && (!asset || asset.clientId !== input.clientId)) throw new Error("ASSET_MISSING");
	let mediaUrl = (input.mediaUrl ?? asset?.mediaUrl ?? null)?.trim() || null;
	let libraryAssetId = input.mediaAssetId ?? null;
	if (!libraryAssetId && input.assetId && uuid.test(input.assetId)) libraryAssetId = input.assetId;
	if (libraryAssetId) {
		const { resolvePublishAsset } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
		const resolved = await resolvePublishAsset({
			mediaAssetId: libraryAssetId,
			clientId: input.clientId,
			platforms: input.platforms
		});
		libraryAssetId = resolved.asset.id;
		mediaUrl = resolved.mediaUrl ?? mediaUrl;
	}
	if (mediaUrl && !isTrustedMediaUrl(mediaUrl) && !isTrustedImageUrl(mediaUrl)) throw new Error("UNTRUSTED_IMAGE");
	const caption = sanitizeText((input.caption ?? asset?.caption ?? "").slice(0, 2200));
	let youtube = input.youtube ?? null;
	if (youtube?.thumbAssetId && !youtube.thumbUrl) try {
		const { resolvePublishAsset } = await import("./library-pipeline.server-Cj0cLHTT.mjs").then((n) => n.i);
		const thumb = await resolvePublishAsset({
			mediaAssetId: youtube.thumbAssetId,
			clientId: input.clientId
		});
		youtube = {
			...youtube,
			thumbUrl: thumb.mediaUrl
		};
	} catch {}
	let mediaMeta = null;
	if (libraryAssetId) try {
		const { getAsset } = await import("./library.server-vya-JVML.mjs").then((n) => n.p);
		const lib = await getAsset(libraryAssetId);
		if (lib) mediaMeta = {
			durationSec: lib.durationSec,
			width: lib.width,
			height: lib.height,
			title: lib.title
		};
	} catch {}
	let platforms = input.platforms.filter((platform) => SOCIAL_PLATFORMS.includes(platform));
	if (platforms.length === 0) throw new Error("VALIDATION");
	const [machine, publishers, sessions] = await Promise.all([
		getSocialMachineStatus(),
		listPublisherStatuses(),
		readSessions()
	]);
	const rails = /* @__PURE__ */ new Map();
	for (const platform of platforms) try {
		const resolved = await resolveRail({
			platform,
			preferred: preferredRail,
			fallbackToBrowser,
			daytonaConfigured: machine.configured,
			machineRunning: machine.state === "running",
			mode
		});
		rails.set(platform, resolved.rail);
	} catch (error) {
		const code = error instanceof Error ? error.message : "NO_PUBLISH_RAIL";
		if (preferredRail === "API") throw new Error(code === "PUBLISHER_NOT_ELIGIBLE" ? code : "PUBLISHER_NOT_ELIGIBLE");
		if (machine.configured) rails.set(platform, "BROWSER");
		else if (publishers[platform].eligible) rails.set(platform, "API");
		else throw new Error(code === "DAYTONA_UNAVAILABLE" ? "NO_PUBLISH_RAIL" : code);
	}
	if (requireLoggedIn) {
		const blocked = platforms.filter((platform) => rails.get(platform) === "BROWSER" && sessions[platform] === "not_logged_in");
		platforms = platforms.filter((platform) => !blocked.includes(platform));
		if (platforms.length === 0) throw new Error("PLATFORM_NEEDS_LOGIN");
	}
	const needsBrowser = platforms.some((platform) => rails.get(platform) === "BROWSER");
	const apiEligible = platforms.some((platform) => rails.get(platform) === "API");
	if (mode === "publish") {
		const { readApprovalPolicy } = await import("./approvals.server-Bpax_gE8.mjs");
		const { requiresSocialPublishApproval } = await import("./safety-CI611PZC.mjs").then((n) => n._).then((n) => n._);
		if (requiresSocialPublishApproval(await readApprovalPolicy(), platforms)) {
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
				created_by: input.actorId
			});
			const { createApprovalRequest } = await import("./approvals.server-Bpax_gE8.mjs");
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
					ytCategoryId: youtube?.categoryId ?? null
				},
				requestedBy: input.actorId
			});
			emitSocial("social.job_created", "social_job", id, {
				clientId: input.clientId,
				platforms,
				mode,
				preferredRail,
				awaitingApproval: true,
				actorId: input.actorId
			});
			await appendAudit({
				actorId: input.actorId,
				action: "social.create_upload_job",
				detail: `${input.clientId}:${platforms.join(",")}:awaiting_approval`
			});
			const view = await jobView(id);
			if (!view) throw new Error("JOB_MISSING");
			return rollupJob(view);
		}
	}
	if (needsBrowser && !machine.configured) {
		if (apiEligible) platforms = platforms.filter((platform) => rails.get(platform) === "API");
		else throw new Error("DAYTONA_UNAVAILABLE");
	}
	if (platforms.some((platform) => rails.get(platform) === "BROWSER") && machine.state !== "running" && machine.state !== "starting") {
		if (allowAutoStart && machine.configured) await startSocialMachine();
		else if (!apiEligible) throw new Error("MACHINE_STOPPED");
	}
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
		created_by: input.actorId
	});
	emitSocial("social.job_created", "social_job", id, {
		clientId: input.clientId,
		platforms,
		mode,
		preferredRail
	});
	await appendAudit({
		actorId: input.actorId,
		action: "social.create_upload_job",
		detail: `${input.clientId}:${platforms.join(",")}:${preferredRail}`
	});
	await writeAuditStart(input.actorId, id, platforms);
	await runPlatformsForJob({
		actorId: input.actorId,
		jobId: id,
		clientId: input.clientId,
		clientName: client.name,
		platforms,
		caption: caption || null,
		mediaUrl,
		assetId: libraryAssetId ?? asset?.id ?? null,
		preferredRail,
		fallbackToBrowser,
		mode,
		youtube,
		mediaMeta
	});
	const view = await jobView(id);
	if (!view) throw new Error("JOB_MISSING");
	return rollupJob(view);
}
async function resumeUploadJobAfterApproval(input) {
	const view = await jobView(input.jobId);
	if (!view) throw new Error("JOB_MISSING");
	if (view.status !== "awaiting_approval") return rollupJob(view);
	const platforms = view.platforms;
	const caption = typeof input.payload.caption === "string" ? input.payload.caption : view.caption;
	const mediaUrl = typeof input.payload.mediaUrl === "string" ? input.payload.mediaUrl : null;
	const assetId = typeof input.payload.assetId === "string" ? input.payload.assetId : typeof input.payload.mediaAssetId === "string" ? input.payload.mediaAssetId : view.assetId;
	const preferredRail = view.preferredRail ?? "AUTO";
	const fallbackToBrowser = view.fallbackToBrowser ?? preferredRail !== "API";
	const mode = view.mode;
	const youtube = view.youtube ?? parseYoutubeJobOptions(input.payload);
	const clientName = typeof input.payload.clientName === "string" ? input.payload.clientName : view.clientId;
	const machine = await getSocialMachineStatus();
	let needsBrowser = false;
	for (const platform of platforms) try {
		if ((await resolveRail({
			platform,
			preferred: preferredRail,
			fallbackToBrowser,
			daytonaConfigured: machine.configured,
			machineRunning: machine.state === "running",
			mode
		})).rail === "BROWSER") needsBrowser = true;
	} catch {
		if (machine.configured) needsBrowser = true;
	}
	if (needsBrowser && machine.state !== "running" && machine.state !== "starting") {
		if ((await readPlaybookPolicies()).socialAutoStartForUpload && machine.configured) await startSocialMachine();
	}
	await patchSocialJob(view.id, {
		status: "running",
		error_code: null
	});
	await writeAuditStart(input.actorId, view.id, platforms);
	await runPlatformsForJob({
		actorId: input.actorId,
		jobId: view.id,
		clientId: view.clientId,
		clientName,
		platforms,
		caption,
		mediaUrl,
		assetId,
		preferredRail,
		fallbackToBrowser,
		mode,
		youtube
	});
	const next = await jobView(view.id);
	if (!next) throw new Error("JOB_MISSING");
	return rollupJob(next);
}
async function writeAuditStart(actorId, jobId, platforms) {
	await appendAudit({
		actorId,
		action: "social.publish.started",
		detail: `${jobId}:${platforms.join(",")}`
	});
	const { writeAuditEvent } = await import("./audit.server-B2Y-2eMJ.mjs");
	await writeAuditEvent({
		actorUserId: actorId,
		actorType: actorId.startsWith("agent:") ? "HERMES" : "USER",
		action: "social.publish.started",
		entityType: "social_job",
		entityId: jobId,
		jobId,
		summary: `Publish started for ${platforms.join(", ")}`,
		metadata: { platforms }
	});
}
async function rejectUploadJobAfterApproval(input) {
	const view = await jobView(input.jobId);
	if (!view) throw new Error("JOB_MISSING");
	await patchSocialJob(view.id, {
		status: "cancelled",
		error_code: "REJECTED"
	});
	await appendAudit({
		actorId: input.actorId,
		action: "social.publish.rejected",
		detail: input.note ?? view.id
	});
	const next = await jobView(view.id);
	if (!next) throw new Error("JOB_MISSING");
	return {
		...next,
		status: "cancelled"
	};
}
async function socialRetryUploadJob(input) {
	const policies = await readPlaybookPolicies();
	const view = await jobView(input.jobId);
	if (!view) throw new Error("JOB_MISSING");
	if (view.status === "cancelled") throw new Error("JOB_CANCELLED");
	if (view.status === "awaiting_approval") throw new Error("AWAITING_APPROVAL");
	const failed = view.posts.filter((post) => post.status === "failed" || post.status === "needs_attention");
	if (failed.length === 0) return rollupJob(view);
	const preferredRail = view.preferredRail ?? "AUTO";
	const fallbackToBrowser = view.fallbackToBrowser ?? preferredRail !== "API";
	const machine = await getSocialMachineStatus();
	let needsBrowser = false;
	for (const post of failed) try {
		if ((await resolveRail({
			platform: post.platform,
			preferred: preferredRail,
			fallbackToBrowser,
			daytonaConfigured: machine.configured,
			machineRunning: machine.state === "running",
			mode: view.mode
		})).rail === "BROWSER") needsBrowser = true;
	} catch {
		if (machine.configured) needsBrowser = true;
	}
	if (needsBrowser && machine.state !== "running" && machine.state !== "starting") {
		if (!policies.socialAutoStartForUpload || !machine.configured) {
			if (!failed.some((post) => post.rail === "API" || preferredRail === "API" || preferredRail === "AUTO") || preferredRail === "BROWSER") throw new Error("MACHINE_STOPPED");
		} else await startSocialMachine();
	}
	const client = (await readClients()).find((row) => row.id === view.clientId);
	await patchSocialJob(view.id, {
		status: "running",
		error_code: null
	});
	await runPlatformsForJob({
		actorId: input.actorId,
		jobId: view.id,
		clientId: view.clientId,
		clientName: client?.name ?? view.clientId,
		platforms: failed.map((post) => post.platform),
		caption: view.caption,
		mediaUrl: failed[0]?.mediaUrl ?? null,
		assetId: view.assetId,
		existingPosts: failed,
		preferredRail,
		fallbackToBrowser,
		mode: view.mode,
		youtube: view.youtube
	});
	const next = await jobView(view.id);
	if (!next) throw new Error("JOB_MISSING");
	return rollupJob(next);
}
async function socialCancelUploadJob(input) {
	const view = await jobView(input.jobId);
	if (!view) throw new Error("JOB_MISSING");
	if (view.status === "succeeded" || view.status === "cancelled") return rollupJob(view);
	const { cancelChunkedUploadsForJob } = await import("./chunked-upload.server-MCqyKsua.mjs");
	await cancelChunkedUploadsForJob(input.jobId);
	for (const post of view.posts) if (post.status === "queued" || post.status === "running") await patchSocialPost(post.id, {
		status: "failed",
		attention_reason: "Cancelled by operator or agent."
	});
	await patchSocialJob(view.id, {
		status: "cancelled",
		error_code: "CANCELLED"
	});
	await appendAudit({
		actorId: input.actorId,
		action: "social.cancel_upload_job",
		detail: view.id
	});
	try {
		const { cancelApprovalsForResource } = await import("./approvals.server-Bpax_gE8.mjs");
		await cancelApprovalsForResource("SocialUploadJob", view.id);
	} catch {}
	const next = await jobView(view.id);
	if (!next) throw new Error("JOB_MISSING");
	return {
		...next,
		status: "cancelled"
	};
}
async function socialBulkCreateUploadJobs(input) {
	const policies = await readPlaybookPolicies();
	const batch = input.jobs.slice(0, policies.socialMaxBulkJobsPerRun);
	const created = [];
	const errors = [];
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
				fallbackToBrowser: row.fallbackToBrowser
			});
			created.push(job);
		} catch (error) {
			errors.push({
				index: i,
				code: error instanceof Error ? error.message.slice(0, 80) : "UPLOAD_FAILED"
			});
		}
	}
	return {
		jobs: created,
		skipped: input.jobs.length - batch.length,
		errors,
		maxBatch: policies.socialMaxBulkJobsPerRun
	};
}
function platformsFrom(payload) {
	const raw = payload.platforms;
	if (!Array.isArray(raw)) return [];
	return raw.map(asPlatform).filter((row) => Boolean(row));
}
function preferredRailFrom(payload) {
	const raw = payload.preferredRail ?? payload.preferred_rail;
	return raw === "API" || raw === "BROWSER" ? raw : "AUTO";
}
async function handleSocialAction(action, payload, actorId) {
	switch (action) {
		case "social.get_machine_status": return socialGetMachineStatus();
		case "social.start_machine": return socialStartMachine({
			actorId,
			waitUntilReady: payload.waitUntilReady === true
		});
		case "social.stop_machine": return socialStopMachine({ actorId });
		case "social.set_auto_stop": {
			const minutes = Number(payload.minutes ?? payload.autoStopMinutes);
			if (!Number.isFinite(minutes)) throw new Error("VALIDATION");
			return socialSetAutoStop({
				actorId,
				minutes
			});
		}
		case "social.ensure_computer_use": return socialEnsureComputerUse({ actorId });
		case "social.get_desktop_preview": return socialGetDesktopPreview();
		case "social.take_screenshot": return socialTakeScreenshot({ actorId });
		case "social.list_open_windows": return socialListOpenWindows();
		case "social.list_platforms": return socialListPlatforms();
		case "social.get_publisher_status": return socialGetPublisherStatus();
		case "social.get_platform_status": return socialGetPlatformStatus(payload.platform ?? payload.id);
		case "social.mark_platform_session": return socialMarkPlatformSession({
			actorId,
			platform: payload.platform ?? payload.id,
			state: payload.state ?? payload.sessionStatus
		});
		case "social.open_platform": return socialOpenPlatform({
			actorId,
			platform: payload.platform ?? payload.id
		});
		case "social.check_session_health": return socialCheckSessionHealth({
			actorId,
			platform: payload.platform
		});
		case "social.list_uploadable_assets": return socialListUploadableAssets(typeof payload.clientId === "string" ? payload.clientId : void 0);
		case "social.resolve_asset": {
			const clientId = String(payload.clientId ?? "");
			const assetId = String(payload.assetId ?? payload.id ?? "");
			if (!clientId || !assetId) throw new Error("VALIDATION");
			return socialResolveAsset({
				clientId,
				assetId
			});
		}
		case "social.create_upload_job": {
			const clientId = String(payload.clientId ?? "");
			const platforms = platformsFrom(payload);
			if (!clientId || platforms.length === 0) throw new Error("VALIDATION");
			const policies = await readPlaybookPolicies();
			return createUploadJobInternal({
				actorId,
				clientId,
				assetId: typeof payload.assetId === "string" ? payload.assetId : void 0,
				mediaAssetId: typeof payload.mediaAssetId === "string" ? payload.mediaAssetId : void 0,
				platforms,
				caption: typeof payload.caption === "string" ? payload.caption : void 0,
				mediaUrl: typeof payload.mediaUrl === "string" ? payload.mediaUrl : null,
				mode: payload.mode === "publish" || payload.mode === "draft" ? payload.mode : void 0,
				idempotencyKey: typeof payload.idempotencyKey === "string" ? payload.idempotencyKey : void 0,
				allowAutoStart: policies.socialAutoStartForUpload,
				requireLoggedIn: policies.socialRequireLoggedInPlatformsOnly,
				preferredRail: preferredRailFrom(payload),
				fallbackToBrowser: typeof payload.fallbackToBrowser === "boolean" ? payload.fallbackToBrowser : typeof payload.fallback_to_browser === "boolean" ? payload.fallback_to_browser : void 0,
				youtube: parseYoutubeJobOptions(payload)
			});
		}
		case "social.get_upload_job": return socialGetUploadJob(String(payload.id ?? payload.jobId ?? ""));
		case "social.list_upload_jobs": return socialListUploadJobs({
			clientId: typeof payload.clientId === "string" ? payload.clientId : void 0,
			platform: typeof payload.platform === "string" ? payload.platform : void 0,
			status: typeof payload.status === "string" ? payload.status : void 0,
			since: typeof payload.since === "string" ? payload.since : void 0
		});
		case "social.retry_upload_job": return socialRetryUploadJob({
			actorId,
			jobId: String(payload.id ?? payload.jobId ?? "")
		});
		case "social.cancel_upload_job": return socialCancelUploadJob({
			actorId,
			jobId: String(payload.id ?? payload.jobId ?? "")
		});
		case "social.list_posts": return socialListPosts({
			clientId: typeof payload.clientId === "string" ? payload.clientId : void 0,
			platform: typeof payload.platform === "string" ? payload.platform : void 0,
			status: typeof payload.status === "string" ? payload.status : void 0
		});
		case "social.get_post": return socialGetPost(String(payload.id ?? payload.postId ?? ""));
		case "social.plan_distribution": {
			const clientId = String(payload.clientId ?? "");
			if (!clientId) throw new Error("VALIDATION");
			return socialPlanDistribution({
				clientId,
				assetId: typeof payload.assetId === "string" ? payload.assetId : void 0
			});
		}
		case "social.bulk_create_upload_jobs": return socialBulkCreateUploadJobs({
			actorId,
			jobs: (Array.isArray(payload.jobs) ? payload.jobs : []).map((row) => {
				const rec = row && typeof row === "object" ? row : {};
				return {
					clientId: String(rec.clientId ?? ""),
					assetId: typeof rec.assetId === "string" ? rec.assetId : void 0,
					platforms: Array.isArray(rec.platforms) ? rec.platforms.map(asPlatform).filter((item) => Boolean(item)) : [],
					caption: typeof rec.caption === "string" ? rec.caption : void 0,
					mode: rec.mode === "publish" || rec.mode === "draft" ? rec.mode : void 0,
					idempotencyKey: typeof rec.idempotencyKey === "string" ? rec.idempotencyKey : void 0,
					preferredRail: preferredRailFrom(rec),
					fallbackToBrowser: typeof rec.fallbackToBrowser === "boolean" ? rec.fallbackToBrowser : void 0
				};
			})
		});
		case "social.get_cost_guard": return socialGetCostGuard();
		case "social.force_stop_if_running": return socialForceStop({ actorId });
		default: return;
	}
}
//#endregion
export { createUploadJobInternal, handleSocialAction, rejectUploadJobAfterApproval, resumeUploadJobAfterApproval, socialCancelUploadJob, socialRetryUploadJob };
