import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  getClippingSnapshot,
  ingestClippingDrop,
  listClippingDrops,
  startClippingSession,
  stopClippingSession,
} from "@/lib/server/clipping-fns";
import { formatBytes } from "@/lib/library";
import { formatRelativeTime } from "@/lib/format";
import { userFacingErrorMessage } from "@/lib/errors";

export const Route = createFileRoute("/_app/clipping")({
  component: ClippingPage,
});

const CLIPPING_SNAPSHOT_QUERY_KEY = ["clipping", "snapshot"] as const;
const CLIPPING_DROPS_QUERY_KEY = ["clipping", "drops"] as const;
const CRAYO_URL = "https://crayo.io";

function ClippingPage() {
  const queryClient = useQueryClient();

  const snapshotQuery = useQuery({
    queryKey: CLIPPING_SNAPSHOT_QUERY_KEY,
    queryFn: () => getClippingSnapshot(),
    refetchInterval: 15000,
  });
  const dropsQuery = useQuery({
    queryKey: CLIPPING_DROPS_QUERY_KEY,
    queryFn: () => listClippingDrops(),
    refetchInterval: 15000,
  });

  const startSession = useMutation({
    mutationFn: () => startClippingSession({ data: {} }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLIPPING_SNAPSHOT_QUERY_KEY });
      toast.success("Clipping session started");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const openCrayo = useMutation({
    mutationFn: () => startClippingSession({ data: { openUrl: CRAYO_URL } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLIPPING_SNAPSHOT_QUERY_KEY });
      toast.success("Opening crayo.io on the Social Machine");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const stopSession = useMutation({
    mutationFn: () => stopClippingSession(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CLIPPING_SNAPSHOT_QUERY_KEY });
      toast.success("Clipping session stopped");
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const ingestDrop = useMutation({
    mutationFn: (dropId: string) => ingestClippingDrop({ data: { dropId } }),
    onSuccess: ({ duplicate }) => {
      void queryClient.invalidateQueries({ queryKey: CLIPPING_DROPS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: CLIPPING_SNAPSHOT_QUERY_KEY });
      if (duplicate) {
        toast.info("Clip was already in the library");
      } else {
        toast.success("Clip pulled into the library");
      }
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  if (snapshotQuery.isPending) {
    return (
      <div className="mx-auto flex max-w-[100rem] flex-col gap-4">
        <PageHeader
          title="Clipping"
          description="Log into crayo.io on the Social Machine and pull clips into the library."
        />
        <Skeleton className="h-64 w-full rounded-card" />
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  }

  if (snapshotQuery.isError || !snapshotQuery.data) {
    return (
      <div className="mx-auto max-w-[100rem]">
        <PageHeader
          title="Clipping"
          description="Log into crayo.io on the Social Machine and pull clips into the library."
        />
        <ErrorState
          className="mt-6"
          title="Couldn’t load Clipping"
          description="The Social Machine status couldn’t be read. Try again."
          onRetry={() => void snapshotQuery.refetch()}
        />
      </div>
    );
  }

  const snapshot = snapshotQuery.data;
  const drops = dropsQuery.data ?? snapshot.drops ?? [];
  const machineState =
    typeof snapshot.machine.state === "string" && snapshot.machine.state.length > 0
      ? snapshot.machine.state
      : "unknown";
  const starting = startSession.isPending || openCrayo.isPending;

  return (
    <div className="mx-auto flex w-full max-w-[100rem] flex-col gap-4 pb-24 md:pb-8">
      <PageHeader
        title="Clipping"
        description="Log into crayo.io on the Social Machine and pull clips into the library."
        actions={
          <>
            <Button onClick={() => startSession.mutate()} disabled={starting}>
              Start session
            </Button>
            <Button variant="ghost" onClick={() => stopSession.mutate()} disabled={stopSession.isPending}>
              Stop
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-5">
        <GlassCard className="flex flex-col gap-3 lg:col-span-3">
          <h2 className="text-card font-semibold tracking-tight">Browser</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone={statusTone(machineState.toUpperCase())}>{machineState}</Badge>
            <Badge tone={snapshot.crayoReady ? "green" : "orange"}>
              {snapshot.crayoReady ? "crayo ready" : "crayo key missing"}
            </Badge>
            <Badge tone={snapshot.proxyConfigured ? "blue" : "orange"}>
              {snapshot.proxyConfigured ? "residential proxy" : "no proxy"}
            </Badge>
          </div>
          {snapshot.desktopPreviewUrl ? (
            <iframe
              src={snapshot.desktopPreviewUrl}
              title="Social Machine desktop preview"
              className="aspect-video w-full rounded-control"
            />
          ) : (
            <p className="text-body text-muted">Start a session to see the machine desktop.</p>
          )}
          <div>
            <Button variant="secondary" onClick={() => openCrayo.mutate()} disabled={openCrayo.isPending}>
              Open crayo.io
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-card font-semibold tracking-tight">Captured clips</h2>
          {drops.length === 0 ? (
            <p className="text-body text-muted">
              No clips captured yet. Record on crayo.io and the files land here automatically.
            </p>
          ) : (
            <ul className="flex flex-col">
              {drops.map((drop) => {
                const meta = [formatBytes(drop.sizeBytes), formatRelativeTime(drop.modifiedAt)]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={drop.key} className="flex items-center justify-between gap-3 border-b border-glass py-2 last:border-b-0">
                    <div className="min-w-0">
                      <p className="truncate text-body">{drop.name || drop.key}</p>
                      {meta ? <p className="text-caption text-muted">{meta}</p> : null}
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={ingestDrop.isPending && ingestDrop.variables === drop.name}
                      onClick={() => ingestDrop.mutate(drop.name)}
                    >
                      Ingest
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          {dropsQuery.isError ? (
            <p className="text-caption text-danger">Couldn’t refresh captured clips — retrying automatically.</p>
          ) : null}
        </GlassCard>
      </div>
    </div>
  );
}
