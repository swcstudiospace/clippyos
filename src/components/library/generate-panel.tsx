import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GlassCard } from "@/components/ui/glass-card";
import { LIBRARY_QUERY_KEY } from "@/lib/library";
import {
  crayoStatusFn,
  generateCrayoVideoFn,
  generateStudioThumbnailFn,
  imageGenStatusFn,
} from "@/lib/server/studio-fns";
import { userFacingErrorMessage } from "@/lib/errors";

type ClientOpt = { id: string; name: string };

export function LibraryGeneratePanel({
  clients,
  onSaved,
}: {
  clients: ClientOpt[];
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();
  const [crayoPrompt, setCrayoPrompt] = useState("");
  const [crayoScript, setCrayoScript] = useState("");
  const [crayoStyle, setCrayoStyle] = useState("default");
  const [crayoDuration, setCrayoDuration] = useState("60");
  const [crayoAspect, setCrayoAspect] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [thumbPrompt, setThumbPrompt] = useState("");
  const [thumbClientId, setThumbClientId] = useState("");

  const crayoReady = useQuery({
    queryKey: ["studio-crayo-status"],
    queryFn: () => crayoStatusFn(),
    staleTime: 30_000,
  });
  const thumbReady = useQuery({
    queryKey: ["studio-image-status"],
    queryFn: () => imageGenStatusFn(),
    staleTime: 30_000,
  });

  const generateCrayo = useMutation({
    mutationFn: () =>
      generateCrayoVideoFn({
        data: {
          prompt: crayoPrompt.trim() || undefined,
          script: crayoScript.trim() || undefined,
          style: crayoStyle,
          duration: Number(crayoDuration),
          aspectRatio: crayoAspect,
        },
      }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(result.assetId ? "Short saved to the Library" : "Short generated");
        void queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY });
        onSaved();
      } else if (result.error === "missing") {
        toast.message("Connect a Crayo.ai API key in Settings → Integrations first.");
      } else {
        toast.error("The video didn't come through. Retry.");
      }
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const generateThumb = useMutation({
    mutationFn: () =>
      generateStudioThumbnailFn({
        data: { prompt: thumbPrompt.trim(), clientId: thumbClientId || null },
      }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(result.assetId ? "Thumbnail saved to the Library" : "Thumbnail generated");
        void queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY });
        onSaved();
      } else if (result.error === "missing") {
        toast.message("Connect an image API key in Settings → Integrations first.");
      } else if (result.error === "rate_limit") {
        toast.error("The image service is busy. Retry in a moment.");
      } else {
        toast.error("The thumbnail didn't come through. Retry.");
      }
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <GlassCard className="flex flex-col gap-3 p-4">
        <h2 className="text-card font-semibold tracking-tight">Short-form · Crayo.ai</h2>
        {!crayoReady.data && !crayoReady.isPending ? (
          <p className="text-caption text-warning">Crayo.ai isn’t connected — add a key in Settings → Integrations.</p>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lib-crayo-prompt">Prompt or topic</Label>
          <Textarea
            id="lib-crayo-prompt"
            value={crayoPrompt}
            onChange={(event) => setCrayoPrompt(event.target.value)}
            placeholder="3 editing tricks that double retention"
            rows={2}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lib-crayo-script">Script (optional)</Label>
          <Textarea
            id="lib-crayo-script"
            value={crayoScript}
            onChange={(event) => setCrayoScript(event.target.value)}
            placeholder="Paste a spoken script"
            rows={4}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lib-crayo-style">Style</Label>
            <Select value={crayoStyle} onValueChange={setCrayoStyle}>
              <SelectTrigger id="lib-crayo-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="storytelling">Storytelling</SelectItem>
                <SelectItem value="fast-paced">Fast-paced</SelectItem>
                <SelectItem value="cinematic">Cinematic</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lib-crayo-duration">Duration</Label>
            <Select value={crayoDuration} onValueChange={setCrayoDuration}>
              <SelectTrigger id="lib-crayo-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30s</SelectItem>
                <SelectItem value="45">45s</SelectItem>
                <SelectItem value="60">60s</SelectItem>
                <SelectItem value="90">90s</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="lib-crayo-aspect">Aspect</Label>
            <Select value={crayoAspect} onValueChange={(value) => setCrayoAspect(value as "9:16" | "16:9" | "1:1")}>
              <SelectTrigger id="lib-crayo-aspect">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="9:16">9:16</SelectItem>
                <SelectItem value="16:9">16:9</SelectItem>
                <SelectItem value="1:1">1:1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          className="mt-auto min-h-11"
          disabled={generateCrayo.isPending || (!crayoPrompt.trim() && !crayoScript.trim())}
          onClick={() => generateCrayo.mutate()}
        >
          <Zap className="size-4" aria-hidden="true" />
          {generateCrayo.isPending ? "Generating…" : "Generate short"}
        </Button>
      </GlassCard>

      <GlassCard className="flex flex-col gap-3 p-4">
        <h2 className="text-card font-semibold tracking-tight">Thumbnail · Higgsfield / xAI</h2>
        {!thumbReady.data && !thumbReady.isPending ? (
          <p className="text-caption text-warning">Image generation isn’t configured — add a key in Settings → Integrations.</p>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lib-thumb-prompt">Thumbnail prompt</Label>
          <Textarea
            id="lib-thumb-prompt"
            value={thumbPrompt}
            onChange={(event) => setThumbPrompt(event.target.value)}
            placeholder="Bold face, high contrast, overlay ≤4 words — 16:9 4K"
            rows={4}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lib-thumb-client">Tag to client</Label>
          <Select value={thumbClientId || "none"} onValueChange={(value) => setThumbClientId(value === "none" ? "" : value)}>
            <SelectTrigger id="lib-thumb-client">
              <SelectValue placeholder="No client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No client</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="secondary"
          className="mt-auto min-h-11"
          disabled={generateThumb.isPending || !thumbPrompt.trim()}
          onClick={() => generateThumb.mutate()}
        >
          <Sparkles className="size-4" aria-hidden="true" />
          {generateThumb.isPending ? "Generating…" : "Generate thumbnail"}
        </Button>
      </GlassCard>
    </div>
  );
}
