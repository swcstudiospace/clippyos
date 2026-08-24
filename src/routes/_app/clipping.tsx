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
  checkCrayoLoginFn,
  getClippingSnapshot,
  ingestClippingDrop,
  listClippingDrops,
  listClippingProcedureSkillsFn,
  runClippingProcedureSkillFn,
  startClippingSession,
  stopClippingSession,
} from "@/lib/server/clipping-fns";
import { formatBytes } from "@/lib/library";
import { formatRelativeTime } from "@/lib/format";
import { userFacingErrorMessage } from "@/lib/errors";

export const Route = createFileRoute("/_app/clipping")({
  component: ClippingPage,
});
const CRAYO_URL = "https://crayo.io";
const CLIPPING_SNAPSHOT_QUERY_KEY = ["clipping", "snapshot"] as const;
const CLIPPING_DROPS_QUERY_KEY = ["clipping", "drops"] as const;
const CLIPPING_SKILLS_QUERY_KEY = ["clipping", "procedure-skills"] as const;

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
  const skillsQuery = useQuery({
    queryKey: CLIPPING_SKILLS_QUERY_KEY,
    queryFn: () => listClippingProcedureSkillsFn(),
  });

  const checkCrayoLogin = useMutation({
    mutationFn: () => checkCrayoLoginFn(),
    onSuccess: ({ state }) => {
      void queryClient.invalidateQueries({ queryKey: CLIPPING_SNAPSHOT_QUERY_KEY });
      if (state === "logged_in") {
        toast.success("crayo.io is logged in");
      } else if (state === "login_wall") {
        toast.warning("crayo.io is showing a login wall — sign in inside the preview");
      } else {
        toast.info("Couldn’t tell whether crayo.io is logged in");
      }
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const runProcedure = useMutation({
    mutationFn: (slug: string) => runClippingProcedureSkillFn({ data: { slug } }),
    onSuccess: (_result, slug) => {
      void queryClient.invalidateQueries({ queryKey: CLIPPING_SNAPSHOT_QUERY_KEY });
      toast.success(`Procedure “${slug}” finished`);
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
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
  const crayoLoginState = snapshot.crayoLogin?.state ?? "unknown";
  const crayoLoginCheckedAt = snapshot.crayoLogin?.checkedAt ?? null;
  const crayoLoginTone =
    crayoLoginState === "logged_in" ? "green" : crayoLoginState === "login_wall" ? "orange" : "neutral";
  const skills = skillsQuery.data ?? [];

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
            <Badge
              tone={crayoLoginTone}
              title={
                crayoLoginCheckedAt
                  ? `Last checked ${formatRelativeTime(crayoLoginCheckedAt) || "just now"}`
                  : "Not checked yet"
              }
            >
              {crayoLoginState === "logged_in"
                ? "crayo logged in"
                : crayoLoginState === "login_wall"
                  ? "crayo login wall"
                  : "crayo login unknown"}
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
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => openCrayo.mutate()} disabled={openCrayo.isPending}>
              Open crayo.io
            </Button>
            <Button
              variant="ghost"
              onClick={() => checkCrayoLogin.mutate()}
              disabled={checkCrayoLogin.isPending}
            >
              {checkCrayoLogin.isPending ? "Checking…" : "Check crayo login"}
            </Button>
            {crayoLoginCheckedAt ? (
              <span className="text-caption text-muted">
                Checked {formatRelativeTime(crayoLoginCheckedAt) || "just now"}
              </span>
            ) : null}
          </div>
          {crayoLoginState === "login_wall" ? (
            <div className="flex flex-col gap-1 rounded-control border border-glass bg-secondary-surface/60 p-3">
              <p className="text-body font-medium">Guided login needed</p>
              <p className="text-caption text-muted">
                crayo.io is showing a sign-in wall. Click “Open crayo.io”, then sign in yourself
                inside the desktop preview above — the agent never touches your credentials. When
                you’re in, press “Check crayo login” to re-verify.
              </p>
            </div>
          ) : null}
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

      <GlassCard className="flex flex-col gap-3">
        <h2 className="text-card font-semibold tracking-tight">Browser skills</h2>
        <p className="text-caption text-muted">
          Recorded browser procedures that replay step-by-step on the Social Machine.
        </p>
        {skillsQuery.isPending ? (
          <Skeleton className="h-16 w-full rounded-control" />
        ) : skillsQuery.isError ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-caption text-danger">Couldn’t load browser skills.</p>
            <Button size="sm" variant="secondary" onClick={() => void skillsQuery.refetch()}>
              Retry
            </Button>
          </div>
        ) : skills.length === 0 ? (
          <p className="text-body text-muted">
            No browser-procedure skills yet. Approved procedure skills appear here.
          </p>
        ) : (
          <ul className="flex flex-col">
            {skills.map((skill) => {
              const running = runProcedure.isPending && runProcedure.variables === skill.slug;
              return (
                <li
                  key={skill.slug}
                  className="flex items-center justify-between gap-3 border-b border-glass py-2 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-body">{skill.name}</p>
                    {skill.description ? (
                      <p className="truncate text-caption text-muted">{skill.description}</p>
                    ) : null}
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={runProcedure.isPending}
                    onClick={() => runProcedure.mutate(skill.slug)}
                  >
                    {running ? "Running…" : "Run"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
        {runProcedure.isError ? (
          <p className="text-caption text-danger">{userFacingErrorMessage(runProcedure.error)}</p>
        ) : null}
      </GlassCard>
    </div>
  );
}
