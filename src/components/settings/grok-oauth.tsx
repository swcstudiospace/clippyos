import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Sparkles, Unplug } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAiStatus } from "@/lib/server/clients";
import {
  disconnectGrokOAuthFn,
  pollGrokOAuth,
  startGrokOAuth,
} from "@/lib/server/settings";
import { userFacingErrorMessage } from "@/lib/errors";
import { INTEGRATIONS_QUERY_KEY } from "@/lib/integrations";
import { LLM_QUERY_KEY } from "@/lib/llm";
import { copyTextToClipboard } from "@/lib/clipboard";

type DeviceStart = {
  userCode: string;
  verificationUri: string;
  verificationUriComplete: string | null;
  expiresIn: number;
  interval: number;
};

export function GrokOAuthSection({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient();
  const statusQuery = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => getAiStatus(),
  });
  const source = statusQuery.data?.llmSource ?? "none";
  const email = statusQuery.data?.grokEmail ?? null;
  const connected = source === "oauth";
  const platform = source === "platform";
  const [device, setDevice] = useState<DeviceStart | null>(null);

  const start = useMutation({
    mutationFn: () => startGrokOAuth(),
    onSuccess: (data) => setDevice(data),
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const disconnect = useMutation({
    mutationFn: () => disconnectGrokOAuthFn(),
    onSuccess: async () => {
      toast.success("SuperGrok disconnected");
      await queryClient.invalidateQueries({ queryKey: ["ai-status"] });
      await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: LLM_QUERY_KEY });
    },
    onError: (error) => toast.error(userFacingErrorMessage(error)),
  });

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-card font-semibold tracking-tight">Grok 4.6</h2>
            <p className="text-caption text-muted">
              SuperGrok Heavy via the same sign-in Grok Build and Hermes use.
            </p>
          </div>
        </div>
        <Badge
          tone={statusTone(
            connected ? "CONNECTED" : platform ? "ACTIVE" : "PENDING",
          )}
        >
          {connected ? "SuperGrok" : platform ? "Platform key" : "Not connected"}
        </Badge>
      </div>
      <p className="mt-4 text-body text-muted">
        Connect your SuperGrok account so Ideation, titles, ideas, and training
        run on Grok 4.6 against your subscription. Tokens stay on the server.
        {email ? ` Signed in as ${email}.` : null}
        {platform && !connected
          ? " A workspace key is already active for this preview."
          : null}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        {connected ? (
          <Button
            variant="secondary"
            disabled={disconnect.isPending}
            onClick={() => disconnect.mutate()}
          >
            <Unplug className="size-4" aria-hidden="true" />
            {disconnect.isPending ? "Disconnecting…" : "Disconnect SuperGrok"}
          </Button>
        ) : (
          <Button disabled={start.isPending} onClick={() => start.mutate()}>
            {start.isPending ? "Starting…" : "Connect SuperGrok"}
          </Button>
        )}
      </div>
      <DeviceDialog
        device={device}
        onClose={() => setDevice(null)}
        onConnected={async () => {
          setDevice(null);
          toast.success("SuperGrok connected");
          await queryClient.invalidateQueries({ queryKey: ["ai-status"] });
          await queryClient.invalidateQueries({ queryKey: INTEGRATIONS_QUERY_KEY });
          await queryClient.invalidateQueries({ queryKey: LLM_QUERY_KEY });
        }}
      />
    </>
  );

  if (embedded) {
    return (
      <div className="rounded-control border border-border/70 bg-secondary-surface/40 p-4">
        {inner}
      </div>
    );
  }
  return <GlassCard>{inner}</GlassCard>;
}

function DeviceDialog({
  device,
  onClose,
  onConnected,
}: {
  device: DeviceStart | null;
  onClose: () => void;
  onConnected: () => void | Promise<void>;
}) {
  const intervalRef = useRef<number>(device?.interval ?? 5);
  useEffect(() => {
    if (!device) return;
    intervalRef.current = device.interval;
    let cancelled = false;
    let timer = 0;
    const tick = async () => {
      try {
        const result = await pollGrokOAuth();
        if (cancelled) return;
        if (result.status === "connected") {
          await onConnected();
          return;
        }
        if (result.status === "expired" || result.status === "denied") {
          toast.error(
            result.status === "denied"
              ? "Sign-in was denied."
              : "That code expired. Start SuperGrok sign-in again.",
          );
          onClose();
          return;
        }
        if (result.status === "slow_down") {
          intervalRef.current = result.interval;
        }
      } catch {
        /* keep polling — transient */
      }
      if (!cancelled) {
        timer = window.setTimeout(() => void tick(), intervalRef.current * 1000);
      }
    };
    timer = window.setTimeout(() => void tick(), intervalRef.current * 1000);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [device, onClose, onConnected]);

  if (!device) return null;
  const href = device.verificationUriComplete ?? device.verificationUri;

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogTitle>Approve SuperGrok</DialogTitle>
        <DialogDescription>
          Open the Grok sign-in page and approve this workspace. The same device
          flow Grok Build and Hermes Agent use.
        </DialogDescription>
        <p className="mt-5 text-center font-mono text-page tracking-[0.2em]">
          {device.userCode}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button asChild>
            <a href={href} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" aria-hidden="true" />
              Open Grok sign-in
            </a>
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              void copyTextToClipboard(device.userCode).then((ok) => {
                toast[ok ? "success" : "error"](ok ? "Code copied" : "Couldn’t copy");
              });
            }}
          >
            Copy code
          </Button>
        </div>
        <p className="mt-3 text-caption text-muted">
          Waiting for approval… this dialog closes when Grok confirms.
        </p>
      </DialogContent>
    </Dialog>
  );
}
