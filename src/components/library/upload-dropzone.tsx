import { useRef, useState, type DragEvent } from "react";
import { Upload } from "lucide-react";
import { getBearerToken } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function UploadDropzone({
  clientId,
  maxUploadMb,
  disabled,
  onUploaded,
  onError,
}: {
  clientId: string | null;
  maxUploadMb: number;
  disabled?: boolean;
  onUploaded: (assetId: string, duplicate: boolean) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);
  const [pending, setPending] = useState(false);

  async function send(file: File) {
    if (disabled || pending) return;
    if (file.size > maxUploadMb * 1024 * 1024) {
      onError(`That file is larger than the ${maxUploadMb} MB upload limit.`);
      return;
    }
    setPending(true);
    try {
      const body = new FormData();
      body.append("file", file);
      if (clientId) body.append("clientId", clientId);
      body.append("title", file.name.replace(/\.[^.]+$/, ""));
      const headers = new Headers();
      const token = getBearerToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const response = await fetch("/api/library/upload", { method: "POST", body, headers });
      const json = (await response.json()) as {
        asset?: { id: string };
        duplicate?: boolean;
        error?: string;
      };
      if (!response.ok || !json.asset) {
        onError(json.error === "MEDIA_TOO_LARGE" ? "That file is too large." : "Couldn’t ingest that file.");
        return;
      }
      onUploaded(json.asset.id, Boolean(json.duplicate));
    } catch {
      onError("Couldn’t ingest that file.");
    } finally {
      setPending(false);
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setHover(false);
    const file = event.dataTransfer.files[0];
    if (file) void send(file);
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={onDrop}
      className={cn(
        "flex flex-col items-start gap-3 rounded-card border border-dashed border-border bg-secondary-surface/40 p-5",
        hover && "border-accent bg-accent/5",
      )}
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
          <Upload className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-card font-semibold tracking-tight">Drop a clip or image</p>
          <p className="text-caption text-muted">
            MP4, MOV, PNG, JPG up to {maxUploadMb} MB. Probe + checksum run after ingest.
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*,image/*,.srt,.vtt,audio/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void send(file);
          event.currentTarget.value = "";
        }}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={disabled || pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? "Uploading…" : "Choose file"}
      </Button>
    </div>
  );
}
