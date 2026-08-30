import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Clapperboard } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadDropzone } from "@/components/library/upload-dropzone";
import { AssetCard } from "@/components/library/asset-card";
import { AssetDrawer } from "@/components/library/asset-drawer";
import { RenderQueue } from "@/components/library/render-queue";
import { LibraryGeneratePanel } from "@/components/library/generate-panel";
import {
  ASSET_KINDS,
  ASSET_SOURCES,
  ASSET_STATUSES,
  KIND_LABELS,
  LIBRARY_QUERY_KEY,
  PRESET_LABELS,
  RENDER_PRESETS,
  SOURCE_LABELS,
  type AssetKind,
  type AssetSource,
  type CaptionCue,
  type LibraryAsset,
  type RenderPreset,
} from "@/lib/library";
import {
  archiveAssetFn,
  bulkQueueRenderFn,
  cancelRenderFn,
  exportCaptionsFn,
  generateCaptionsFn,
  getLibraryAssetFn,
  getLibrarySnapshot,
  ingestLibraryUrlFn,
  ingestStreamClipFn,
  listClientClipsFn,
  queueRenderFn,
  retryRenderFn,
  saveCuesFn,
  tagAssetsFn,
  uploadSrtFn,
} from "@/lib/server/library-fns";
import { proposeKnowledgeFromAssetFn } from "@/lib/server/performance-fns";
import { KNOWLEDGE_PROPOSALS_KEY } from "@/lib/performance";
import { userFacingErrorMessage } from "@/lib/errors";
import { downloadTextFile } from "@/lib/clipboard";

type LibrarySearch = { tab?: "library" | "renders" | "generate" };

export const Route = createFileRoute("/_app/library")({
  validateSearch: (search: Record<string, unknown>): LibrarySearch => ({
    tab:
      search.tab === "generate" || search.tab === "renders" || search.tab === "library"
        ? search.tab
        : undefined,
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { tab: tabSearch } = Route.useSearch();
  const [tab, setTab] = useState<"library" | "renders" | "generate">(
    tabSearch === "generate" || tabSearch === "renders" ? tabSearch : "library",
  );
  const [clientId, setClientId] = useState<string>("all");
  const [kind, setKind] = useState<string>("all");
  const [source, setSource] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [importUrl, setImportUrl] = useState("");

  const snapshot = useQuery({
    queryKey: LIBRARY_QUERY_KEY,
    queryFn: () => getLibrarySnapshot(),
    refetchInterval: (current) => {
      const busy = current.state.data?.renders.some(
        (row) => row.status === "QUEUED" || row.status === "RUNNING",
      );
      const transcribing = current.state.data?.assets.some((row) => row.status === "PROCESSING");
      if (busy || transcribing) return 3000;
      return 20_000;
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

  const clips = useQuery({
    queryKey: ["library-clips", clientId],
    queryFn: () => listClientClipsFn({ data: { clientId } }),
    enabled: clientId !== "all",
  });

  const assets = useMemo(() => {
    const rows = snapshot.data?.assets ?? [];
    const cutoff =
      dateRange === "7d"
        ? Date.now() - 7 * 24 * 60 * 60 * 1000
        : dateRange === "30d"
          ? Date.now() - 30 * 24 * 60 * 60 * 1000
          : 0;
    return rows.filter((row) => {
      if (clientId !== "all" && row.clientId !== clientId) return false;
      if (kind !== "all" && row.kind !== kind) return false;
      if (source !== "all" && row.source !== source) return false;
      if (status !== "all") {
        if (row.status !== status) return false;
      } else if (row.status === "ARCHIVED") {
        return false;
      }
      if (cutoff && new Date(row.createdAt).getTime() < cutoff) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!`${row.title} ${row.tags.join(" ")}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [snapshot.data?.assets, clientId, kind, source, status, dateRange, search]);

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY });
    if (openId) void queryClient.invalidateQueries({ queryKey: ["library-asset", openId] });
  }

  const urlImport = useMutation({
    mutationFn: () =>
      ingestLibraryUrlFn({
        data: {
          clientId: clientId === "all" ? null : clientId,
          url: importUrl,
        },
      }),
    onSuccess: (result) => {
      toast.success(result.duplicate ? "Already in the library" : "Imported");
      setImportUrl("");
      refresh();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const generate = useMutation({
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
  const renderMut = useMutation({
    mutationFn: (input: {
      assetId: string;
      preset: RenderPreset;
      burnInCaptions?: boolean;
      captionTrackId?: string | null;
    }) => queueRenderFn({ data: input }),
    onSuccess: () => {
      toast.success("Render queued");
      setTab("renders");
      refresh();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const bulkRender = useMutation({
    mutationFn: (preset: RenderPreset) =>
      bulkQueueRenderFn({ data: { assetIds: [...selected], preset } }),
    onSuccess: () => {
      toast.success("Renders queued");
      setSelected(new Set());
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
  const propose = useMutation({
    mutationFn: (assetId: string) => proposeKnowledgeFromAssetFn({ data: { assetId } }),
    onSuccess: async () => {
      toast.success("Drafted a learning proposal — approve it in Settings → AI Training");
      await queryClient.invalidateQueries({ queryKey: KNOWLEDGE_PROPOSALS_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const tag = useMutation({
    mutationFn: (tagName: string) => tagAssetsFn({ data: { assetIds: [...selected], tag: tagName } }),
    onSuccess: () => {
      toast.success("Tagged");
      setSelected(new Set());
      refresh();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const clipIngest = useMutation({
    mutationFn: (clipId: string) => ingestStreamClipFn({ data: { clipId } }),
    onSuccess: () => {
      toast.success("Saved to Library");
      refresh();
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  if (snapshot.isPending) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader title="Library" description="Media, captions, and platform renders." />
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
        <PageHeader title="Library" />
        <ErrorState
          className="mt-8"
          title="Couldn’t load the library"
          description="Retry in a moment."
          onRetry={() => void snapshot.refetch()}
        />
      </div>
    );
  }

  const data = snapshot.data;
  const pending =
    generate.isPending ||
    renderMut.isPending ||
    saveCues.isPending ||
    srt.isPending ||
    archive.isPending ||
    propose.isPending;

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <PageHeader
        title="Library"
        description="Clips, thumbs, captions, platform renders, and generate. Social jobs can publish from a library id."
        actions={
          <div className="flex gap-2">
            <Button
              type="button"
              variant={tab === "library" ? "primary" : "secondary"}
              onClick={() => setTab("library")}
            >
              Assets
            </Button>
            <Button
              type="button"
              variant={tab === "generate" ? "primary" : "secondary"}
              onClick={() => setTab("generate")}
            >
              Generate
            </Button>
            <Button
              type="button"
              variant={tab === "renders" ? "primary" : "secondary"}
              onClick={() => setTab("renders")}
            >
              Renders
            </Button>
          </div>
        }
      />

      {tab === "generate" ? (
        <LibraryGeneratePanel
          clients={data.clients}
          onSaved={() => {
            setTab("library");
            refresh();
          }}
        />
      ) : null}

      {tab === "library" ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lib-client">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="lib-client">
                  <SelectValue placeholder="All clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All clients</SelectItem>
                  {data.clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lib-kind">Kind</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger id="lib-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All kinds</SelectItem>
                  {ASSET_KINDS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {KIND_LABELS[item as AssetKind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lib-source">Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger id="lib-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {ASSET_SOURCES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {SOURCE_LABELS[item as AssetSource]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lib-search">Search</Label>
              <Input
                id="lib-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Title or tag"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lib-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="lib-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {ASSET_STATUSES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="lib-date">Date</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="lib-date">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any time</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6">
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

          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (importUrl.trim()) urlImport.mutate();
            }}
          >
            <Input
              value={importUrl}
              onChange={(event) => setImportUrl(event.target.value)}
              placeholder="https:// allowlisted media URL"
              aria-label="Import URL"
            />
            <Button type="submit" variant="secondary" disabled={urlImport.isPending || !importUrl.trim()}>
              Import URL
            </Button>
          </form>

          {clips.data?.clips.length ? (
            <div className="mt-6">
              <h2 className="text-card font-semibold tracking-tight">Twitch clips</h2>
              <ul className="mt-2 flex flex-col gap-2">
                {clips.data.clips.map((clip) => (
                  <li
                    key={clip.id}
                    className="flex items-center justify-between gap-3 rounded-control bg-secondary-surface px-3 py-2"
                  >
                    <span className="min-w-0 truncate text-body">{clip.title || "Clip"}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={clipIngest.isPending}
                      onClick={() => clipIngest.mutate(clip.id)}
                    >
                      Save to Library
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {selected.size > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-caption text-muted">{selected.size} selected</span>
              {RENDER_PRESETS.filter((item) => item !== "CUSTOM").map((preset) => (
                <Button
                  key={preset}
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => bulkRender.mutate(preset)}
                >
                  Queue {PRESET_LABELS[preset]}
                </Button>
              ))}
              <Button type="button" size="sm" variant="ghost" onClick={() => tag.mutate("ready")}>
                Tag ready
              </Button>
            </div>
          ) : null}

          {assets.length === 0 ? (
            <EmptyState
              className="mt-8"
              title="Library is empty"
              description="Upload a clip, import an allowlisted URL, or save a Twitch clip. Renders and captions live on the asset."
              action={
                <span className="inline-flex items-center gap-2 text-caption text-muted">
                  <Clapperboard className="size-4" aria-hidden="true" />
                  Source → asset → caption → render → social
                </span>
              }
            />
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset: LibraryAsset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  selected={selected.has(asset.id)}
                  rollup={(data.rollups ?? []).find((row) => row.assetId === asset.id) ?? null}
                  onOpen={() => setOpenId(asset.id)}
                  onToggle={() => toggle(asset.id)}
                />
              ))}
            </div>
          )}
        </>
      ) : null}

      {tab === "renders" ? (
        <div className="mt-6">
          <RenderQueue
            jobs={data.renders}
            onCancel={(id) => cancel.mutate(id)}
            onRetry={(id) => retry.mutate(id)}
            onOpenOutput={(id) => {
              setTab("library");
              setOpenId(id);
            }}
          />
        </div>
      ) : null}

      <AssetDrawer
        open={Boolean(openId)}
        detail={detail.data ?? null}
        settings={data.settings}
        pending={pending}
        onOpenChange={(next) => {
          if (!next) setOpenId(null);
        }}
        onGenerateCaptions={() => openId && generate.mutate(openId)}
        onSaveCues={(trackId, cues) => saveCues.mutate({ trackId, cues })}
        onUploadSrt={(text) => openId && srt.mutate({ assetId: openId, srt: text })}
        onDownloadCaptions={(trackId, format) => {
          void exportCaptionsFn({ data: { trackId, format } }).then((file) => {
            downloadTextFile(file.filename, file.body);
          });
        }}
        onQueueRender={(preset, burnIn, captionTrackId) => {
          if (!openId) return;
          renderMut.mutate({
            assetId: openId,
            preset,
            burnInCaptions: burnIn,
            captionTrackId,
          });
        }}
        onSendSocial={() => {
          if (!openId) return;
          void navigate({ href: `/social?mediaAssetId=${encodeURIComponent(openId)}` });
        }}
        onPublishYoutube={() => {
          if (!openId) return;
          void navigate({
            href: `/social?mediaAssetId=${encodeURIComponent(openId)}&platform=youtube&mode=publish`,
          });
        }}
        onArchive={() => openId && archive.mutate(openId)}
        onProposeKnowledge={() => openId && propose.mutate(openId)}
        canDelete={data.role === "admin"}
      />
    </div>
  );
}
