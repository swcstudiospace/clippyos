import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Clapperboard, Settings, Zap, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionBoundary } from "@/components/clients/section-boundary";
import { UploadDropzone } from "@/components/library/upload-dropzone";
import { AssetCard } from "@/components/library/asset-card";
import { AssetDrawer } from "@/components/library/asset-drawer";
import { RenderQueue } from "@/components/library/render-queue";
import {
  LIBRARY_QUERY_KEY,
  RENDER_PRESETS,
  type CaptionCue,
  type RenderPreset,
} from "@/lib/library";
import {
  archiveAssetFn,
  cancelRenderFn,
  exportCaptionsFn,
  generateCaptionsFn,
  getLibraryAssetFn,
  getLibrarySnapshot,
  ingestLibraryUrlFn,
  queueRenderFn,
  retryRenderFn,
  saveCuesFn,
  uploadSrtFn,
} from "@/lib/server/library-fns";
import {
  crayoStatusFn,
  generateCrayoVideoFn,
  generateStudioThumbnailFn,
  imageGenStatusFn,
} from "@/lib/server/studio-fns";
import { userFacingErrorMessage } from "@/lib/errors";

export const Route = createFileRoute("/_app/studio")({
  component: StudioPage,
});

function StudioPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"assets" | "generate" | "renders">("assets");
  const [clientId, setClientId] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");

  // Crayo generator state
  const [crayoPrompt, setCrayoPrompt] = useState("");
  const [crayoScript, setCrayoScript] = useState("");
  const [crayoStyle, setCrayoStyle] = useState("default");
  const [crayoDuration, setCrayoDuration] = useState("60");
  const [crayoAspect, setCrayoAspect] = useState<"9:16" | "16:9" | "1:1">("9:16");

  // Thumbnail generator state
  const [thumbPrompt, setThumbPrompt] = useState("");
  const [thumbClientId, setThumbClientId] = useState<string>("");

  const snapshot = useQuery({
    queryKey: LIBRARY_QUERY_KEY,
    queryFn: () => getLibrarySnapshot(),
    refetchInterval: (current) => {
      const busy = current.state.data?.renders.some(
        (row) => row.status === "QUEUED" || row.status === "RUNNING",
      );
      const transcribing = current.state.data?.assets.some((row) => row.status === "PROCESSING");
      return busy || transcribing ? 3000 : 20_000;
    },
  });

  const detail = useQuery({
    queryKey: ["library-asset", openId],
    queryFn: () => getLibraryAssetFn({ data: { id: openId! } }),
    enabled: Boolean(openId),
    refetchInterval: (current) => {
      const captions = current.state.data?.captions.some(
        (row) => row.status === "TRANSCRIBING" || row.status === "PENDING",
      );
      const renders = current.state.data?.renders.some(
        (row) => row.status === "QUEUED" || row.status === "RUNNING",
      );
      return captions || renders ? 2500 : false;
    },
  });

  const crayoReady = useQuery({
    queryKey: ["studio-crayo-status"],
    queryFn: () => crayoStatusFn(),
    staleTime: 30_000,
  });

  const thumbReady = useQuery({
    queryKey: ["studio-image-status"],
    queryFn: () => imageGenStatusFn(),
    staleTime: 30_000,
  });

  const assets = useMemo(() => {
    const rows = snapshot.data?.assets ?? [];
    return rows.filter((row) => {
      if (clientId !== "all" && row.clientId !== clientId) return false;
      return true;
    });
  }, [snapshot.data?.assets, clientId]);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY });
    if (openId) void queryClient.invalidateQueries({ queryKey: ["library-asset", openId] });
  }

  // ── Mutations ────────────────────────────────────────────────

  const urlImport = useMutation({
    mutationFn: () =>
      ingestLibraryUrlFn({
        data: { clientId: clientId === "all" ? null : clientId, url: importUrl },
      }),
    onSuccess: (result) => {
      toast.success(result.duplicate ? "Already in the library" : "Imported");
      setImportUrl("");
      refresh();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const generateCrayo = useMutation({
    mutationFn: () =>
      generateCrayoVideoFn({
        data: {
          prompt: crayoPrompt.trim() || undefined,
          script: crayoScript.trim() || undefined,
          style: crayoStyle,
          duration: Number(crayoDuration),
          aspectRatio: crayoAspect,
        },
      }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(
          result.assetId
            ? "Short-form generated and saved to the Library"
            : "Short-form generated",
        );
        setTab("assets");
        refresh();
      } else if (result.error === "missing") {
        toast.message("Connect a Crayo.ai API key in Settings → Integrations first.");
      } else {
        toast.error("The video didn't come through. Retry.");
      }
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const generateThumb = useMutation({
    mutationFn: () =>
      generateStudioThumbnailFn({
        data: {
          prompt: thumbPrompt.trim(),
          clientId: thumbClientId || null,
        },
      }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(
          result.assetId ? "Thumbnail saved to the Library" : "Thumbnail generated",
        );
        setTab("assets");
        refresh();
      } else if (result.error === "missing") {
        toast.message("Connect an image API key in Settings → Integrations first.");
      } else if (result.error === "rate_limit") {
        toast.error("The image service is busy. Retry in a moment.");
      } else {
        toast.error("The thumbnail didn't come through. Retry.");
      }
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const renderMut = useMutation({
    mutationFn: (input: { assetId: string; preset: RenderPreset }) =>
      queueRenderFn({ data: input }),
    onSuccess: () => {
      toast.success("Render queued");
      setTab("renders");
      refresh();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const cancel = useMutation({
    mutationFn: (jobId: string) => cancelRenderFn({ data: { jobId } }),
    onSuccess: () => {
      toast.message("Render canceled");
      refresh();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const retry = useMutation({
    mutationFn: (jobId: string) => retryRenderFn({ data: { jobId } }),
    onSuccess: () => {
      toast.success("Render re-queued");
      refresh();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const archive = useMutation({
    mutationFn: (assetId: string) => archiveAssetFn({ data: { assetId } }),
    onSuccess: () => {
      toast.success("Archived");
      setOpenId(null);
      refresh();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const captionMut = useMutation({
    mutationFn: (assetId: string) => generateCaptionsFn({ data: { assetId } }),
    onSuccess: () => {
      toast.message("Transcribing…");
      refresh();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const saveCues = useMutation({
    mutationFn: (input: { trackId: string; cues: CaptionCue[] }) => saveCuesFn({ data: input }),
    onSuccess: () => {
      toast.success("Captions saved");
      refresh();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const srt = useMutation({
    mutationFn: (input: { assetId: string; srt: string }) => uploadSrtFn({ data: input }),
    onSuccess: () => {
      toast.success("SRT imported");
      refresh();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const downloadCaptions = async (trackId: string, format: "SRT" | "VTT") => {
    try {
      const result = await exportCaptionsFn({ data: { trackId, format } });
      const blob = new Blob([result.body], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.rel = "noopener";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(userFacingErrorMessage(error));
    }
  };

  // ── Loading / error states ───────────────────────────────────

  if (snapshot.isPending) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Clipping Studio" description="Generate, caption, and publish short-form." />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-56 rounded-card" />
          <Skeleton className="h-56 rounded-card" />
          <Skeleton className="h-56 rounded-card" />
        </div>
      </div>
    );
  }
  if (snapshot.isError || !snapshot.data) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Clipping Studio" />
        <ErrorState
          className="mt-8"
          title="Couldn't load the studio"
          description="Retry in a moment."
          onRetry={() => void snapshot.refetch()}
        />
      </div>
    );
  }

  const data = snapshot.data;
  const activeClients = data.clients.filter((c) => c.status === "ACTIVE" && !c.deletedAt);

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <PageHeader
        title="Clipping Studio"
        description="One workflow for short-form generation, thumbnails, captions, and platform-ready renders."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge tone={crayoReady.data ? "green" : "neutral"}>
              <Zap className="mr-1 size-3" aria-hidden="true" />
              Crayo {crayoReady.isPending ? "…" : crayoReady.data ? "ready" : "off"}
            </Badge>
            <Badge tone={thumbReady.data ? "purple" : "neutral"}>
              <Sparkles className="mr-1 size-3" aria-hidden="true" />
              Images {thumbReady.isPending ? "…" : thumbReady.data ? "ready" : "off"}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Integration settings"
              onClick={() => void navigate({ to: "/settings", hash: "integrations" })}
            >
              <Settings className="size-5" />
            </Button>
          </div>
        }
      />

      <div className="mt-6 flex gap-2">
        {(
          [
            ["assets", `Assets (${assets.length})`],
            ["generate", "Generate"],
            ["renders", `Renders (${data.renders.length})`],
          ] as const
        ).map(([key, label]) => (
          <Button
            key={key}
            type="button"
            variant={tab === key ? "primary" : "secondary"}
            onClick={() => setTab(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "assets" ? (
        <>
          <SectionBoundary title="Add media">
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="studio-client">Client</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger id="studio-client">
                      <SelectValue placeholder="All clients" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All clients</SelectItem>
                      {activeClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <form
                  className="flex items-end gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (importUrl.trim()) urlImport.mutate();
                  }}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Label htmlFor="studio-url">Import URL</Label>
                    <Input
                      id="studio-url"
                      value={importUrl}
                      onChange={(event) => setImportUrl(event.target.value)}
                      placeholder="https:// allowlisted media URL"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="secondary"
                    disabled={urlImport.isPending || !importUrl.trim()}
                  >
                    Import
                  </Button>
                </form>
              </div>
              <UploadDropzone
                clientId={clientId === "all" ? null : clientId}
                maxUploadMb={data.settings.maxUploadMb}
                onUploaded={(id, duplicate) => {
                  toast.success(duplicate ? "Already in the library" : "Ready in Library");
                  setOpenId(id);
                  refresh();
                }}
                onError={(message) => toast.error(message)}
              />
            </div>
          </SectionBoundary>

          <SectionBoundary title="Assets">
            {assets.length === 0 ? (
              <EmptyState
                title="No assets yet"
                description="Import an allowlisted URL, upload a clip, or generate one on the Generate tab."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {assets.map((asset) => (
                  <AssetCard key={asset.id} asset={asset} onOpen={() => setOpenId(asset.id)} />
                ))}
              </div>
            )}
          </SectionBoundary>

          <AssetDrawer
            detail={detail.data ?? null}
            open={Boolean(openId)}
            settings={data.settings}
            pending={
              captionMut.isPending ||
              saveCues.isPending ||
              srt.isPending ||
              archive.isPending
            }
            onOpenChange={(open) => {
              if (!open) setOpenId(null);
            }}
            onGenerateCaptions={() => {
              if (openId) captionMut.mutate(openId);
            }}
            onSaveCues={(trackId, cues) => saveCues.mutate({ trackId, cues })}
            onUploadSrt={(srtText) => {
              if (openId) srt.mutate({ assetId: openId, srt: srtText });
            }}
            onDownloadCaptions={(trackId, format) => void downloadCaptions(trackId, format)}
            onQueueRender={(preset) => {
              if (openId) renderMut.mutate({ assetId: openId, preset });
            }}
            onSendSocial={() => void navigate({ to: "/social" })}
            onArchive={() => {
              if (openId) archive.mutate(openId);
            }}
            canDelete={data.role === "admin"}
          />
        </>
      ) : null}

      {tab === "generate" ? (
        <>
          <SectionBoundary title="Short-form video · Crayo.ai">
            <Card>
              <CardContent className="flex flex-col gap-4 pt-5">
                {!crayoReady.data && !crayoReady.isPending ? (
                  <p className="text-caption text-warning">
                    Crayo.ai isn't connected yet — add your API key in Settings → Integrations.
                  </p>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="crayo-prompt">Prompt or topic</Label>
                    <Textarea
                      id="crayo-prompt"
                      value={crayoPrompt}
                      onChange={(event) => setCrayoPrompt(event.target.value)}
                      placeholder="e.g. 3 editing tricks that double retention"
                      rows={2}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <Label htmlFor="crayo-script">Full script (optional)</Label>
                    <Textarea
                      id="crayo-script"
                      value={crayoScript}
                      onChange={(event) => setCrayoScript(event.target.value)}
                      placeholder="Paste a script — Crayo will voice and caption it"
                      rows={4}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="crayo-style">Style</Label>
                    <Select value={crayoStyle} onValueChange={setCrayoStyle}>
                      <SelectTrigger id="crayo-style">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="storytelling">Storytelling</SelectItem>
                        <SelectItem value="fast-paced">Fast-paced</SelectItem>
                        <SelectItem value="cinematic">Cinematic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="crayo-duration">Duration</Label>
                    <Select value={crayoDuration} onValueChange={setCrayoDuration}>
                      <SelectTrigger id="crayo-duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="45">45 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                        <SelectItem value="90">90 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="crayo-aspect">Aspect ratio</Label>
                    <Select
                      value={crayoAspect}
                      onValueChange={(value) => setCrayoAspect(value as "9:16" | "16:9" | "1:1")}
                    >
                      <SelectTrigger id="crayo-aspect">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9:16">9:16 vertical</SelectItem>
                        <SelectItem value="16:9">16:9 landscape</SelectItem>
                        <SelectItem value="1:1">1:1 square</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => generateCrayo.mutate()}
                      disabled={
                        generateCrayo.isPending ||
                        (!crayoPrompt.trim() && !crayoScript.trim())
                      }
                    >
                      <Zap className="size-4" aria-hidden="true" />
                      {generateCrayo.isPending ? "Generating…" : "Generate short-form"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SectionBoundary>

          <SectionBoundary title="Thumbnail · Higgsfield / xAI">
            <Card>
              <CardContent className="flex flex-col gap-4 pt-5">
                {!thumbReady.data && !thumbReady.isPending ? (
                  <p className="text-caption text-warning">
                    Image generation isn't configured yet — add a key in Settings → Integrations.
                  </p>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="thumb-prompt">Thumbnail prompt</Label>
                    <Textarea
                      id="thumb-prompt"
                      value={thumbPrompt}
                      onChange={(event) => setThumbPrompt(event.target.value)}
                      placeholder="Bold face, high contrast, readable text — 16:9 4K"
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="thumb-client">Tag to client</Label>
                    <Select value={thumbClientId} onValueChange={setThumbClientId}>
                      <SelectTrigger id="thumb-client">
                        <SelectValue placeholder="No client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No client</SelectItem>
                        {activeClients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="secondary"
                      className="mt-auto w-full"
                      onClick={() => generateThumb.mutate()}
                      disabled={generateThumb.isPending || !thumbPrompt.trim()}
                    >
                      <Sparkles className="size-4" aria-hidden="true" />
                      {generateThumb.isPending ? "Generating…" : "Generate thumbnail"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SectionBoundary>
        </>
      ) : null}

      {tab === "renders" ? (
        <SectionBoundary title="Render queue">
          <RenderQueue
            jobs={data.renders}
            onCancel={(id) => cancel.mutate(id)}
            onRetry={(id) => retry.mutate(id)}
            onOpenOutput={(assetId) => setOpenId(assetId)}
          />
        </SectionBoundary>
      ) : null}

      {assets.length > 0 && tab === "assets" ? null : (
        <p className="sr-only">
          <Clapperboard className="size-3" aria-hidden="true" /> studio ready
        </p>
      )}
    </div>
  );
}
