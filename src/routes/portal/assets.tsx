import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, Film, Image as ImageIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { formatCompactCount, formatRelativeTime } from "@/lib/format";
import { formatDurationSec } from "@/lib/library";
import { PORTAL_ASSETS_KEY } from "@/lib/portal";
import { listPortalAssetsFn, signPortalDownloadFn } from "@/lib/server/portal-fns";
import { toast } from "sonner";
import { userFacingErrorMessage } from "@/lib/errors";

export const Route = createFileRoute("/portal/assets")({
  component: PortalAssetsPage,
});

function PortalAssetsPage() {
  const [kind, setKind] = useState<"ALL" | "VIDEO" | "IMAGE">("ALL");
  const [openId, setOpenId] = useState<string | null>(null);
  const query = useQuery({
    queryKey: [...PORTAL_ASSETS_KEY, kind],
    queryFn: () => listPortalAssetsFn({ data: { kind } }),
  });
  const download = useMutation({
    mutationFn: (assetId: string) => signPortalDownloadFn({ data: { assetId } }),
    onSuccess: (data) => {
      window.open(data.url, "_blank", "noopener,noreferrer");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  if (query.isPending) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="aspect-video w-full" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <ErrorState title="Couldn’t load deliverables" onRetry={() => void query.refetch()} />
    );
  }

  const assets = query.data?.assets ?? [];
  const allowDownload = query.data?.allowDownload ?? false;
  const open = assets.find((row) => row.id === openId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Deliverables"
        description="Ready videos and images for your brand. Nothing internal, nothing from other clients."
      />
      <div className="flex flex-wrap gap-2">
        {(["ALL", "VIDEO", "IMAGE"] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={kind === value ? "primary" : "secondary"}
            onClick={() => setKind(value)}
          >
            {value === "ALL" ? "All" : value === "VIDEO" ? "Video" : "Images"}
          </Button>
        ))}
      </div>
      {assets.length === 0 ? (
        <EmptyState
          title="Nothing ready yet"
          description="When a clip or thumbnail is marked ready, it will land here."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {assets.map((asset) => (
            <li key={asset.id}>
              <GlassCard interactive className="overflow-hidden p-0">
                <button
                  type="button"
                  className="relative aspect-video w-full bg-secondary-surface"
                  onClick={() => setOpenId(asset.id)}
                >
                  {asset.previewUrl ? (
                    asset.kind === "IMAGE" ? (
                      <img src={asset.previewUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <video
                        src={asset.previewUrl}
                        className="size-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    )
                  ) : (
                    <span className="grid size-full place-items-center text-muted">
                      {asset.kind === "IMAGE" ? (
                        <ImageIcon className="size-8" />
                      ) : (
                        <Film className="size-8" />
                      )}
                    </span>
                  )}
                </button>
                <div className="flex items-start justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-body font-medium">{asset.title}</p>
                    <p className="text-caption text-muted">
                      {asset.kind === "VIDEO" && asset.durationSec
                        ? formatDurationSec(asset.durationSec)
                        : asset.kind}
                      {" · "}
                      {formatRelativeTime(asset.createdAt)}
                      {asset.views != null ? ` · ${formatCompactCount(asset.views)} views` : ""}
                    </p>
                  </div>
                  {allowDownload ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label={`Download ${asset.title}`}
                      onClick={() => download.mutate(asset.id)}
                    >
                      <Download className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </GlassCard>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div
          className={cn(
            "fixed inset-0 z-40 grid place-items-center bg-bg/80 p-4 backdrop-blur-sm",
          )}
          onClick={() => setOpenId(null)}
        >
          <GlassCard className="max-h-[90dvh] w-full max-w-lg overflow-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-card font-semibold tracking-tight">{open.title}</h2>
            <div className="mt-3 overflow-hidden rounded-control bg-secondary-surface">
              {open.previewUrl && open.kind === "IMAGE" ? (
                <img src={open.previewUrl} alt="" className="w-full" />
              ) : open.previewUrl ? (
                <video src={open.previewUrl} className="w-full" controls playsInline />
              ) : null}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              {allowDownload ? (
                <Button variant="secondary" onClick={() => download.mutate(open.id)}>
                  <Download className="size-4" />
                  Download
                </Button>
              ) : null}
              <Button onClick={() => setOpenId(null)}>Close</Button>
            </div>
          </GlassCard>
        </div>
      ) : null}
    </div>
  );
}
