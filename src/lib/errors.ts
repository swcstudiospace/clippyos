/** Structured client error hook — ready for future observability tooling. */
export type ClientErrorEvent = {
  message: string;
  source?: string;
  at: string;
};

export function captureClientError(
  error: unknown,
  info?: { source?: string },
): ClientErrorEvent {
  const message =
    error instanceof Error
      ? error.message || "An unexpected error occurred"
      : "An unexpected error occurred";
  const event: ClientErrorEvent = {
    message,
    source: info?.source,
    at: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent<ClientErrorEvent>("agency-admin:error", { detail: event }),
    );
  }
  console.error("[agency-admin]", info?.source ?? "client", message);
  return event;
}

export function userFacingErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === "Unauthorized") {
    return "Please sign in to continue.";
  }
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return "Please sign in to continue.";
  }
  if (error instanceof Error && error.message === "TOKEN_REVOKED") {
    return "That MCP token was revoked. Reconnect with OAuth in Settings → ClippyOS MCP, or mint a new Hermes key.";
  }
  if (error instanceof Error && error.message === "Forbidden") {
    return "You do not have access to that.";
  }
  if (error instanceof Error && error.message === "KEY_MISSING") {
    return "That connector token is no longer available.";
  }
  if (error instanceof Error && error.message === "TEAM_MEMBER_MISSING") {
    return "That teammate is no longer on the roster.";
  }
  if (error instanceof Error && error.message === "GROK_BOT_NOT_CONNECTED") {
    return "Connect Grok Bot in Settings first — add the ClippyOS MCP URL at grok.com/connectors and approve OAuth.";
  }
  if (error instanceof Error && error.message === "GROK_BOT_UNAVAILABLE") {
    return "Grok Bot isn’t online. Open the Bot app so it can pick up ClippyOS work.";
  }
  if (error instanceof Error && /invalid origin/i.test(error.message)) {
    return "This site isn’t recognized for sign-in. Open ClippyOS from os.swcstudio.space or clippyos.grok.me and try again.";
  }
  if (
    error instanceof Error &&
    /sign-out failed|sign-out timed out|unable to log out/i.test(error.message)
  ) {
    return "Couldn’t sign out. Check the connection and try again — you are still signed in.";
  }
  if (error instanceof Error && error.message === "INVALID_YOUTUBE_URL") {
    return "Use a valid YouTube channel or video URL.";
  }
  if (error instanceof Error && error.message === "CUSTOM_PLAN_LABEL") {
    return "Custom plans need a short label.";
  }
  if (error instanceof Error && error.message === "CUSTOM_FEE") {
    return "Custom monthly fee must be a multiple of 1,000, from 0 to 20,000.";
  }
  if (error instanceof Error && error.message === "DATA_UNAVAILABLE") {
    return "Couldn’t reach workspace data. Try again.";
  }
  if (error instanceof Error && error.message === "AI_UNAVAILABLE") {
    return "This tool will be available once analysis is connected.";
  }
  if (error instanceof Error && error.message === "AI_RATE_LIMIT") {
    return "Capacity — retrying in a moment. xAI rate limits use backoff, not a hard stop.";
  }
  if (error instanceof Error && error.message === "AI_TIER_GATED") {
    return "This SuperGrok tier cannot run inference. Connect the metered xAI API key in Settings.";
  }
  if (error instanceof Error && error.message === "SKILL_SECRETS_FORBIDDEN") {
    return "That skill package looks like it contains a secret. Remove keys and try again.";
  }
  if (error instanceof Error && error.message === "SKILL_PENDING") {
    return "That skill is waiting for review.";
  }
  if (error instanceof Error && error.message === "MACHINE_STOPPED") {
    return "The Social Machine is stopped. Start it for Computer Use, or connect a publisher API in Settings to post without the VM.";
  }
  if (error instanceof Error && error.message === "AGENT_BUSY") {
    return "Another agent run is already in progress. Cancel it or wait.";
  }
  if (error instanceof Error && error.message === "AUTOMATION_DISABLED") {
    return "Automation is off. Enable it in Settings → Automation.";
  }
  if (error instanceof Error && error.message === "EVIDENCE_REQUIRED") {
    return "Stage changes need a short note unless the evidence policy is on.";
  }
  if (error instanceof Error && error.message === "PAYMENT_ALREADY_PAID") {
    return "That payment was already marked paid.";
  }
  if (error instanceof Error && error.message === "PAYMENT_MISSING") {
    return "That payment is no longer available.";
  }
  if (error instanceof Error && error.message === "AWAITING_APPROVAL") {
    return "This publish is waiting for approval.";
  }
  if (error instanceof Error && error.message === "APPROVAL_MISSING") {
    return "That approval request is no longer available.";
  }
  if (error instanceof Error && error.message === "APPROVAL_NOT_PENDING") {
    return "That request was already decided.";
  }
  if (error instanceof Error && error.message === "SELF_APPROVE_DENIED") {
    return "You can’t approve your own request. Another admin needs to sign off.";
  }
  if (error instanceof Error && error.message === "APPROVAL_FORBIDDEN") {
    return "You don’t have permission to decide that request.";
  }
  if (error instanceof Error && error.message === "APPROVAL_EXPIRED") {
    return "That approval request expired.";
  }
  if (error instanceof Error && error.message === "PORTAL_DISABLED") {
    return "The client portal is turned off.";
  }
  if (error instanceof Error && error.message === "PORTAL_RATE_LIMIT") {
    return "Too many tries. Wait a few minutes and try again.";
  }
  if (error instanceof Error && error.message === "PORTAL_EMAIL_INVALID") {
    return "Enter a valid email address.";
  }
  if (error instanceof Error && error.message === "PORTAL_EMAIL_IN_USE") {
    return "That email is already tied to another client portal.";
  }
  if (error instanceof Error && error.message === "PORTAL_INVITE_INVALID") {
    return "That invite isn’t valid.";
  }
  if (error instanceof Error && error.message === "PORTAL_INVITE_EXPIRED") {
    return "That invite expired. Ask your producer for a new link.";
  }
  if (error instanceof Error && error.message === "PORTAL_PASSWORD") {
    return "Use a password of at least 8 characters.";
  }
  if (error instanceof Error && error.message === "PORTAL_LOGIN_FAILED") {
    return "Email or password doesn’t match.";
  }
  if (error instanceof Error && error.message === "PORTAL_USER_MISSING") {
    return "That portal user is no longer available.";
  }
  if (error instanceof Error && error.message === "PORTAL_NOTE_REQUIRED") {
    return "Add a short note when requesting changes.";
  }
  if (error instanceof Error && error.message === "PORTAL_PREVIEW_READONLY") {
    return "Preview is read-only. Approvals stay with the client login.";
  }
  if (error instanceof Error && error.message === "PORTAL_APPROVALS_OFF") {
    return "Portal approvals are turned off in Settings.";
  }
  if (error instanceof Error && error.message === "PORTAL_DOWNLOAD_DENIED") {
    return "Downloads are turned off for this portal.";
  }
  if (error instanceof Error && error.message === "PORTAL_ASSET_MISSING") {
    return "That file isn’t available in this portal.";
  }
  if (error instanceof Error && error.message === "LEAD_MISSING") {
    return "That lead is no longer available.";
  }
  if (error instanceof Error && error.message === "EMPTY_MESSAGE") {
    return "Write a message before sending.";
  }
  if (error instanceof Error && error.message === "THREAD_MISSING") {
    return "That conversation is no longer available.";
  }
  if (error instanceof Error && error.message === "CHANNEL_NOT_CONFIGURED") {
    return "Connect Telegram or WhatsApp in Settings before sending.";
  }
  if (error instanceof Error && error.message === "CHANNEL_UNAVAILABLE") {
    return "That channel rejected the message. Check the bot token or Cloud API credentials.";
  }
  if (error instanceof Error && error.message === "PROXY_MISSING") {
    return "Pick a country so the Social Machine can open social apps from your location.";
  }
  if (error instanceof Error && error.message === "PROXY_UNAVAILABLE") {
    return "Couldn’t match that location automatically. Try another country, or paste credentials in Settings.";
  }
  if (error instanceof Error && error.message === "DEMO_RATE_LIMIT") {
    return "Wait a few seconds before sending another demo request.";
  }
  if (error instanceof Error && error.message === "IPFS_UNAVAILABLE") {
    return "Content pinning rejected those credentials. Clips still live in immutable cloud storage.";
  }
  if (error instanceof Error && error.message === "SESSION_MISSING") {
    return "That thumbnail session is no longer available.";
  }
  if (error instanceof Error && error.message === "CLIENT_REQUIRED") {
    return "Select a client before generating a thumbnail.";
  }
  if (error instanceof Error && error.message === "CLIENT_MISSING") {
    return "That client is no longer available.";
  }
  if (error instanceof Error && error.message === "CHANNEL_MISSING") {
    return "Add a YouTube channel URL before generating titles.";
  }
  if (error instanceof Error && error.message === "YOUTUBE_UNAVAILABLE") {
    return "Couldn’t read this channel’s uploads. Retry in a moment.";
  }
  if (error instanceof Error && error.message === "NO_LONG_FORM") {
    return "No long-form videos (4 minutes or longer) were found on this channel.";
  }
  if (error instanceof Error && error.message === "RATING_INVALID") {
    return "Rate the thumbnail from 1 to 5.";
  }
  if (error instanceof Error && error.message === "IMAGE_FAILED") {
    return "The image didn’t come through. Retry.";
  }
  if (error instanceof Error && error.message === "HIGGSFIELD_UNAVAILABLE") {
    return "This tool will be available once you connect your API key.";
  }
  if (error instanceof Error && error.message === "OVERLAY_TOO_LARGE") {
    return "That overlay is too large. Shorten the text and try again.";
  }
  if (error instanceof Error && error.message === "UNTRUSTED_IMAGE") {
    return "That image can’t be used here.";
  }
  if (error instanceof Error && error.message === "GENERATION_FAILED") {
    return "The reply didn’t come through. Retry to send the same thread.";
  }
  if (error instanceof Error && error.message === "YOUTUBE_KEY_MISSING") {
    return "Add a YouTube Data API key in Settings to pull live stats — or enter a snapshot manually.";
  }
  if (error instanceof Error && error.message === "YOUTUBE_QUOTA") {
    return "YouTube API quota reached — try again later.";
  }
  if (error instanceof Error && error.message === "YOUTUBE_CHANNEL_NOT_FOUND") {
    return "Couldn’t find that YouTube channel.";
  }
  if (error instanceof Error && error.message === "SNAPSHOT_EXISTS") {
    return "A snapshot already exists for that date. Confirm to overwrite it.";
  }
  if (error instanceof Error && error.message === "OAUTH_START_FAILED") {
    return "Couldn’t start SuperGrok sign-in. Retry in a moment.";
  }
  if (error instanceof Error && error.message === "AI_TIER_GATED") {
    return "SuperGrok OAuth is connected, but this account’s tier cannot run inference. Use the metered xAI API key in Settings → LLM Providers.";
  }
  if (error instanceof Error && error.message === "SKILL_MISSING") {
    return "That skill is no longer available.";
  }
  if (error instanceof Error && error.message === "SKILL_DISABLED") {
    return "That skill is disabled.";
  }
  if (error instanceof Error && error.message === "SKILL_PENDING") {
    return "That skill is waiting for human approval.";
  }
  if (error instanceof Error && error.message === "SKILL_EXEC_FAILED") {
    return "The skill didn’t finish in the sandbox. Check the run log.";
  }
  if (error instanceof Error && error.message === "SKILL_TOO_LARGE") {
    return "That skill script is too large to run.";
  }
  if (error instanceof Error && error.message === "ADDON_LOCKED") {
    return "That add-on is required and can’t be turned off.";
  }
  if (error instanceof Error && error.message === "ADDON_MISSING") {
    return "That add-on isn’t installed.";
  }
  if (error instanceof Error && error.message === "ADDON_INVALID") {
    return "That manifest isn’t valid. Check schemaVersion and permissions.";
  }
  if (error instanceof Error && error.message === "ADDON_BUILTIN") {
    return "Built-in add-ons can’t be overwritten. Disable or install a new id.";
  }
  if (error instanceof Error && error.message === "ADDON_REQUIRED") {
    return "That add-on is required by the OS.";
  }
  if (error instanceof Error && error.message === "KNOWLEDGE_TOO_LARGE") {
    return "That paste is larger than the 2 MB training limit. Split it and send again — nothing was stored.";
  }
  if (error instanceof Error && error.message === "EXTRACTION_FAILED") {
    return "Couldn’t extract a principle from that paste. Nothing was stored. Retry.";
  }
  if (error instanceof Error && error.message === "METRICS_UNAVAILABLE") {
    return "Couldn’t pull stats from the platform. Enter them manually — missing is not zero.";
  }
  if (error instanceof Error && error.message === "METRICS_EMPTY") {
    return "Enter at least one metric. Unknown stays blank, not zero.";
  }
  if (error instanceof Error && error.message === "NO_EXTERNAL_ID") {
    return "This post has no platform id yet, so stats can’t be pulled.";
  }
  if (error instanceof Error && error.message === "NO_PERFORMANCE") {
    return "No performance snapshots on this asset yet. Refresh stats or enter them manually.";
  }
  if (error instanceof Error && error.message === "PROPOSAL_MISSING") {
    return "That learning proposal is no longer available.";
  }
  if (error instanceof Error && error.message === "PROPOSAL_NOT_PENDING") {
    return "That proposal was already decided.";
  }
  if (error instanceof Error && error.message === "PROPOSAL_DUPLICATE") {
    return "A similar principle is already pending or approved.";
  }
  if (error instanceof Error && error.message === "KEY_TOO_SHORT") {
    return "That key looks too short. Paste the full value from the provider.";
  }
  if (error instanceof Error && error.message === "SUPER_ADMIN_UNSET") {
    return "Set a Super Admin password in Settings → Team access first.";
  }
  if (error instanceof Error && error.message === "SUPER_ADMIN_INVALID") {
    return "That Super Admin password isn’t right.";
  }
  if (error instanceof Error && error.message === "SUPER_ADMIN_LOCKED") {
    return "Too many Super Admin attempts. Wait a few minutes.";
  }
  if (error instanceof Error && error.message === "HTTPS_ONLY") {
    return "Outbound webhook destinations must use HTTPS.";
  }
  if (error instanceof Error && error.message === "KEY_MISSING") {
    return "That API key is no longer available.";
  }
  if (error instanceof Error && error.message === "AUTOMATION_PAUSED") {
    return "Automation is paused. Human UI is still live.";
  }
  if (error instanceof Error && error.message === "DISCORD_UNAVAILABLE") {
    return "Discord rejected that bot token. Check the token and intents.";
  }
  if (error instanceof Error && error.message === "NOTION_UNAVAILABLE") {
    return "Notion rejected that token. Confirm the integration can access a page.";
  }
  if (error instanceof Error && error.message === "DAYTONA_UNAVAILABLE") {
    return "Connect Daytona in Settings for Computer Use, or connect a publisher API to post without the machine.";
  }
  if (error instanceof Error && error.message === "AIRWALLEX_UNAVAILABLE") {
    return "Connect Airwallex in Settings. Test Connection never opens checkout.";
  }
  if (error instanceof Error && error.message === "AIRWALLEX_CHECKOUT_FAILED") {
    return "Airwallex couldn’t create checkout. Confirm price IDs, legal entity, and payment account.";
  }
  if (error instanceof Error && error.message === "AIRWALLEX_PRICE_MISSING") {
    return "Save an Airwallex price ID for that plan in Settings → Integrations.";
  }
  if (error instanceof Error && error.message === "BILLING_EMAIL_REQUIRED") {
    return "Your account needs an email before checkout.";
  }
  if (error instanceof Error && error.message === "RESET_INVALID") {
    return "That reset link is invalid or expired.";
  }
  if (error instanceof Error && error.message === "MACHINE_STOPPED") {
    return "The Social Machine is stopped. Start it for Computer Use, or connect a publisher API in Settings to post without the VM.";
  }
  if (error instanceof Error && error.message === "UPLOAD_IN_PROGRESS") {
    return "Another upload is already running. Wait or cancel it first.";
  }
  if (error instanceof Error && error.message === "ASSET_MISSING") {
    return "That asset isn’t eligible for this client.";
  }
  if (error instanceof Error && error.message === "PLATFORM_NEEDS_LOGIN") {
    return "Log into that platform in the Social Machine first.";
  }
  if (error instanceof Error && error.message === "COMPUTER_USE_UNAVAILABLE") {
    return "The desktop stack isn’t available. Try Start again.";
  }
  if (error instanceof Error && error.message === "JOB_MISSING") {
    return "That upload job is no longer available.";
  }
  if (error instanceof Error && error.message === "JOB_CANCELLED") {
    return "That upload job was cancelled.";
  }
  if (error instanceof Error && error.message === "UPLOAD_SESSION_MISSING") {
    return "The resumable upload session expired. Retry to start a new transfer.";
  }
  if (error instanceof Error && error.message === "POST_MISSING") {
    return "That social post is no longer available.";
  }
  if (error instanceof Error && error.message === "UPLOAD_IN_PROGRESS") {
    return "An upload is already running. Wait for it to finish.";
  }
  if (error instanceof Error && error.message === "AUTO_STOP_INVALID") {
    return "Auto-stop must be between 5 and 240 minutes.";
  }
  if (error instanceof Error && error.message === "POST_MISSING") {
    return "That social post is no longer available.";
  }
  if (error instanceof Error && error.message === "UPLOAD_FAILED") {
    return "The upload didn’t finish. Retry once the machine is running, or connect the API publisher.";
  }
  if (error instanceof Error && error.message === "PUBLISHER_APP_MISSING") {
    return "Save the platform app ID and secret in Settings before connecting.";
  }
  if (error instanceof Error && error.message === "PUBLISHER_NOT_CONNECTED") {
    return "Connect that platform in Settings → Integrations.";
  }
  if (error instanceof Error && error.message === "PUBLISHER_NOT_ELIGIBLE") {
    return "That account can’t publish via API. Use Computer Use, or pick a professional Instagram / audited TikTok app.";
  }
  if (error instanceof Error && error.message === "PUBLISHER_TOKEN_EXPIRED") {
    return "The platform token expired. Reconnect in Settings → Integrations.";
  }
  if (error instanceof Error && error.message === "PUBLISHER_UNAVAILABLE") {
    return "The platform API didn’t respond. Retry, or use Computer Use.";
  }
  if (error instanceof Error && error.message === "PUBLISHER_RATE_LIMIT") {
    return "The platform rate-limited this publish. Try again in a minute.";
  }
  if (error instanceof Error && error.message === "PUBLISHER_REJECTED") {
    return "The platform rejected the publish. Check the asset, or use Computer Use.";
  }
  if (error instanceof Error && error.message === "IG_PROFESSIONAL_REQUIRED") {
    return "Instagram API publishing needs a professional (Business or Creator) account linked to a Facebook Page.";
  }
  if (error instanceof Error && error.message === "IG_APP_REVIEW") {
    return "Instagram content publish needs Meta App Review, or the app is still in Development mode (role-based test users only).";
  }
  if (error instanceof Error && error.message === "IG_CONTAINER_FAILED") {
    return "Instagram couldn’t finish processing the Reel. Try an MP4 around 9:16.";
  }
  if (error instanceof Error && error.message === "IG_MEDIA_UNSUPPORTED") {
    return "Instagram Reels API needs a short MP4 video.";
  }
  if (error instanceof Error && error.message === "IG_ACCOUNT_MISSING") {
    return "Select a professional Instagram account after connecting.";
  }
  if (error instanceof Error && error.message === "IG_PUBLIC_URL_REQUIRED") {
    return "Instagram API needs a public HTTPS media URL. Use Computer Use for local or data URLs.";
  }
  if (error instanceof Error && error.message === "TIKTOK_AUDIT_REQUIRED") {
    return "TikTok rejected Direct Post (app audit). Inbox drafts or Computer Use still work.";
  }
  if (error instanceof Error && error.message === "TIKTOK_MEDIA_UNSUPPORTED") {
    return "TikTok API publishing needs an MP4 video.";
  }
  if (error instanceof Error && error.message === "X_API_BASE_INVALID") {
    return "X API host must be https://api.x.com (or https://api.twitter.com).";
  }
  if (error instanceof Error && error.message === "YOUTUBE_QUOTA") {
    return "YouTube API quota is exhausted for today. Retry later, or use Computer Use.";
  }
  if (error instanceof Error && error.message === "YT_INVALID_METADATA") {
    return "YouTube rejected the title, description, or tags. Shorten or clean them and retry.";
  }
  if (error instanceof Error && error.message === "YT_MEDIA_UNSUPPORTED") {
    return "YouTube API upload needs an MP4 video.";
  }
  if (error instanceof Error && error.message === "NO_PUBLISH_RAIL") {
    return "Connect a publisher API in Settings, or connect Daytona for Computer Use.";
  }
  if (
    error instanceof Error &&
    (error.message === "OAUTH_STATE" || error.message === "OAUTH_EXCHANGE")
  ) {
    return "Couldn’t finish the platform connect. Start Connect again from Settings.";
  }
  if (error instanceof Error && error.message === "ASSET_NOT_READY") {
    return "That library asset is still processing.";
  }
  if (error instanceof Error && error.message === "CAPTION_ENGINE_MISSING") {
    return "Connect transcription in Settings, or upload an SRT.";
  }
  if (error instanceof Error && error.message === "CAPTION_NOT_READY") {
    return "Captions aren’t ready yet. Generate or upload an SRT first.";
  }
  if (error instanceof Error && error.message === "SRT_INVALID") {
    return "That SRT couldn’t be parsed. Check the timings and try again.";
  }
  if (error instanceof Error && error.message === "FFMPEG_UNAVAILABLE") {
    return "The render worker isn’t available. Check Settings → Media pipeline.";
  }
  if (error instanceof Error && error.message === "RENDER_FAILED") {
    return "The render didn’t finish. Retry, or simplify the preset.";
  }
  if (error instanceof Error && error.message === "RENDER_BUSY") {
    return "A render is already running. Wait or raise the concurrent limit in Settings.";
  }
  if (error instanceof Error && error.message === "LIBRARY_KIND_UNSUPPORTED") {
    return "That asset kind doesn’t support this action.";
  }
  if (error instanceof Error && error.message === "UNTRUSTED_URL") {
    return "That URL isn’t on the import allowlist.";
  }
  if (error instanceof Error && error.message === "MEDIA_TOO_LARGE") {
    return "That file is larger than the workspace upload limit.";
  }
  if (error instanceof Error && error.message === "LINEAR_NOT_CONFIGURED") {
    return "Connect Linear in Settings first.";
  }
  if (error instanceof Error && error.message === "LINEAR_UNAUTHORIZED") {
    return "Linear rejected that token. Reconnect in Settings.";
  }
  if (error instanceof Error && error.message === "LINEAR_UNAVAILABLE") {
    return "Linear didn’t respond. Agency jobs are unchanged.";
  }
  if (error instanceof Error && error.message === "LINEAR_RATE_LIMIT") {
    return "Linear is rate-limited. Retry shortly.";
  }
  if (error instanceof Error && error.message === "LINEAR_TEAM_REQUIRED") {
    return "Select a Linear team in Settings first.";
  }
  if (error instanceof Error && error.message === "LINEAR_PROJECT_REQUIRED") {
    return "Select a Linear project in Settings first.";
  }
  if (error instanceof Error && error.message === "LINEAR_ISSUE_MISSING") {
    return "That Linear issue isn’t linked yet.";
  }
  if (error instanceof Error && error.message === "LINEAR_OAUTH_APP_MISSING") {
    return "Save a Linear OAuth client ID and secret first.";
  }
  if (
    error instanceof Error &&
    (error.message === "Could not sign in" ||
      error.message === "Could not create account")
  ) {
    return `${error.message}. Check your details and try again.`;
  }
  if (
    error instanceof Error &&
    error.message.length > 0 &&
    error.message.length < 180 &&
    /[a-z]/.test(error.message) &&
    error.message.includes(" ")
  ) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
