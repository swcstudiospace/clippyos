import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/entities";
import {
  PLATFORM_LABELS,
  type MachineState,
  type PlatformSessionState,
  type SocialAsset,
  type YoutubeJobOptions,
  type YoutubePrivacyStatus,
} from "@/lib/social";
import { RAIL_LABELS, type PublisherStatus, type SocialPreferredRail } from "@/lib/publishers";
import { emptyPublisherMap } from "@/lib/publishers";

export function UploadForm({
  clients,
  assets,
  sessions,
  publishers,
  machineState,
  configured,
  pending,
  onUpload,
  initialMediaAssetId,
  initialPlatforms,
}: {
  clients: Array<{ id: string; name: string }>;
  assets: SocialAsset[];
  sessions: Record<SocialPlatform, PlatformSessionState>;
  publishers?: Record<SocialPlatform, PublisherStatus>;
  machineState: MachineState;
  configured: boolean;
  pending: boolean;
  onUpload: (input: {
    clientId: string;
    assetId?: string;
    mediaAssetId?: string;
    platforms: SocialPlatform[];
    caption: string;
    mediaUrl: string | null;
    preferredRail: SocialPreferredRail;
    mode: "draft" | "publish";
    youtube?: YoutubeJobOptions;
  }) => void;
  initialMediaAssetId?: string;
  initialPlatforms?: SocialPlatform[];
}) {
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [assetId, setAssetId] = useState(initialMediaAssetId ?? "");
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(initialPlatforms ?? []);
  const [caption, setCaption] = useState("");
  const [preferredRail, setPreferredRail] = useState<SocialPreferredRail>("AUTO");
  const [mode, setMode] = useState<"draft" | "publish">("draft");
  const [ytTitle, setYtTitle] = useState("");
  const [ytDescription, setYtDescription] = useState("");
  const [ytTags, setYtTags] = useState("");
  const [ytPrivacy, setYtPrivacy] = useState<YoutubePrivacyStatus>("unlisted");
  const [ytMarkShorts, setYtMarkShorts] = useState(true);
  const running = machineState === "running";
  const publisherMap = publishers ?? emptyPublisherMap();

  const clientAssets = useMemo(
    () => assets.filter((row) => row.clientId === clientId),
    [assets, clientId],
  );
  const selected = clientAssets.find((row) => row.id === assetId) ?? null;

  function apiReady(platform: SocialPlatform): boolean {
    return publisherMap[platform].eligible;
  }

  function platformEnabled(platform: SocialPlatform): boolean {
    if (preferredRail === "API") return apiReady(platform);
    if (preferredRail === "BROWSER") return running;
    return apiReady(platform) || running;
  }

  const tiktokUnauditedPublish =
    mode === "publish" &&
    platforms.includes("tiktok") &&
    publisherMap.tiktok.eligible &&
    publisherMap.tiktok.tiktok?.auditStatus !== "AUDITED";

  const igNeedsProfessional =
    platforms.includes("instagram") &&
    preferredRail === "API" &&
    !publisherMap.instagram.eligible;

  const canSubmit =
    Boolean(clientId) &&
    platforms.length > 0 &&
    !pending &&
    platforms.every(platformEnabled) &&
    (preferredRail === "API"
      ? platforms.every(apiReady)
      : preferredRail === "BROWSER"
        ? configured && running
        : platforms.some(apiReady) || (configured && running));

  function toggle(platform: SocialPlatform) {
    if (!platformEnabled(platform)) return;
    setPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform],
    );
  }

  function submit() {
    if (!canSubmit) return;
    onUpload({
      clientId,
      assetId: assetId || undefined,
      mediaAssetId: selected?.kind === "library" ? assetId : undefined,
      platforms,
      caption: caption || selected?.caption || "",
      mediaUrl: selected?.mediaUrl ?? null,
      preferredRail,
      mode,
      youtube: platforms.includes("youtube")
        ? {
            title: ytTitle || undefined,
            description: ytDescription || undefined,
            tags: ytTags
              .split(",")
              .map((row) => row.trim())
              .filter(Boolean)
              .slice(0, 30),
            privacyStatus: mode === "draft" ? "private" : ytPrivacy,
            markShorts: ytMarkShorts,
          }
        : undefined,
    });
  }

  return (
    <GlassCard className="social-upload">
      <h2 className="text-card font-semibold tracking-tight">1-click upload</h2>
      <p className="mt-1 text-caption text-muted">
        Auto uses native APIs when a publisher is connected. Computer Use stays the fallback for
        login, CAPTCHA, personal Instagram, and unaudited TikTok public posts.
      </p>

      {!configured && !anyApiReady(publisherMap) ? (
        <p className="mt-3 text-caption text-muted">
          Connect a publisher API in Settings, or connect Daytona for Computer Use.
        </p>
      ) : preferredRail !== "API" && configured && !running && !platforms.some(apiReady) ? (
        <p className="mt-3 text-caption text-warning">
          Start the Social Machine for Computer Use, or connect APIs to post without the VM.
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="social-client">Client</Label>
          <Select
            value={clientId || undefined}
            onValueChange={(value) => {
              setClientId(value);
              setAssetId("");
            }}
          >
            <SelectTrigger id="social-client" aria-label="Client">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="social-asset">Asset</Label>
          <Select value={assetId || undefined} onValueChange={setAssetId}>
            <SelectTrigger id="social-asset" aria-label="Asset">
              <SelectValue placeholder="Library, pipeline, or thumbnail" />
            </SelectTrigger>
            <SelectContent>
              {clientAssets.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.kind === "library" ? `Library · ${asset.label}` : asset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="social-rail">Rail</Label>
          <Select
            value={preferredRail}
            onValueChange={(value) => {
              setPreferredRail(value as SocialPreferredRail);
              setPlatforms([]);
            }}
          >
            <SelectTrigger id="social-rail" aria-label="Preferred rail">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AUTO">Auto — API then Computer Use</SelectItem>
              <SelectItem value="API">API only</SelectItem>
              <SelectItem value="BROWSER">Computer Use only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="social-mode">Mode</Label>
          <Select value={mode} onValueChange={(value) => setMode(value as "draft" | "publish")}>
            <SelectTrigger id="social-mode" aria-label="Upload mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft / inbox</SelectItem>
              <SelectItem value="publish">Publish</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="text-caption font-medium">Platforms</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SOCIAL_PLATFORMS.map((platform) => {
            const ready = sessions[platform] !== "not_logged_in";
            const selectedPlat = platforms.includes(platform);
            const api = apiReady(platform);
            const enabled = platformEnabled(platform);
            return (
              <Button
                key={platform}
                type="button"
                size="sm"
                variant={selectedPlat ? "secondary" : "ghost"}
                aria-pressed={selectedPlat}
                disabled={!enabled}
                title={
                  api
                    ? `${PLATFORM_LABELS[platform]} — API ready`
                    : enabled
                      ? PLATFORM_LABELS[platform]
                      : `${PLATFORM_LABELS[platform]} — connect API or start Computer Use`
                }
                onClick={() => toggle(platform)}
              >
                {PLATFORM_LABELS[platform]}
                {api ? " · API" : !ready ? " · needs login" : ""}
              </Button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-col gap-1.5">
        <Label htmlFor="social-caption">Caption</Label>
        <Textarea
          id="social-caption"
          value={caption}
          placeholder={selected?.caption ?? "Optional caption — pre-filled from titles when possible"}
          onChange={(event) => setCaption(event.target.value)}
        />
      </div>

      {tiktokUnauditedPublish ? (
        <div className="mt-4 rounded-control bg-warning/10 px-3 py-3">
          <p className="text-caption text-warning">
            TikTok is not audited for public Direct Post. Publish would send a draft to inbox — not a
            public post.
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-2"
            onClick={() => setMode("draft")}
          >
            Send to TikTok inbox (draft)
          </Button>
        </div>
      ) : null}

      {igNeedsProfessional ? (
        <div className="mt-4 rounded-control bg-warning/10 px-3 py-3">
          <p className="text-caption text-warning">
            API publish requires an Instagram Professional account. Connect one in Settings, or use
            Computer Use for personal logins.
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="mt-2"
            onClick={() => {
              setPreferredRail("BROWSER");
              setPlatforms([]);
            }}
          >
            Use browser upload
          </Button>
        </div>
      ) : null}

      {platforms.includes("youtube") ? (
        <div className="mt-4 grid gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="yt-title">YouTube title</Label>
            <input
              id="yt-title"
              className="min-h-11 rounded-control border border-border bg-secondary-surface px-3 text-body"
              value={ytTitle}
              maxLength={100}
              placeholder={caption.split("\n")[0] || selected?.label || "Required by YouTube"}
              onChange={(event) => setYtTitle(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="yt-desc">YouTube description</Label>
            <Textarea
              id="yt-desc"
              value={ytDescription}
              placeholder="Defaults to the caption. Drafts upload as private."
              onChange={(event) => setYtDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="yt-tags">Tags (comma separated)</Label>
              <input
                id="yt-tags"
                className="min-h-11 rounded-control border border-border bg-secondary-surface px-3 text-body"
                value={ytTags}
                placeholder="agency, clip, shorts"
                onChange={(event) => setYtTags(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="yt-privacy">Privacy</Label>
              <Select
                value={mode === "draft" ? "private" : ytPrivacy}
                onValueChange={(value) => setYtPrivacy(value as YoutubePrivacyStatus)}
                disabled={mode === "draft"}
              >
                <SelectTrigger id="yt-privacy" aria-label="YouTube privacy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="unlisted">Unlisted</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-body">
            <input
              type="checkbox"
              checked={ytMarkShorts}
              onChange={(event) => setYtMarkShorts(event.target.checked)}
            />
            Add #Shorts when the clip is vertical and ≤ 3 minutes
          </label>
          <p className="text-caption text-muted">
            Uploads go to the connected workspace YouTube channel. The 4-minute long-form ideation
            rule is not applied here.
          </p>
        </div>
      ) : null}

      <div className="social-upload-actions mt-4">
        <Button onClick={submit} disabled={!canSubmit}>
          <Upload className="size-4" />
          {pending ? "Uploading…" : `Upload · ${RAIL_LABELS[preferredRail]}`}
        </Button>
      </div>
    </GlassCard>
  );
}

function anyApiReady(map: Record<SocialPlatform, PublisherStatus>): boolean {
  return Object.values(map).some((row) => row.eligible);
}
