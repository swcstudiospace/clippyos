import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Clapperboard, HardDrive, Globe } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LIBRARY_MEDIA_SETTINGS_KEY,
  PRESET_LABELS,
  RENDER_PRESETS,
  type RenderPreset,
} from "@/lib/library";
import {
  getMediaSettingsFn,
  saveMediaSettingsFn,
  saveS3SettingsFn,
  saveIpfsSettingsFn,
  testRenderFn,
} from "@/lib/server/library-fns";
import { userFacingErrorMessage } from "@/lib/errors";
import { INTEGRATIONS_QUERY_KEY } from "@/lib/integrations";
import { getIntegrationsStatus } from "@/lib/server/integrations";
import { FILEBASE_ENDPOINT, DEFAULT_IPFS_GATEWAY } from "@/lib/social-machine";

export function MediaPipelinePanel() {
  const queryClient = useQueryClient();
  const roleQuery = useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: () => getIntegrationsStatus(),
  });
  const query = useQuery({
    queryKey: LIBRARY_MEDIA_SETTINGS_KEY,
    queryFn: () => getMediaSettingsFn(),
  });
  const isAdmin = roleQuery.data?.role === "admin";

  const save = useMutation({
    mutationFn: (patch: {
      defaultPreset?: RenderPreset;
      maxUploadMb?: number;
      concurrentRenders?: number;
      daytonaRender?: boolean;
    }) => saveMediaSettingsFn({ data: patch }),
    onSuccess: async () => {
      toast.success("Media pipeline saved");
      await queryClient.invalidateQueries({ queryKey: LIBRARY_MEDIA_SETTINGS_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const test = useMutation({
    mutationFn: () => testRenderFn(),
    onSuccess: (result) => {
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-section font-semibold tracking-tight">Media pipeline</h2>
        <Skeleton className="h-48 w-full rounded-card" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Couldn’t load media settings"
        description="Retry in a moment."
        onRetry={() => void query.refetch()}
      />
    );
  }

  const settings = query.data;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-section font-semibold tracking-tight">Media pipeline</h2>
        <p className="mt-1 max-w-2xl text-caption text-muted">
          Transcription, render presets, and FFmpeg worker health. Captions still work from a manual
          SRT if speech-to-text is off. Clips live in Supabase Storage on Vercel — the Windows Social
          Machine is not the media backend.
        </p>
      </div>
      <GlassCard>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
              <Clapperboard className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-card font-semibold tracking-tight">Transcription</h3>
              <p className="text-caption text-muted">{settings.transcriptionHint}</p>
            </div>
          </div>
          <Badge tone={statusTone(settings.transcriptionConfigured ? "CONNECTED" : "PENDING")}>
            {settings.transcriptionConfigured ? "xAI STT" : "Manual SRT"}
          </Badge>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone={settings.ffmpegAvailable ? "green" : "orange"}>
            {settings.ffmpegAvailable
              ? `FFmpeg ${settings.ffmpegVersion ?? "ready"}`
              : "FFmpeg missing"}
          </Badge>
          <Badge tone={settings.libraryBackend === "local" ? "orange" : "green"}>
            {settings.libraryBackend === "supabase"
              ? "Supabase Storage"
              : settings.libraryBackend === "s3"
                ? "S3 / Filebase"
                : "Local preview disk"}
          </Badge>
        </div>
        <p className="mt-3 text-caption text-muted">{settings.libraryBackendHint}</p>
      </GlassCard>

      <GlassCard>
        <h3 className="text-card font-semibold tracking-tight">Defaults</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="default-preset">Default render preset</Label>
            <Select
              value={settings.defaultPreset}
              disabled={!isAdmin}
              onValueChange={(value) => save.mutate({ defaultPreset: value as RenderPreset })}
            >
              <SelectTrigger id="default-preset">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RENDER_PRESETS.map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    {PRESET_LABELS[preset]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="max-upload">Max upload (MB)</Label>
            <Input
              id="max-upload"
              type="number"
              min={8}
              max={512}
              defaultValue={settings.maxUploadMb}
              disabled={!isAdmin}
              onBlur={(event) => {
                const value = Number(event.target.value);
                if (Number.isFinite(value) && value !== settings.maxUploadMb) {
                  save.mutate({ maxUploadMb: value });
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="concurrent">Concurrent renders</Label>
            <Select
              value={String(settings.concurrentRenders)}
              disabled={!isAdmin}
              onValueChange={(value) => save.mutate({ concurrentRenders: Number(value) })}
            >
              <SelectTrigger id="concurrent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="mt-6 flex items-center gap-2 text-body">
            <input
              type="checkbox"
              checked={settings.daytonaRender}
              disabled={!isAdmin}
              onChange={(event) => save.mutate({ daytonaRender: event.target.checked })}
            />
            Prefer Daytona for long renders (job-scoped sandbox, never on login)
          </label>
        </div>
        <Button
          type="button"
          className="mt-4"
          variant="secondary"
          disabled={!isAdmin || test.isPending || !settings.ffmpegAvailable}
          onClick={() => test.mutate()}
        >
          {test.isPending ? "Testing…" : "Test render"}
        </Button>
      </GlassCard>

      <GlassCard>
        <h3 className="text-card font-semibold tracking-tight">Setup</h3>
        <ol className="mt-3 flex flex-col gap-3">
          <li className="rounded-control bg-secondary-surface/50 p-3">
            <p className="text-caption font-medium text-muted">Step 1</p>
            <h4 className="mt-1 text-body font-semibold">Transcription</h4>
            <p className="mt-1 text-caption text-muted">
              Auto-captions use the workspace xAI key (same as Ideation). If STT is off, upload an
              SRT on a video asset — captions still edit and burn in.
            </p>
          </li>
          <li className="rounded-control bg-secondary-surface/50 p-3">
            <p className="text-caption font-medium text-muted">Step 2</p>
            <h4 className="mt-1 text-body font-semibold">FFmpeg worker</h4>
            <p className="mt-1 text-caption text-muted">
              Health is probed on this host. Test render encodes a 1-second 9:16 clip and queues it
              in Library → Renders.
            </p>
          </li>
          <li className="rounded-control bg-secondary-surface/50 p-3">
            <p className="text-caption font-medium text-muted">Step 3</p>
            <h4 className="mt-1 text-body font-semibold">Daytona (optional)</h4>
            <p className="mt-1 text-caption text-muted">
              Long renders can use a job-scoped sandbox. It never starts on login.
            </p>
          </li>
        </ol>
      </GlassCard>

      <StorageCard
        configured={settings.s3Configured}
        endpoint={settings.s3Endpoint}
        bucket={settings.s3Bucket}
        isAdmin={isAdmin}
      />
      <IpfsCard
        configured={settings.ipfsConfigured}
        gateway={settings.ipfsGateway}
        lastCid={settings.ipfsLastCid}
        strategy={settings.ipfsStrategy}
        strategyHint={settings.ipfsStrategyHint}
        isAdmin={isAdmin}
      />
    </div>
  );
}

function StorageCard({
  configured,
  endpoint,
  bucket,
  isAdmin,
}: {
  configured: boolean;
  endpoint: string | null;
  bucket: string | null;
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState({
    endpoint: endpoint ?? FILEBASE_ENDPOINT,
    region: "us-east-1",
    bucket: bucket ?? "",
    accessKey: "",
    secret: "",
  });
  const save = useMutation({
    mutationFn: () => saveS3SettingsFn({ data: fields }),
    onSuccess: async () => {
      toast.success("Object storage saved");
      await queryClient.invalidateQueries({ queryKey: LIBRARY_MEDIA_SETTINGS_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  function onSave(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <GlassCard>
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
          <HardDrive className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-card font-semibold tracking-tight">Clip storage</h3>
          <p className="text-caption text-muted">
            Vercel has no durable disk. Use Supabase Storage first (free 1 GB). Optional S3-compatible
            overflow: Filebase (5 GB free, IPFS-backed) or Storj. The Windows Social Machine’s 50 GB
            disk is for browser profiles and hot snapshots only.
          </p>
        </div>
      </div>
      <p className="mt-3 text-caption text-muted">
        {configured
          ? `S3 connected${bucket ? ` · ${bucket}` : ""}${endpoint ? ` · ${endpoint}` : ""}`
          : "No S3 credentials — Supabase (if connected) or local preview disk."}
      </p>
      {isAdmin ? (
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSave}>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="s3-endpoint">S3 endpoint</Label>
            <Input
              id="s3-endpoint"
              value={fields.endpoint}
              onChange={(event) => setFields((cur) => ({ ...cur, endpoint: event.target.value }))}
              placeholder={FILEBASE_ENDPOINT}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s3-bucket">Bucket</Label>
            <Input
              id="s3-bucket"
              value={fields.bucket}
              onChange={(event) => setFields((cur) => ({ ...cur, bucket: event.target.value }))}
              placeholder="clippy-clips"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s3-region">Region</Label>
            <Input
              id="s3-region"
              value={fields.region}
              onChange={(event) => setFields((cur) => ({ ...cur, region: event.target.value }))}
              placeholder="us-east-1"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s3-key">Access key</Label>
            <Input
              id="s3-key"
              value={fields.accessKey}
              onChange={(event) => setFields((cur) => ({ ...cur, accessKey: event.target.value }))}
              placeholder={configured ? "•••• stored" : "Access key"}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="s3-secret">Secret</Label>
            <Input
              id="s3-secret"
              type="password"
              value={fields.secret}
              onChange={(event) => setFields((cur) => ({ ...cur, secret: event.target.value }))}
              placeholder={configured ? "•••• stored" : "Secret"}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save object storage"}
            </Button>
          </div>
        </form>
      ) : null}
    </GlassCard>
  );
}

function IpfsCard({
  configured,
  gateway,
  lastCid,
  strategy,
  strategyHint,
  isAdmin,
}: {
  configured: boolean;
  gateway: string | null;
  lastCid: string | null;
  strategy: "eager" | "on_publish" | "replicate" | "manual";
  strategyHint: string;
  isAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const [fields, setFields] = useState({
    pinataJwt: "",
    gateway: gateway ?? DEFAULT_IPFS_GATEWAY,
    strategy,
  });
  const save = useMutation({
    mutationFn: () => saveIpfsSettingsFn({ data: fields }),
    onSuccess: async () => {
      toast.success("Pinning strategy saved");
      await queryClient.invalidateQueries({ queryKey: LIBRARY_MEDIA_SETTINGS_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  function onSave(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <GlassCard>
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
          <Globe className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-card font-semibold tracking-tight">Content pinning</h3>
          <p className="text-caption text-muted">
            Optional pin onto the content network after a clip lands in immutable cloud storage.
            Never the write backend. Never the Social Machine disk.
          </p>
        </div>
      </div>
      <p className="mt-3 text-caption text-muted">
        {configured
          ? `${strategyHint}${lastCid ? ` Last pin ${lastCid.slice(0, 12)}…` : ""}`
          : strategyHint}
      </p>
      {isAdmin ? (
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={onSave}>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="ipfs-jwt">Pinning token</Label>
            <Input
              id="ipfs-jwt"
              type="password"
              value={fields.pinataJwt}
              onChange={(event) => setFields((cur) => ({ ...cur, pinataJwt: event.target.value }))}
              placeholder={configured ? "•••• stored" : "JWT"}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="ipfs-gw">Gateway</Label>
            <Input
              id="ipfs-gw"
              value={fields.gateway}
              onChange={(event) => setFields((cur) => ({ ...cur, gateway: event.target.value }))}
              placeholder={DEFAULT_IPFS_GATEWAY}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="ipfs-strategy">Pinning strategy</Label>
            <Select
              value={fields.strategy}
              onValueChange={(value) =>
                setFields((cur) => ({ ...cur, strategy: value as typeof fields.strategy }))
              }
            >
              <SelectTrigger id="ipfs-strategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="eager">Eager — pin every new clip</SelectItem>
                <SelectItem value="on_publish">On publish — pin when it goes public</SelectItem>
                <SelectItem value="replicate">Replicate — pin and keep object storage</SelectItem>
                <SelectItem value="manual">Manual — pin only when asked</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save pinning"}
            </Button>
          </div>
        </form>
      ) : null}
    </GlassCard>
  );
}

