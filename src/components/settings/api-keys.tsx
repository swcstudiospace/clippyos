import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, KeyRound, Youtube } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAiStatus } from "@/lib/server/clients";
import { saveHiggsfieldCredentials, saveYoutubeApiKey } from "@/lib/server/settings";
import { userFacingErrorMessage } from "@/lib/errors";

export function ApiKeysSection() {
  return (
    <>
      <YoutubeKeyCard />
      <HiggsfieldKeyCard />
    </>
  );
}

function YoutubeKeyCard() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const statusQuery = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => getAiStatus(),
  });
  const connected = statusQuery.data?.youtubeDataApi === true;
  const save = useMutation({
    mutationFn: () => saveYoutubeApiKey({ data: { apiKey: apiKey.trim() } }),
    onSuccess: async () => {
      setApiKey("");
      toast.success("YouTube Data API key saved");
      await queryClient.invalidateQueries({ queryKey: ["ai-status"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <Youtube className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-card font-semibold tracking-tight">YouTube Data API</h2>
            <p className="text-caption text-muted">
              Public v3 stats for Analytics. Watch time and CTR stay manual.
            </p>
          </div>
        </div>
        <Badge tone={statusTone(connected ? "CONNECTED" : "PENDING")}>
          {connected ? "Connected" : "Not set"}
        </Badge>
      </div>
      <form
        className="mt-5 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="yt-api-key">API key</Label>
          <Input
            id="yt-api-key"
            name="youtube-api-key"
            type="password"
            autoComplete="new-password"
            spellCheck={false}
            placeholder={connected ? "•••• stored on the server" : "Paste the YouTube Data API key"}
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={save.isPending || apiKey.trim().length < 8}>
          <KeyRound className="size-4" aria-hidden="true" />
          {save.isPending ? "Saving…" : connected ? "Replace key" : "Save key"}
        </Button>
      </form>
    </GlassCard>
  );
}

function HiggsfieldKeyCard() {
  const queryClient = useQueryClient();
  const [keyId, setKeyId] = useState("");
  const [secret, setSecret] = useState("");
  const statusQuery = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => getAiStatus(),
  });
  const connected = statusQuery.data?.higgsfield === true;

  const save = useMutation({
    mutationFn: () =>
      saveHiggsfieldCredentials({
        data: { keyId: keyId.trim(), secret: secret.trim() },
      }),
    onSuccess: async () => {
      setKeyId("");
      setSecret("");
      toast.success("Higgsfield keys saved");
      await queryClient.invalidateQueries({ queryKey: ["ai-status"] });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  return (
    <GlassCard>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <Image className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-card font-semibold tracking-tight">Higgsfield</h2>
            <p className="text-caption text-muted">
              Nano Banana Pro · 16:9 · 4K. Keys never leave the server.
            </p>
          </div>
        </div>
        <Badge tone={statusTone(connected ? "CONNECTED" : "PENDING")}>
          {connected ? "Connected" : "Not set"}
        </Badge>
      </div>
      <p className="mt-4 text-body text-muted">
        Thumbnails uses these credentials first. If the Higgsfield account is out
        of credits, generation continues with the workspace image model.
      </p>
      <form
        className="mt-5 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hf-key-id">Key ID</Label>
          <Input
            id="hf-key-id"
            name="higgsfield-key-id"
            autoComplete="off"
            spellCheck={false}
            placeholder={connected ? "•••• stored on the server" : "Paste the Higgsfield key ID"}
            value={keyId}
            onChange={(event) => setKeyId(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hf-secret">API secret</Label>
          <Input
            id="hf-secret"
            name="higgsfield-secret"
            type="password"
            autoComplete="new-password"
            placeholder={connected ? "•••• stored on the server" : "Paste the Higgsfield API secret"}
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
          />
        </div>
        <Button
          type="submit"
          disabled={save.isPending || keyId.trim().length < 8 || secret.trim().length < 8}
        >
          <KeyRound className="size-4" aria-hidden="true" />
          {save.isPending ? "Saving…" : connected ? "Replace keys" : "Save keys"}
        </Button>
      </form>
    </GlassCard>
  );
}
