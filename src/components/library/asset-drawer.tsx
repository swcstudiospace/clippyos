import { useMemo, useState } from "react";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { CaptionEditor } from "@/components/library/caption-editor";
import { ScoreBadge } from "@/components/performance/score-badge";
import {
  PRESET_LABELS,
  RENDER_PRESETS,
  SOURCE_LABELS,
  formatBytes,
  formatDurationSec,
  type AssetDetail,
  type CaptionCue,
  type MediaPipelineSettings,
  type RenderPreset,
} from "@/lib/library";
import { PLATFORM_LABELS, WINDOW_LABELS, formatEngagementPct, formatUnknownNumber } from "@/lib/performance";
import { formatCompactCount } from "@/lib/format";

export function AssetDrawer({
  detail,
  open,
  settings,
  pending,
  onOpenChange,
  onGenerateCaptions,
  onSaveCues,
  onUploadSrt,
  onDownloadCaptions,
  onQueueRender,
  onSendSocial,
  onPublishYoutube,
  onArchive,
  onProposeKnowledge,
  canDelete,
}: {
  detail: AssetDetail | null;
  open: boolean;
  settings: MediaPipelineSettings;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateCaptions: () => void;
  onSaveCues: (trackId: string, cues: CaptionCue[]) => void;
  onUploadSrt: (srt: string) => void;
  onDownloadCaptions: (trackId: string, format: "SRT" | "VTT") => void;
  onQueueRender: (preset: RenderPreset, burnIn: boolean, captionTrackId: string | null) => void;
  onSendSocial: () => void;
  onPublishYoutube?: () => void;
  onArchive: () => void;
  onProposeKnowledge?: () => void;
  canDelete: boolean;
}) {
  const asset = detail?.asset ?? null;
  const readyCaption = detail?.captions.find((row) => row.status === "READY") ?? null;
  const [preset, setPreset] = useState<RenderPreset>(settings.defaultPreset);
  const [burnIn, setBurnIn] = useState(false);

  const media = useMemo(() => {
    if (!asset?.previewUrl) return null;
    if (asset.kind === "IMAGE") return <img src={asset.previewUrl} alt="" className="w-full rounded-control" />;
    if (asset.kind === "VIDEO") {
      return (
        <video src={asset.previewUrl} controls playsInline className="w-full rounded-control" />
      );
    }
    return null;
  }, [asset]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(100%,36rem)]">
        {asset ? (
          <>
            <SheetTitle>{asset.title}</SheetTitle>
            <SheetDescription>
              {SOURCE_LABELS[asset.source]} · {asset.kind.toLowerCase()}
              {asset.durationSec ? ` · ${formatDurationSec(asset.durationSec)}` : ""}
            </SheetDescription>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Badge tone={statusTone(asset.status)}>{asset.status}</Badge>
              {asset.aspectRatio ? <Badge tone="blue">{asset.aspectRatio}</Badge> : null}
              {asset.tags.map((tag) => (
                <Badge key={tag} tone="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="mt-4">{media}</div>
            <p className="mt-2 text-caption text-muted">
              {[formatBytes(asset.byteSize), asset.mimeType].filter(Boolean).join(" · ")}
            </p>

            {detail?.performance || (detail?.snapshots && detail.snapshots.length > 0) ? (
              <section className="mt-6">
                <h3 className="text-card font-semibold tracking-tight">Performance</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <ScoreBadge
                    score={detail.performance?.score ?? null}
                    verdict={detail.performance && detail.performance.winnerCount > 0 ? "WINNER" : null}
                  />
                  {detail.performance?.viewsTotal != null ? (
                    <span className="text-caption text-muted">
                      {formatUnknownNumber(detail.performance.viewsTotal, formatCompactCount)} views
                      {detail.performance.engagementRate != null
                        ? ` · ${formatEngagementPct(detail.performance.engagementRate)} engagement`
                        : ""}
                    </span>
                  ) : (
                    <span className="text-caption text-muted">No stats yet — unknown, not zero.</span>
                  )}
                </div>
                {detail.snapshots && detail.snapshots.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-1">
                    {detail.snapshots.slice(0, 6).map((row) => (
                      <li key={row.id} className="text-caption text-muted">
                        {PLATFORM_LABELS[row.platform]} · {WINDOW_LABELS[row.window]} ·{" "}
                        {formatUnknownNumber(row.metrics.views, formatCompactCount)} views
                        {row.externalUrl ? (
                          <>
                            {" · "}
                            <a
                              href={row.externalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent underline-offset-2 hover:underline"
                            >
                              post
                            </a>
                          </>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {onProposeKnowledge ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    disabled={pending || !detail.snapshots?.length}
                    onClick={onProposeKnowledge}
                  >
                    Propose knowledge from this
                  </Button>
                ) : null}
              </section>
            ) : onProposeKnowledge ? (
              <section className="mt-6">
                <h3 className="text-card font-semibold tracking-tight">Performance</h3>
                <p className="mt-2 text-caption text-muted">
                  No published stats on this asset yet. After a social post succeeds, refresh stats on
                  Analytics or enter them manually.
                </p>
              </section>
            ) : null}

            <section className="mt-6">
              <h3 className="text-card font-semibold tracking-tight">Captions</h3>
              {(asset.kind === "VIDEO" || asset.kind === "AUDIO") && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending || !settings.transcriptionConfigured}
                    onClick={onGenerateCaptions}
                  >
                    {readyCaption ? "Re-transcribe" : "Generate captions"}
                  </Button>
                  <label className="inline-flex min-h-10 cursor-pointer items-center rounded-button bg-secondary-surface px-3 text-caption">
                    Upload SRT
                    <input
                      type="file"
                      accept=".srt,.vtt,text/plain"
                      className="sr-only"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        onUploadSrt(await file.text());
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                </div>
              )}
              {!settings.transcriptionConfigured ? (
                <p className="mt-2 text-caption text-muted">{settings.transcriptionHint}</p>
              ) : null}
              {detail?.captions
                .filter((row) => row.status !== "READY")
                .map((row) => (
                  <p key={row.id} className="mt-2 text-caption text-muted">
                    {row.status === "TRANSCRIBING" ? "Transcribing…" : row.error || row.status}
                  </p>
                ))}
              {readyCaption ? (
                <div className="mt-3">
                  <CaptionEditor
                    track={readyCaption}
                    pending={pending}
                    onSave={(cues) => onSaveCues(readyCaption.id, cues)}
                    onDownload={(format) => onDownloadCaptions(readyCaption.id, format)}
                  />
                </div>
              ) : null}
            </section>

            <section className="mt-6">
              <h3 className="text-card font-semibold tracking-tight">Queue render</h3>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="preset">Preset</Label>
                  <Select value={preset} onValueChange={(value) => setPreset(value as RenderPreset)}>
                    <SelectTrigger id="preset">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RENDER_PRESETS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {PRESET_LABELS[item]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="mt-6 flex items-center gap-2 text-body">
                  <input
                    type="checkbox"
                    checked={burnIn}
                    onChange={(event) => setBurnIn(event.target.checked)}
                  />
                  Burn in captions
                </label>
              </div>
              <Button
                type="button"
                className="mt-3"
                disabled={pending || asset.kind === "SUBTITLE"}
                onClick={() =>
                  onQueueRender(preset, burnIn, burnIn ? readyCaption?.id ?? null : null)
                }
              >
                Queue {PRESET_LABELS[preset]}
              </Button>
            </section>

            {detail && detail.derived.length > 0 ? (
              <section className="mt-6">
                <h3 className="text-card font-semibold tracking-tight">Derived renders</h3>
                <ul className="mt-2 flex flex-col gap-1">
                  {detail.derived.map((row) => (
                    <li key={row.id} className="text-caption text-muted">
                      {row.title} · {row.status}
                      {row.aspectRatio ? ` · ${row.aspectRatio}` : ""}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {detail && detail.versions.length > 1 ? (
              <section className="mt-6">
                <h3 className="text-card font-semibold tracking-tight">Versions</h3>
                <ul className="mt-2 flex flex-col gap-1">
                  {detail.versions.map((row) => (
                    <li key={row.id} className="text-caption text-muted">
                      v{row.versionNumber}
                      {row.note ? ` · ${row.note}` : ""} · {formatBytes(row.byteSize)}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-2">
              <Button type="button" onClick={onSendSocial}>
                Send to Social
              </Button>
              {onPublishYoutube && asset.kind === "VIDEO" ? (
                <Button type="button" variant="secondary" onClick={onPublishYoutube}>
                  Publish to YouTube
                </Button>
              ) : null}
              {canDelete ? (
                <Button type="button" variant="destructive" onClick={onArchive}>
                  Archive
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <p className="text-body text-muted">Select an asset.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
