import { useEffect, useRef, useState } from "react";
import { MAX_OVERLAY_CHARS } from "@/lib/thumbnails";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { fetchTrustedImage } from "@/lib/server/thumbnails";
import { toast } from "sonner";
import { userFacingErrorMessage } from "@/lib/errors";

const FONTS = [
  { id: "sans", label: "Sans", family: 'system-ui, "SF Pro Display", sans-serif' },
  { id: "serif", label: "Serif", family: "Georgia, 'Times New Roman', serif" },
  { id: "impact", label: "Impact", family: "Impact, Haettenschweiler, 'Arial Black', sans-serif" },
  { id: "mono", label: "Mono", family: "ui-monospace, 'SF Mono', monospace" },
] as const;

const COLORS = ["#ffffff", "#000000", "#ffd60a", "#ff453a", "#0a84ff"] as const;

export function CanvasEditor({
  open,
  imageUrl,
  onClose,
  onSave,
  busy,
}: {
  open: boolean;
  imageUrl: string | null;
  onClose: () => void;
  onSave: (payload: { overlayText: string; imageDataUrl: string }) => void;
  busy: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [text, setText] = useState("");
  const [fontId, setFontId] = useState<(typeof FONTS)[number]["id"]>("impact");
  const [size, setSize] = useState(64);
  const [color, setColor] = useState<string>(COLORS[0]);
  const [stroke, setStroke] = useState(true);
  const [pos, setPos] = useState({ x: 0.5, y: 0.78 });
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!open) {
      setText("");
      setFontId("impact");
      setSize(64);
      setColor(COLORS[0]);
      setStroke(true);
      setPos({ x: 0.5, y: 0.78 });
      setReady(false);
      setLoadError(false);
      imageRef.current = null;
      return;
    }
    if (!imageUrl) return;
    let cancelled = false;
    setReady(false);
    setLoadError(false);
    void (async () => {
      try {
        const { dataUrl } = await fetchTrustedImage({ data: { url: imageUrl } });
        if (cancelled) return;
        const image = new Image();
        image.onload = () => {
          if (cancelled) return;
          imageRef.current = image;
          setReady(true);
        };
        image.onerror = () => {
          if (!cancelled) setLoadError(true);
        };
        image.src = dataUrl;
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, imageUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image || !ready) return;
    const maxW = 960;
    const scale = Math.min(1, maxW / image.naturalWidth);
    const width = Math.max(16, Math.round(image.naturalWidth * scale));
    const height = Math.max(9, Math.round(image.naturalHeight * scale));
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    const value = text.trim();
    if (!value) return;
    const font = FONTS.find((item) => item.id === fontId) ?? FONTS[0];
    const fontSize = Math.max(16, Math.round((size / 960) * width));
    ctx.font = `700 ${fontSize}px ${font.family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const x = pos.x * width;
    const y = pos.y * height;
    if (stroke) {
      ctx.lineWidth = Math.max(3, Math.round(fontSize / 10));
      ctx.strokeStyle = color === "#000000" ? "#ffffff" : "#000000";
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.strokeText(value, x, y);
    }
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = Math.round(fontSize / 8);
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = color;
    ctx.fillText(value, x, y);
    ctx.shadowBlur = 0;
  }, [ready, text, fontId, size, color, stroke, pos]);

  function canvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0.5, y: 0.5 };
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    return {
      x: Math.min(0.95, Math.max(0.05, x)),
      y: Math.min(0.95, Math.max(0.05, y)),
    };
  }

  function exportJpeg(): string | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    try {
      return canvas.toDataURL("image/jpeg", 0.84);
    } catch {
      toast.error("Couldn’t export the overlay.");
      return null;
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="w-[min(100%-2rem,44rem)]">
        <DialogTitle>Add text overlay</DialogTitle>
        <DialogDescription>
          Plain text only. Drag to position. Cancel discards changes.
        </DialogDescription>
        <div className="mt-4 flex flex-col gap-4">
          <div className="overflow-hidden rounded-card border border-border bg-secondary-surface">
            {loadError ? (
              <p className="px-4 py-12 text-center text-body text-muted">Couldn’t load that image.</p>
            ) : (
              <canvas
                ref={canvasRef}
                className="block h-auto w-full cursor-grab touch-none active:cursor-grabbing"
                style={{ aspectRatio: "16 / 9" }}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setDragging(true);
                  setPos(canvasPoint(event));
                }}
                onPointerMove={(event) => {
                  if (!dragging) return;
                  setPos(canvasPoint(event));
                }}
                onPointerUp={() => setDragging(false)}
                onPointerCancel={() => setDragging(false)}
                aria-label="Thumbnail preview. Drag to position overlay text."
              />
            )}
          </div>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="overlay-text">Text</Label>
              <Input
                id="overlay-text"
                className="mt-1"
                value={text}
                maxLength={MAX_OVERLAY_CHARS}
                onChange={(event) => setText(event.target.value.slice(0, MAX_OVERLAY_CHARS))}
                placeholder="Short, bold line"
                autoFocus
              />
            </div>
            <fieldset>
              <legend className="text-caption font-medium">Font</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {FONTS.map((font) => (
                  <Button
                    key={font.id}
                    type="button"
                    size="sm"
                    variant={fontId === font.id ? "primary" : "secondary"}
                    onClick={() => setFontId(font.id)}
                  >
                    {font.label}
                  </Button>
                ))}
              </div>
            </fieldset>
            <div>
              <Label htmlFor="overlay-size">Size</Label>
              <input
                id="overlay-size"
                type="range"
                min={28}
                max={140}
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
                className="mt-2 w-full accent-[var(--accent)]"
              />
            </div>
            <fieldset>
              <legend className="text-caption font-medium">Color</legend>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {COLORS.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    className="size-11 rounded-full border border-border"
                    style={{ background: swatch }}
                    aria-label={`Color ${swatch}`}
                    onClick={() => setColor(swatch)}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  aria-label="Custom color"
                  onChange={(event) => setColor(event.target.value)}
                  className="size-11 cursor-pointer rounded-full border border-border bg-transparent p-1"
                />
              </div>
            </fieldset>
            <div className="flex min-h-11 items-center justify-between gap-3">
              <Label htmlFor="overlay-stroke">Stroke for readability</Label>
              <Switch
                id="overlay-stroke"
                checked={stroke}
                onCheckedChange={setStroke}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={busy || !ready || !text.trim() || loadError}
              onClick={() => {
                const dataUrl = exportJpeg();
                if (!dataUrl) return;
                if (dataUrl.length > 1_800_000) {
                  toast.error(userFacingErrorMessage(new Error("OVERLAY_TOO_LARGE")));
                  return;
                }
                onSave({ overlayText: text.trim(), imageDataUrl: dataUrl });
              }}
            >
              Save overlay
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
