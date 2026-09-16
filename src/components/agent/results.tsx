import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { collectAgentVisualResults, type AgentVisualResults } from "@/lib/agent-results";
import type { AgentRunDetail } from "@/lib/agent";
import { agentRunQueryKey, isAgentBusy } from "@/lib/agent";
import { signLibraryAssetsFn } from "@/lib/server/library-fns";
import { retryClipExportFn } from "@/lib/server/agent-fns";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { userFacingErrorMessage } from "@/lib/errors";

function LibraryClips({
  runId,
  clips,
}: {
  runId: string;
  clips: AgentVisualResults["libraryClips"];
}) {
  const queryClient = useQueryClient();
  const ids = clips.map((c) => c.assetId).filter((id): id is string => Boolean(id));
  const signed = useQuery({
    queryKey: ["library-signed", ids.join(",")],
    queryFn: () => signLibraryAssetsFn({ data: { assetIds: ids } }),
    enabled: ids.length > 0,
    staleTime: 10 * 60 * 1000,
  });
  const retry = useMutation({
    mutationFn: (projectId: string) => retryClipExportFn({ data: { runId, projectId } }),
    onSuccess: async () => {
      toast.success("Export retried");
      await queryClient.invalidateQueries({ queryKey: agentRunQueryKey(runId) });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {clips.map((clip) => {
        const row = signed.data?.find((r) => r.assetId === clip.assetId);
        return (
          <figure key={clip.projectId} className="overflow-hidden rounded-control bg-black/40">
            {row?.previewUrl ? (
              <video
                src={row.previewUrl}
                poster={row.thumbnailUrl ?? undefined}
                controls
                className="max-h-72 w-full"
                preload="metadata"
              />
            ) : (
              <div className="grid h-40 place-items-center text-caption text-muted">
                {clip.status === "failed" ? "Export failed" : "Preparing…"}
              </div>
            )}
            <figcaption className="flex items-center justify-between gap-2 px-2 py-1 text-caption text-muted">
              <span className="truncate">
                {clip.title}
                {row
                  ? ` · ${row.backend === "supabase" ? "Supabase Storage" : row.backend === "s3" ? "S3" : "local disk"}`
                  : ""}
              </span>
              {row?.downloadUrl ? (
                <Button size="sm" variant="secondary" asChild>
                  <a href={row.downloadUrl}>Download</a>
                </Button>
              ) : clip.status === "failed" ? (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={retry.isPending}
                  onClick={() => retry.mutate(clip.projectId)}
                  title={clip.error ?? undefined}
                >
                  Retry
                </Button>
              ) : null}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}

export function AgentResults({ detail }: { detail: AgentRunDetail }) {
  if (isAgentBusy(detail.run.status)) return null;
  const results = collectAgentVisualResults(detail);
  if (results.empty) {
    if (detail.run.status !== "succeeded" && detail.run.status !== "failed") return null;
    return (
      <GlassCard>
        <p className="text-caption text-muted">Results</p>
        <p className="mt-1 text-body">
          This run finished without a package we can preview. Scroll the steps for tool output, or
          run a Crayo preset so videos and stills land here.
        </p>
      </GlassCard>
    );
  }
  const videos = results.media.filter((row) => row.kind === "video");
  const images = results.media.filter((row) => row.kind === "image");
  const audio = results.media.filter((row) => row.kind === "audio");
  const links = results.media.filter((row) => row.kind === "link");
  return (
    <GlassCard>
      <p className="text-caption text-muted">Results</p>
      {results.summary ? (
        <p className="mt-2 whitespace-pre-wrap text-body">{results.summary}</p>
      ) : null}
      {results.libraryClips.length > 0 ? (
        <LibraryClips runId={detail.run.id} clips={results.libraryClips} />
      ) : null}
      {videos.length > 0 ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {videos.map((row) => (
            <figure key={row.url} className="overflow-hidden rounded-control bg-black/40">
              <video src={row.url} controls className="max-h-72 w-full" preload="metadata" />
              <figcaption className="px-2 py-1 text-caption text-muted">{row.label}</figcaption>
            </figure>
          ))}
        </div>
      ) : null}
      {images.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((row) => (
            <a
              key={row.url}
              href={row.url}
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-control"
            >
              <img src={row.url} alt={row.label} className="h-36 w-full object-cover" />
            </a>
          ))}
        </div>
      ) : null}
      {audio.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {audio.map((row) => (
            <audio key={row.url} src={row.url} controls className="w-full" />
          ))}
        </div>
      ) : null}
      {results.ideas.length > 0 ? (
        <ul className="mt-3 grid gap-2">
          {results.ideas.map((idea) => (
            <li key={idea.title} className="rounded-control bg-secondary-surface/50 px-3 py-2">
              <p className="text-body font-medium">{idea.title}</p>
              {idea.rationale ? <p className="text-caption text-muted">{idea.rationale}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {results.titles.length > 0 ? (
        <ol className="mt-3 list-decimal pl-5 text-body">
          {results.titles.map((title) => (
            <li key={title}>{title}</li>
          ))}
        </ol>
      ) : null}
      {links.length > 0 ? (
        <ul className="mt-3 grid gap-1 text-caption">
          {links.map((row) => (
            <li key={row.url}>
              <a
                href={row.url}
                target="_blank"
                rel="noreferrer"
                className="text-accent underline-offset-2 hover:underline"
              >
                {row.label}: {row.url}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </GlassCard>
  );
}
