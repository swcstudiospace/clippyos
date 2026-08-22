import type { IntegrationId } from "@/lib/integrations";

export type GuideStep = {
  title: string;
  body: string;
  copy?: { label: string; value: string };
};

export type GuideDef = {
  id: IntegrationId;
  title: string;
  time: string;
  intro: string;
  steps: GuideStep[];
  checklist: string[];
};

export const GUIDES: Record<IntegrationId, GuideDef> = {
  ai: {
    id: "ai",
    title: "AI API",
    time: "~2 min",
    intro:
      "Set this up first — it powers ideation, thumbnails, channel analysis, and the Discord agent.",
    steps: [
      {
        title: "Create an xAI / Grok API key",
        body: "Open the xAI console, create an API key, and copy it. SuperGrok subscribers can instead use Connect SuperGrok on the card (same device flow as Grok Build).",
        copy: { label: "Console", value: "https://console.x.ai" },
      },
      {
        title: "Paste the key",
        body: "ClippyOS → Settings → Integrations → AI API. Paste the key and Save. The value is stored server-side and never shown again in full.",
      },
      {
        title: "Test connection",
        body: "Use Test Connection on the card or in this guide. A successful ping marks the integration Connected.",
      },
    ],
    checklist: [
      "Key created at the provider console (or SuperGrok connected)",
      "Key pasted and saved in Integrations",
      "Test Connection returns Connected",
    ],
  },
  higgsfield: {
    id: "higgsfield",
    title: "Higgsfield",
    time: "~3 min",
    intro:
      "Thumbnails generate 16:9 4K stills with nano-banana-pro. You need both a key ID and a secret.",
    steps: [
      {
        title: "Create Higgsfield credentials",
        body: "In the Higgsfield dashboard, create an API key and secret.",
        copy: { label: "Higgsfield", value: "https://higgsfield.ai" },
      },
      {
        title: "Paste both values",
        body: "ClippyOS → Settings → Integrations → Higgsfield. Paste the Key ID and Secret, then Save.",
      },
      {
        title: "Test connection",
        body: "Run Test Connection. Thumbnails stay 16:9 and 4K. If Higgsfield is out of credits, generation can fall back to the workspace image model.",
      },
    ],
    checklist: [
      "Key ID and secret created",
      "Both saved in the Higgsfield card",
      "Test Connection succeeds",
    ],
  },
  youtube: {
    id: "youtube",
    title: "YouTube Data API v3",
    time: "~5 min",
    intro: "Used for public subscriber and view snapshots. Watch time and CTR stay manual.",
    steps: [
      {
        title: "Enable the API",
        body: "Google Cloud Console → APIs & Services → enable YouTube Data API v3.",
        copy: {
          label: "Cloud Console",
          value: "https://console.cloud.google.com/apis/library/youtube.googleapis.com",
        },
      },
      {
        title: "Create an API key",
        body: "Credentials → Create credentials → API key. Restrict to YouTube Data API v3 if you want.",
      },
      {
        title: "Paste and test",
        body: "ClippyOS → Settings → Integrations → YouTube Data API. Save, then Test Connection.",
      },
    ],
    checklist: [
      "YouTube Data API v3 enabled",
      "API key created",
      "Key saved and Test Connection succeeds",
    ],
  },
  discord: {
    id: "discord",
    title: "Discord bot",
    time: "~5 min",
    intro:
      "The Status Agent is read-only. It never sends messages. Discord server names should closely match Client names.",
    steps: [
      {
        title: "Create an application",
        body: "Discord Developer Portal → New Application → Bot → Reset Token → copy the token.",
        copy: { label: "Developer Portal", value: "https://discord.com/developers/applications" },
      },
      {
        title: "Enable Message Content Intent",
        body: "Bot → Privileged Gateway Intents → Message Content Intent. Required to read message text.",
      },
      {
        title: "Invite with read-only permissions",
        body: "OAuth2 → URL Generator. Scope = bot. Permissions = View Channels + Read Message History only. Do not grant Send Messages. Invite the bot to each client Discord server.",
        copy: {
          label: "Permission integer",
          value: "66560",
        },
      },
      {
        title: "Paste the token",
        body: "ClippyOS → Settings → Integrations → Discord Bot. Save, then Test Connection. Name each Discord server after the client so the agent can match them.",
      },
    ],
    checklist: [
      "Bot token copied",
      "Message Content Intent enabled",
      "Bot invited with View Channels + Read Message History only",
      "Token saved and Test Connection succeeds",
    ],
  },
  notion: {
    id: "notion",
    title: "Notion",
    time: "~4 min",
    intro: "Optional. Lets operators attach a Notion integration token for briefing pages.",
    steps: [
      {
        title: "Create an internal integration",
        body: "Notion → Settings → Connections → Develop or manage integrations → New integration. Copy the token.",
        copy: { label: "My integrations", value: "https://www.notion.so/my-integrations" },
      },
      {
        title: "Share pages",
        body: "Open the pages or databases the agency should read and add the integration under connections.",
      },
      {
        title: "Paste and test",
        body: "ClippyOS → Settings → Integrations → Notion. Save, then Test Connection.",
      },
    ],
    checklist: [
      "Internal integration created",
      "Pages shared with the integration",
      "Token saved and Test Connection succeeds",
    ],
  },
  linear: {
    id: "linear",
    title: "Linear",
    time: "~10 min",
    intro:
      "Linear is the human Kanban for the AI Clipping Dashboard. Agency Admin stays the system of record for clients and media. Failed jobs can open tickets here — Linear outages never block a publish.",
    steps: [
      {
        title: "Create an API key",
        body: "Linear → Settings → API. Create a personal API key (or an OAuth app with read, write, issues:create). Prefer a dedicated project named AI Clipping Dashboard.",
        copy: { label: "Linear API", value: "https://linear.app/settings/api" },
      },
      {
        title: "Paste and Test",
        body: "Settings → Integrations → Linear, or the Linear section below. Save the key, then Test Connection. Test fetches viewer, teams, and projects — it never creates an issue.",
      },
      {
        title: "Select team and project",
        body: "Bind the Agency team and the AI Clipping Dashboard project. Load workflow states and map Backlog, Ready, In Progress, In Review, and Done.",
      },
      {
        title: "Optional: auto-issue on fail",
        body: "Turn on LINEAR_ENABLED and Auto-issue on fail so social/render/agent failures open a ticket with a deep link. Sync linked jobs is off by default.",
      },
    ],
    checklist: [
      "API key or OAuth app created in Linear",
      "Test Connection shows the connected user",
      "Team + project selected",
      "Five Kanban columns mapped to workflow states",
    ],
  },
  x: {
    id: "x",
    title: "X (API publish)",
    time: "~10 min",
    intro:
      "Connect a user-context X app so Social can post clips via the official API. App-only Bearer tokens cannot tweet. Computer Use remains the fallback for CAPTCHA or missing API access.",
    steps: [
      {
        title: "Create a Project and App",
        body: "In the X Developer Portal, create a Project and an App with OAuth 2.0. User authentication is required — app-only Bearer tokens cannot post.",
        copy: { label: "X Developer Portal", value: "https://developer.x.com" },
      },
      {
        title: "Set the callback URL",
        body: "In User authentication settings, add this callback. Copy it from the X (API publish) card if you need the full origin.",
        copy: { label: "Callback path", value: "/api/oauth/social" },
      },
      {
        title: "Enable user auth and scopes",
        body: "Turn on OAuth 2.0. Request tweet.read, tweet.write, users.read, media.write, and offline.access — least privilege for media upload + posting.",
      },
      {
        title: "Save Client ID and secret",
        body: "Paste Client ID and Client Secret on the X (API publish) card. API host defaults to https://api.x.com. Save, then Connect X.",
      },
      {
        title: "Connect and Test",
        body: "Connect X opens the X consent screen (user context). Test Connection calls users/me and never posts. Disconnect clears tokens only.",
      },
    ],
    checklist: [
      "Project/App created in the X Developer Portal",
      "Callback URL saved on the app",
      "User auth + media.write / tweet.write enabled",
      "Connect X completes and Test shows the connected user",
    ],
  },
  daytona: {
    id: "daytona",
    title: "Daytona (Computer Use / Social)",
    time: "~5 min",
    intro:
      "Powers the on-demand Windows Social Machine. The machine stays off until you press Start. Hibernate pauses a hot snapshot. Test Connection only checks the API — it never starts a VM.",
    steps: [
      {
        title: "Create a Daytona API key",
        body: "Open the Daytona dashboard, create an API key, and copy it. Windows-large is the production path for Instagram, X, and TikTok web sessions.",
        copy: { label: "Daytona", value: "https://app.daytona.io" },
      },
      {
        title: "Paste into ClippyOS",
        body: "Settings → Integrations → Daytona. Paste the API key. Optional: US or EU region, windows-large, idle hibernate minutes, and a residential AU HTTPS proxy (host/port/user).",
      },
      {
        title: "Test Connection (and Test proxy)",
        body: "Test Connection lists sandboxes and never starts a machine. Test proxy uses the residential URL through an HTTPS agent and never starts a VM. Open Social and press Start only when you are ready to post.",
      },
    ],
    checklist: [
      "API key created at app.daytona.io",
      "Key saved in the Daytona card",
      "Test Connection succeeds without starting a VM",
      "Social → Start is used only when you need the desktop",
    ],
  },
  telegram: {
    id: "telegram",
    title: "Telegram",
    time: "~4 min",
    intro:
      "Professional customer and company liaison. Messages land in Inbox. Computer Use is never used for Telegram.",
    steps: [
      {
        title: "Create a bot",
        body: "Talk to @BotFather, create a bot, and copy the token.",
        copy: { label: "BotFather", value: "https://t.me/BotFather" },
      },
      {
        title: "Save the token",
        body: "ClippyOS → Settings → Integrations → Telegram. Paste the bot token. A webhook secret is generated if you leave it blank.",
      },
      {
        title: "Set the webhook",
        body: "Point Telegram at this app’s webhook. Include the secret token header.",
        copy: { label: "Webhook path", value: "/api/webhooks/telegram" },
      },
      {
        title: "Test, then Inbox",
        body: "Test Connection calls getMe and never sends a chat. Open Inbox to reply as the agency.",
      },
    ],
    checklist: [
      "Bot created with BotFather",
      "Token saved",
      "Webhook pointed at /api/webhooks/telegram",
      "Test Connection succeeds without messaging a customer",
    ],
  },
  whatsapp: {
    id: "whatsapp",
    title: "WhatsApp Cloud API",
    time: "~8 min",
    intro:
      "Meta Cloud API for business chats. Not WhatsApp Web on the Windows VM. Inbox is the liaison surface.",
    steps: [
      {
        title: "Create a Meta app",
        body: "In Meta for Developers, add WhatsApp, copy the phone number ID and a permanent access token.",
        copy: { label: "Meta Developers", value: "https://developers.facebook.com" },
      },
      {
        title: "Save credentials",
        body: "Paste the token, phone number ID, verify token, and app secret on the WhatsApp card.",
      },
      {
        title: "Verify the webhook",
        body: "Set the callback URL and verify token. GET verification and POST signatures are checked.",
        copy: { label: "Webhook path", value: "/api/webhooks/whatsapp" },
      },
      {
        title: "Test, then Inbox",
        body: "Test Connection reads the phone number and never sends a customer message. Replies go through Inbox.",
      },
    ],
    checklist: [
      "Phone number ID and token saved",
      "Verify token matches Meta",
      "Webhook subscribed",
      "Test Connection succeeds without sending a chat",
    ],
  },
  airwallex: {
    id: "airwallex",
    title: "Airwallex Billing",
    time: "~8 min",
    intro:
      "Powers ClippyOS’s own SaaS subscription. Agency client invoices stay on the Money tab. Test Connection only fetches a token — it never opens checkout.",
    steps: [
      {
        title: "Create API credentials",
        body: "In Airwallex, create an API client (Client ID + API key). Use the sandbox host first. Copy the webhook secret for this app’s endpoint.",
        copy: { label: "Airwallex", value: "https://www.airwallex.com" },
      },
      {
        title: "Create Product + Prices",
        body: "In Billing, create a Product (ClippyOS) and monthly Prices for Starter / Pro / Agency. Paste each price_id into the Airwallex card.",
      },
      {
        title: "Legal entity and payment account",
        body: "If your account has more than one legal entity or linked payment account, paste those IDs. Hosted Checkout needs them to create the subscription.",
      },
      {
        title: "Webhook endpoint",
        body: "Point Airwallex to this app’s webhook URL. Events: billing_checkout.completed, subscription.* , invoice.paid / invoice.payment_failed. Signature uses x-timestamp + x-signature HMAC.",
        copy: { label: "Webhook path", value: "/api/webhooks/airwallex" },
      },
      {
        title: "Test Connection, then subscribe",
        body: "Save, Test Connection (login ping only). Open Billing and Subscribe — Airwallex Hosted Checkout collects cards and supported wallets. Access unlocks after the webhook or the success return.",
      },
    ],
    checklist: [
      "Client ID and API key saved",
      "At least one price_id saved",
      "Webhook secret saved and endpoint configured",
      "Test Connection succeeds without opening checkout",
    ],
  },
};
