import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Sparkles, Unplug } from "lucide-react";
import { toast } from "sonner";
import {
  LLM_FEATURE_LABELS,
  LLM_FEATURES,
  LLM_MODELS,
  LLM_PROVIDER_COPY,
  LLM_PROVIDER_IDS,
  LLM_QUERY_KEY,
  type LlmFeature,
  type LlmProviderId,
  type LlmRouterConfig,
} from "@/lib/llm";
import { INTEGRATIONS_QUERY_KEY } from "@/lib/integrations";
import {
  disconnectLlmProvider,
  getLlmSnapshot,
  saveLlmApiKey,
  saveLlmRouter,
  testLlmProvider,
} from "@/lib/server/llm-fns";
import { getIntegrationsStatus } from "@/lib/server/integrations";
import { userFacingErrorMessage } from "@/lib/errors";
import { GrokOAuthSection } from "@/components/settings/grok-oauth";
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

export function LlmProvidersPanel() {
  const queryClient = useQueryClient();
  const roleQuery = useQuery({
    queryKey: INTEGRATIONS_QUERY_KEY,
    queryFn: () => getIntegrationsStatus(),
  });
  const query = useQuery({
    queryKey: LLM_QUERY_KEY,
    queryFn: () => getLlmSnapshot(),
  });
  const isAdmin = roleQuery.data?.role === "admin";

  const saveRouter = useMutation({
    mutationFn: (router: LlmRouterConfig) => saveLlmRouter({ data: router }),
    onSuccess: async () => {
      toast.success("LLM routing saved");
      await queryClient.invalidateQueries({ queryKey: LLM_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-section font-semibold tracking-tight">LLM Providers</h2>
        <Skeleton className="h-48 w-full rounded-card" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Couldn’t load LLM providers"
        description="Retry in a moment."
        onRetry={() => void query.refetch()}
      />
    );
  }

  const snap = query.data;
  const router = snap.router;

  function patchRouter(patch: Partial<LlmRouterConfig>) {
    saveRouter.mutate({
      ...router,
      ...patch,
      features: patch.features ?? router.features,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-section font-semibold tracking-tight">LLM Providers</h2>
        <p className="mt-1 text-body text-muted">
          SuperGrok OAuth uses subscription quota. The metered xAI API key is billed separately on
          console.x.ai. A 403 on OAuth means this tier cannot run inference — switch to the API
          key. HTTP 429 uses exponential backoff (not the same as a 403). Tokens never leave the
          server.
        </p>
      </div>

      {snap.rateLimit?.retrying || snap.rateLimit?.recent429 ? (
        <GlassCard>
          <h3 className="text-card font-semibold tracking-tight">xAI capacity</h3>
          <p className="mt-1 text-caption text-warning" role="status">
            {snap.rateLimit.message ?? "Capacity — retrying…"}
          </p>
          <p className="mt-2 text-caption text-muted">
            Recent 429s: {snap.rateLimit.recent429} · in flight: {snap.rateLimit.inFlight}
            {snap.rateLimit.backoffUntil
              ? ` · backoff until ${new Date(snap.rateLimit.backoffUntil).toLocaleTimeString()}`
              : ""}
          </p>
        </GlassCard>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <GlassCard>
          <p className="text-caption text-muted">{LLM_PROVIDER_COPY["xai-oauth"].billing}</p>
          <div className="mt-4">
            <GrokOAuthSection embedded />
          </div>
        </GlassCard>
        <KeyProviderCard
          id="xai-api"
          isAdmin={isAdmin}
          last4={snap.providers["xai-api"].last4}
          health={snap.providers["xai-api"].health}
        />
        <KeyProviderCard
          id="openai-compat"
          isAdmin={isAdmin}
          last4={snap.providers["openai-compat"].last4}
          health={snap.providers["openai-compat"].health}
        />
        <GlassCard>
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-card font-semibold tracking-tight">Routing</h3>
              <p className="text-caption text-muted">
                Default model is grok-4.6. Feature overrides fall back to the system default.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="llm-default-provider">System default</Label>
              <Select
                value={router.defaultProvider}
                onValueChange={(value) => patchRouter({ defaultProvider: value as LlmProviderId })}
                disabled={!isAdmin}
              >
                <SelectTrigger id="llm-default-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LLM_PROVIDER_IDS.map((id) => (
                    <SelectItem key={id} value={id}>
                      {LLM_PROVIDER_COPY[id].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="llm-default-model">Default model</Label>
              <Select
                value={router.defaultModel}
                onValueChange={(value) => patchRouter({ defaultModel: value })}
                disabled={!isAdmin}
              >
                <SelectTrigger id="llm-default-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LLM_MODELS.map((row) => (
                    <SelectItem key={row.id} value={row.id}>
                      {row.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="llm-fallback">Fallback</Label>
              <Select
                value={router.fallbackProvider ?? "none"}
                onValueChange={(value) =>
                  patchRouter({ fallbackProvider: value === "none" ? null : (value as LlmProviderId) })
                }
                disabled={!isAdmin}
              >
                <SelectTrigger id="llm-fallback">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {LLM_PROVIDER_IDS.map((id) => (
                    <SelectItem key={id} value={id}>
                      {LLM_PROVIDER_COPY[id].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {LLM_FEATURES.filter((feature) => feature !== "system").map((feature) => (
              <li
                key={feature}
                className="flex flex-col gap-2 rounded-control bg-secondary-surface/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-caption">{LLM_FEATURE_LABELS[feature as LlmFeature]}</p>
                <Select
                  value={router.features[feature] ?? "inherit"}
                  onValueChange={(value) => {
                    const features = { ...router.features };
                    if (value === "inherit") delete features[feature];
                    else features[feature] = value as LlmProviderId;
                    patchRouter({ features });
                  }}
                  disabled={!isAdmin}
                >
                  <SelectTrigger className="sm:w-56" aria-label={`${feature} provider`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inherit">System default</SelectItem>
                    {LLM_PROVIDER_IDS.map((id) => (
                      <SelectItem key={id} value={id}>
                        {LLM_PROVIDER_COPY[id].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}

function KeyProviderCard({
  id,
  isAdmin,
  last4,
  health,
}: {
  id: "xai-api" | "openai-compat";
  isAdmin: boolean;
  last4: string | null;
  health: string;
}) {
  const queryClient = useQueryClient();
  const [key, setKey] = useState("");
  const copy = LLM_PROVIDER_COPY[id];
  const save = useMutation({
    mutationFn: () => saveLlmApiKey({ data: { provider: id, key: key.trim() } }),
    onSuccess: async () => {
      setKey("");
      toast.success("Key saved");
      await queryClient.invalidateQueries({ queryKey: LLM_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const test = useMutation({
    mutationFn: () => testLlmProvider({ data: { provider: id } }),
    onSuccess: () => toast.success("Provider responded"),
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });
  const disconnect = useMutation({
    mutationFn: () => disconnectLlmProvider({ data: { provider: id } }),
    onSuccess: async () => {
      toast.success("Disconnected");
      await queryClient.invalidateQueries({ queryKey: LLM_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <KeyRound className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-card font-semibold tracking-tight">{copy.name}</h3>
            <p className="text-caption text-muted">{copy.purpose}</p>
          </div>
        </div>
        <Badge tone={statusTone(health === "connected" ? "CONNECTED" : "PENDING")}>
          {health === "connected" ? (last4 ? `…${last4}` : "Connected") : "Not configured"}
        </Badge>
      </div>
      <p className="mt-3 text-caption text-muted">{copy.billing}</p>
      {isAdmin ? (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <Label htmlFor={`key-${id}`}>API key</Label>
          <Input
            id={`key-${id}`}
            type="password"
            autoComplete="off"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder={id === "xai-api" ? "xai-…" : "sk-…"}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={save.isPending || key.trim().length < 8}>
              {save.isPending ? "Saving…" : "Save key"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={test.isPending || health === "not_configured"}
              onClick={() => test.mutate()}
            >
              {test.isPending ? "Testing…" : "Test"}
            </Button>
            {health === "connected" ? (
              <Button
                type="button"
                variant="secondary"
                disabled={disconnect.isPending}
                onClick={() => disconnect.mutate()}
              >
                <Unplug className="size-4" aria-hidden="true" />
                Disconnect
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}
    </GlassCard>
  );
}
