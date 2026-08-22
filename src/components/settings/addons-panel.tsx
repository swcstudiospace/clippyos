import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, FileJson, Lock } from "lucide-react";
import { toast } from "sonner";
import { ADDONS_QUERY_KEY, type AddonManifest } from "@/lib/addons";
import { INTEGRATIONS_QUERY_KEY } from "@/lib/integrations";
import { listAddons, setAddonEnabled, installAddonManifest } from "@/lib/server/addon-fns";
import { getIntegrationsStatus } from "@/lib/server/integrations";
import { userFacingErrorMessage } from "@/lib/errors";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

function typeTone(type: AddonManifest["type"]) {
  if (type === "core") return "teal" as const;
  if (type === "runtime") return "blue" as const;
  if (type === "llm-provider") return "purple" as const;
  if (type === "skill-pack") return "orange" as const;
  return "neutral" as const;
}

export function AddonsPanel() {
  const queryClient = useQueryClient();
  const [manifestOpen, setManifestOpen] = useState<AddonManifest | null>(null);
  const [installOpen, setInstallOpen] = useState(false);
  const [installJson, setInstallJson] = useState("");
  const roleQuery = useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: () => getIntegrationsStatus(),
  });
  const query = useQuery({
    queryKey: ADDONS_QUERY_KEY,
    queryFn: () => listAddons(),
  });
  const isAdmin = roleQuery.data?.role === "admin";

  const toggle = useMutation({
    mutationFn: (input: { id: string; enabled: boolean }) => setAddonEnabled({ data: input }),
    onSuccess: async () => {
      toast.success("Add-on updated");
      await queryClient.invalidateQueries({ queryKey: ADDONS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const install = useMutation({
    mutationFn: async () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(installJson) as unknown;
      } catch {
        throw new Error("ADDON_INVALID");
      }
      return installAddonManifest({ data: { manifest: parsed } });
    },
    onSuccess: async () => {
      toast.success("Manifest installed");
      setInstallOpen(false);
      setInstallJson("");
      await queryClient.invalidateQueries({ queryKey: ADDONS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-section font-semibold tracking-tight">Add-on registry</h2>
        <Skeleton className="h-40 w-full rounded-card" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Couldn’t load add-ons"
        description="Retry in a moment."
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-section font-semibold tracking-tight">Add-on registry</h2>
          <p className="mt-1 text-body text-muted">
            Enable or disable OS add-ons. Disabled add-ons hide their MCP tools. Keys stay on the
            server.
          </p>
        </div>
        {isAdmin ? (
          <Button size="sm" variant="secondary" onClick={() => setInstallOpen(true)}>
            Install manifest
          </Button>
        ) : null}
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {query.data.items.map(({ manifest, state }) => {
          const locked = Boolean(manifest.locked || manifest.required);
          return (
            <li key={manifest.id}>
              <GlassCard className="h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-control bg-secondary-surface">
                      <Boxes className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-card font-semibold tracking-tight">{manifest.name}</h3>
                      <p className="font-mono text-caption text-muted">{manifest.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={typeTone(manifest.type)}>{manifest.type}</Badge>
                    {locked ? <Lock className="size-3.5 text-muted" aria-hidden="true" /> : null}
                    <Switch
                      checked={state.enabled}
                      disabled={!isAdmin || locked || toggle.isPending}
                      aria-label={`Enable ${manifest.name}`}
                      onCheckedChange={(next) => toggle.mutate({ id: manifest.id, enabled: next })}
                    />
                  </div>
                </div>
                <p className="mt-3 text-body text-muted">{manifest.description}</p>
                <p className="mt-3 text-caption text-muted">
                  Used by: {manifest.usedBy.join(", ") || "—"}
                </p>
                <p className="mt-1 text-caption text-muted">
                  Permissions: {manifest.permissions.join(", ") || "none"}
                </p>
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setManifestOpen(manifest)}
                  >
                    <FileJson className="size-4" aria-hidden="true" />
                    Manifest
                  </Button>
                </div>
              </GlassCard>
            </li>
          );
        })}
      </ul>

      <Dialog open={Boolean(manifestOpen)} onOpenChange={(open) => { if (!open) setManifestOpen(null); }}>
        <DialogContent>
          <DialogTitle>{manifestOpen?.name}</DialogTitle>
          <DialogDescription>schemaVersion 1 — no secrets in this document.</DialogDescription>
          <pre className="mt-4 max-h-80 overflow-auto rounded-control bg-secondary-surface p-3 font-mono text-caption">
            {manifestOpen ? JSON.stringify(manifestOpen, null, 2) : ""}
          </pre>
        </DialogContent>
      </Dialog>

      <Dialog open={installOpen} onOpenChange={setInstallOpen}>
        <DialogContent>
          <DialogTitle>Install add-on manifest</DialogTitle>
          <DialogDescription>
            Paste a schemaVersion 1 JSON manifest. Unknown permissions are rejected. No remote URL
            fetch in v1.
          </DialogDescription>
          <Textarea
            className="mt-4 min-h-40 font-mono text-caption"
            value={installJson}
            onChange={(event) => setInstallJson(event.target.value)}
            placeholder='{"schemaVersion":1,"id":"agency.example","name":"Example",...}'
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setInstallOpen(false)}>
              Cancel
            </Button>
            <Button disabled={install.isPending || !installJson.trim()} onClick={() => install.mutate()}>
              {install.isPending ? "Installing…" : "Install"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
