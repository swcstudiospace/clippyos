import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Clapperboard, Image as ImageIcon, Mic, Scissors, Upload, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Label } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentPreset } from "@/lib/agent";
import type { AgentSlashUi } from "@/lib/agent-slash";
import {
  buildCrayoAutoclipGoal,
  buildCrayoExportGoal,
  buildCrayoImageGoal,
  buildCrayoImportGoal,
  buildCrayoIngestGoal,
  buildCrayoShortGoal,
  buildCrayoVoiceoverGoal,
} from "@/lib/agent-crayo";
import {
  crayoAccountFn,
  crayoListAssetsFn,
  crayoListVoicesFn,
  type CrayoAccountSnapshot,
} from "@/lib/server/studio-fns";
import { explainAgentToolError } from "@/lib/agent";

export type AgentToolCard = {
  id: string;
  ui: AgentSlashUi;
  draft: Record<string, string>;
};

export function AgentToolCardView({
  card,
  clientName,
  crayoReady,
  starting,
  onChange,
  onDismiss,
  onRun,
}: {
  card: AgentToolCard;
  clientName?: string | null;
  crayoReady: boolean;
  starting: boolean;
  onChange: (draft: Record<string, string>) => void;
  onDismiss: () => void;
  onRun: (input: { preset: AgentPreset; goal: string }) => void;
}) {
  const draft = card.draft;
  function set(partial: Record<string, string>) {
    onChange({ ...draft, ...partial });
  }

  const header = CARD_COPY[card.ui];

  return (
    <GlassCard className="p-4" beam>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {header.icon}
          <div>
            <p className="text-body font-medium">{header.title}</p>
            <p className="text-caption text-muted">{header.hint}</p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onDismiss} aria-label="Dismiss card">
          <X className="size-4" />
        </Button>
      </div>
      <div className="mt-3 flex flex-col gap-3">
        {card.ui === "short" ? (
          <ShortFields draft={draft} set={set} />
        ) : card.ui === "autoclip" ? (
          <AutoclipFields draft={draft} set={set} />
        ) : card.ui === "voiceover" ? (
          <VoiceoverFields draft={draft} set={set} crayoReady={crayoReady} />
        ) : card.ui === "image" ? (
          <ImageFields draft={draft} set={set} />
        ) : card.ui === "import" ? (
          <ImportFields draft={draft} set={set} />
        ) : card.ui === "export" ? (
          <ExportFields draft={draft} set={set} />
        ) : card.ui === "ingest" ? (
          <IngestFields draft={draft} set={set} />
        ) : card.ui === "voices" ? (
          <VoicesBrowser crayoReady={crayoReady} />
        ) : card.ui === "account" ? (
          <AccountBrowser />
        ) : card.ui === "assets" ? (
          <AssetsBrowser crayoReady={crayoReady} />
        ) : null}
      </div>
      {RUNNABLE.has(card.ui) ? (
        <Button
          className="mt-3 min-h-11"
          disabled={starting || !crayoReady || !canSubmit(card.ui, draft)}
          onClick={() => {
            const built = buildGoal(card.ui, draft, clientName);
            if (built) onRun(built);
          }}
        >
          {starting ? "Starting…" : header.action}
        </Button>
      ) : null}
      {!crayoReady && RUNNABLE.has(card.ui) ? (
        <p className="mt-2 text-caption text-warning">
          Crayo isn’t live on this deploy yet. Production CRAYO_API_KEY applies after the next deploy.
        </p>
      ) : null}
    </GlassCard>
  );
}

const RUNNABLE = new Set<AgentSlashUi>(["short", "autoclip", "voiceover", "image", "import", "export", "ingest"]);

const CARD_COPY: Record<
  AgentSlashUi,
  { title: string; hint: string; action: string; icon: ReactNode }
> = {
  short: {
    title: "9:16 short",
    hint: "Image + voiceover + export. Credits spend when Crayo accepts the job.",
    action: "Generate short",
    icon: <Clapperboard className="size-4" aria-hidden="true" />,
  },
  autoclip: {
    title: "AutoClip",
    hint: "Public https file, 1 minute to 3 hours → vertical clips.",
    action: "Cut shorts",
    icon: <Scissors className="size-4" aria-hidden="true" />,
  },
  voiceover: {
    title: "Voiceover",
    hint: "Script + a Crayo voice. Credits per second of audio.",
    action: "Generate voiceover",
    icon: <Mic className="size-4" aria-hidden="true" />,
  },
  image: {
    title: "Still",
    hint: "One image credit. Prefer 9:16 for shorts.",
    action: "Generate still",
    icon: <ImageIcon className="size-4" aria-hidden="true" />,
  },
  import: {
    title: "Import asset",
    hint: "Public https only, ≤100MB.",
    action: "Import",
    icon: <Upload className="size-4" aria-hidden="true" />,
  },
  export: {
    title: "Export project",
    hint: "Queues a render, then polls. Can take a few minutes.",
    action: "Export",
    icon: <Clapperboard className="size-4" aria-hidden="true" />,
  },
  ingest: {
    title: "Ingest to library",
    hint: "Crayo CDN https only → Filebase, source=AGENT.",
    action: "Ingest",
    icon: <Upload className="size-4" aria-hidden="true" />,
  },
  voices: {
    title: "Voices",
    hint: "Pick a voice_id, then /voice with a script.",
    action: "Browse",
    icon: <Mic className="size-4" aria-hidden="true" />,
  },
  account: {
    title: "Crayo account",
    hint: "Plan and remaining credits. Never the key.",
    action: "Refresh",
    icon: <Wallet className="size-4" aria-hidden="true" />,
  },
  assets: {
    title: "Crayo assets",
    hint: "Files already in the Crayo account.",
    action: "Browse",
    icon: <Clapperboard className="size-4" aria-hidden="true" />,
  },
};

function canSubmit(ui: AgentSlashUi, draft: Record<string, string>): boolean {
  if (ui === "short") return Boolean(draft.topic?.trim() || draft.script?.trim());
  if (ui === "autoclip" || ui === "import" || ui === "ingest") return Boolean(draft.url?.startsWith("https://"));
  if (ui === "voiceover") return Boolean(draft.script?.trim() && draft.voiceId?.trim());
  if (ui === "image") return Boolean(draft.prompt?.trim());
  if (ui === "export") return Boolean(draft.projectId?.trim());
  return false;
}

function buildGoal(
  ui: AgentSlashUi,
  draft: Record<string, string>,
  clientName?: string | null,
): { preset: AgentPreset; goal: string } | null {
  if (ui === "short") {
    return {
      preset: "crayo-short",
      goal: buildCrayoShortGoal({ topic: draft.topic ?? "", script: draft.script ?? "", clientName }),
    };
  }
  if (ui === "autoclip") {
    return {
      preset: "crayo-autoclip",
      goal: buildCrayoAutoclipGoal({ url: draft.url ?? "", clipCount: Number(draft.clipCount ?? 5) }),
    };
  }
  if (ui === "voiceover") {
    return {
      preset: "crayo-voiceover",
      goal: buildCrayoVoiceoverGoal({
        script: draft.script ?? "",
        voiceId: draft.voiceId ?? "",
        title: draft.title,
      }),
    };
  }
  if (ui === "image") {
    return {
      preset: "crayo-image",
      goal: buildCrayoImageGoal({ prompt: draft.prompt ?? "", aspectRatio: draft.aspectRatio || "9:16" }),
    };
  }
  if (ui === "import") {
    return { preset: "crayo-import", goal: buildCrayoImportGoal({ url: draft.url ?? "", name: draft.name }) };
  }
  if (ui === "export") {
    return { preset: "crayo-export", goal: buildCrayoExportGoal({ projectId: draft.projectId ?? "" }) };
  }
  if (ui === "ingest") {
    return { preset: "crayo-ingest", goal: buildCrayoIngestGoal({ url: draft.url ?? "", title: draft.title }) };
  }
  return null;
}

function ShortFields({
  draft,
  set,
}: {
  draft: Record<string, string>;
  set: (partial: Record<string, string>) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-topic">Topic / hook</Label>
        <Input
          id="card-topic"
          value={draft.topic ?? ""}
          onChange={(event) => set({ topic: event.target.value })}
          placeholder="Three habits that quietly ruin mornings"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-script">Spoken script (optional)</Label>
        <Textarea
          id="card-script"
          value={draft.script ?? ""}
          onChange={(event) => set({ script: event.target.value })}
          rows={4}
          className="min-h-24"
          placeholder="Leave blank and the agent writes a 12–20s hook"
        />
      </div>
    </>
  );
}

function AutoclipFields({
  draft,
  set,
}: {
  draft: Record<string, string>;
  set: (partial: Record<string, string>) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-long-url">Video URL</Label>
        <Input
          id="card-long-url"
          type="url"
          value={draft.url ?? ""}
          onChange={(event) => set({ url: event.target.value })}
          placeholder="https://…"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-clip-count">How many clips</Label>
        <Select value={draft.clipCount || "5"} onValueChange={(value) => set({ clipCount: value })}>
          <SelectTrigger id="card-clip-count">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["3", "5", "8", "10"].map((n) => (
              <SelectItem key={n} value={n}>
                {n} clips
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function VoiceoverFields({
  draft,
  set,
  crayoReady,
}: {
  draft: Record<string, string>;
  set: (partial: Record<string, string>) => void;
  crayoReady: boolean;
}) {
  const voicesQuery = useQuery({
    queryKey: ["agent-crayo-voices"],
    queryFn: () => crayoListVoicesFn(),
    enabled: crayoReady,
  });
  const voices = voicesQuery.data && voicesQuery.data.ok ? voicesQuery.data.voices : [];
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-vo-script">Spoken script</Label>
        <Textarea
          id="card-vo-script"
          value={draft.script ?? ""}
          onChange={(event) => set({ script: event.target.value })}
          rows={5}
          className="min-h-28"
          placeholder="Hey — three habits that quietly ruin mornings."
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-voice">Voice</Label>
        {voicesQuery.isPending ? (
          <Skeleton className="h-11" />
        ) : voices.length === 0 ? (
          <p className="text-caption text-muted">
            {voicesQuery.data && !voicesQuery.data.ok
              ? explainAgentToolError(voicesQuery.data.error)
              : "No voices returned. Check Crayo credits, then retry."}
          </p>
        ) : (
          <Select value={draft.voiceId || undefined} onValueChange={(value) => set({ voiceId: value })}>
            <SelectTrigger id="card-voice">
              <SelectValue placeholder="Pick a voice" />
            </SelectTrigger>
            <SelectContent>
              {voices.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-vo-title">Title (optional, ≤25)</Label>
        <Input
          id="card-vo-title"
          value={draft.title ?? ""}
          onChange={(event) => set({ title: event.target.value.slice(0, 25) })}
          placeholder="Morning hook"
        />
      </div>
    </>
  );
}

function ImageFields({
  draft,
  set,
}: {
  draft: Record<string, string>;
  set: (partial: Record<string, string>) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-image-prompt">Prompt</Label>
        <Textarea
          id="card-image-prompt"
          value={draft.prompt ?? ""}
          onChange={(event) => set({ prompt: event.target.value })}
          rows={4}
          className="min-h-24"
          placeholder="Neon skyline, cinematic still, 9:16"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-aspect">Aspect</Label>
        <Select value={draft.aspectRatio || "9:16"} onValueChange={(value) => set({ aspectRatio: value })}>
          <SelectTrigger id="card-aspect">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["9:16", "16:9", "1:1"].map((ratio) => (
              <SelectItem key={ratio} value={ratio}>
                {ratio}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

function ImportFields({
  draft,
  set,
}: {
  draft: Record<string, string>;
  set: (partial: Record<string, string>) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-import-url">File URL</Label>
        <Input
          id="card-import-url"
          type="url"
          value={draft.url ?? ""}
          onChange={(event) => set({ url: event.target.value })}
          placeholder="https://…"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-import-name">Name (optional)</Label>
        <Input
          id="card-import-name"
          value={draft.name ?? ""}
          onChange={(event) => set({ name: event.target.value })}
        />
      </div>
    </>
  );
}

function ExportFields({
  draft,
  set,
}: {
  draft: Record<string, string>;
  set: (partial: Record<string, string>) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="card-project-id">Project id</Label>
      <Input
        id="card-project-id"
        value={draft.projectId ?? ""}
        onChange={(event) => set({ projectId: event.target.value })}
        placeholder="proj_…"
      />
    </div>
  );
}

function IngestFields({
  draft,
  set,
}: {
  draft: Record<string, string>;
  set: (partial: Record<string, string>) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-ingest-url">Crayo CDN URL</Label>
        <Input
          id="card-ingest-url"
          type="url"
          value={draft.url ?? ""}
          onChange={(event) => set({ url: event.target.value })}
          placeholder="https://cdn-crayo.com/…"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card-ingest-title">Title (optional)</Label>
        <Input
          id="card-ingest-title"
          value={draft.title ?? ""}
          onChange={(event) => set({ title: event.target.value })}
        />
      </div>
    </>
  );
}

function VoicesBrowser({ crayoReady }: { crayoReady: boolean }) {
  const voicesQuery = useQuery({
    queryKey: ["agent-crayo-voices"],
    queryFn: () => crayoListVoicesFn(),
    enabled: crayoReady,
  });
  if (!crayoReady) {
    return <p className="text-caption text-warning">Crayo isn’t live on this deploy yet.</p>;
  }
  if (voicesQuery.isPending) return <Skeleton className="h-24" />;
  if (!voicesQuery.data?.ok) {
    return (
      <p className="text-caption text-warning">
        {explainAgentToolError(voicesQuery.data?.error ?? "MISSING")}
      </p>
    );
  }
  if (voicesQuery.data.voices.length === 0) {
    return <p className="text-caption text-muted">No voices returned.</p>;
  }
  return (
    <ul className="grid max-h-64 gap-1 overflow-y-auto">
      {voicesQuery.data.voices.map((voice) => (
        <li key={voice.id} className="flex items-baseline justify-between gap-2 rounded-control bg-secondary-surface/50 px-3 py-2">
          <span className="text-body">{voice.name}</span>
          <span className="font-mono text-caption text-muted">{voice.id}</span>
        </li>
      ))}
    </ul>
  );
}

function AccountBrowser() {
  const query = useQuery({
    queryKey: ["agent-crayo-account"],
    queryFn: () => crayoAccountFn(),
  });
  if (query.isPending) return <Skeleton className="h-16" />;
  const data: CrayoAccountSnapshot | undefined = query.data;
  if (!data?.configured) {
    return <p className="text-caption text-warning">Crayo key missing on this deploy.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <p className="text-body font-medium">{data.plan ? `Plan · ${data.plan}` : "Connected"}</p>
      {data.credits ? (
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="neutral">export {data.credits.export}</Badge>
          <Badge tone="neutral">voice {data.credits.voiceover}</Badge>
          <Badge tone="neutral">image {data.credits.image}</Badge>
          <Badge tone="neutral">video {data.credits.video}</Badge>
        </div>
      ) : (
        <p className="text-caption text-muted">{data.error ?? "Credits unavailable."}</p>
      )}
    </div>
  );
}

function AssetsBrowser({ crayoReady }: { crayoReady: boolean }) {
  const query = useQuery({
    queryKey: ["agent-crayo-assets"],
    queryFn: () => crayoListAssetsFn(),
    enabled: crayoReady,
  });
  if (!crayoReady) {
    return <p className="text-caption text-warning">Crayo isn’t live on this deploy yet.</p>;
  }
  if (query.isPending) return <Skeleton className="h-24" />;
  if (!query.data?.ok) {
    return <p className="text-caption text-warning">{explainAgentToolError(query.data?.error ?? "MISSING")}</p>;
  }
  if (query.data.assets.length === 0) {
    return <p className="text-caption text-muted">No assets in this Crayo account yet.</p>;
  }
  return (
    <ul className="grid max-h-64 gap-1 overflow-y-auto">
      {query.data.assets.map((asset) => (
        <li key={asset.id} className="flex items-baseline justify-between gap-2 rounded-control bg-secondary-surface/50 px-3 py-2">
          <span className="min-w-0 truncate text-body">{asset.name}</span>
          <span className="shrink-0 text-caption text-muted">{asset.type}</span>
        </li>
      ))}
    </ul>
  );
}
