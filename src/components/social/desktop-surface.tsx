import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  Expand,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Scaling,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { SOCIAL_DESKTOP_SIZE_KEY } from "@/lib/constants";
import {
  DEFAULT_DESKTOP_HEIGHT,
  DEFAULT_DESKTOP_WIDTH,
  formatDisplaySize,
  novncEmbedUrl,
  type SocialMachineStatus,
} from "@/lib/social";
import { cn } from "@/lib/utils";

type Size = { width: number; height: number };
type Mode = "fit" | "fill" | "custom";
type DragKind = "height" | "both";

const MIN_WIDTH = 480;
const MIN_HEIGHT = 320;

function readStoredSize(): Size | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SOCIAL_DESKTOP_SIZE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { width?: unknown; height?: unknown };
    const width = Number(parsed.width);
    const height = Number(parsed.height);
    if (!Number.isFinite(width) || !Number.isFinite(height)) return null;
    if (width < MIN_WIDTH || height < MIN_HEIGHT) return null;
    return { width: Math.round(width), height: Math.round(height) };
  } catch {
    return null;
  }
}

function persistSize(size: Size) {
  try {
    window.localStorage.setItem(SOCIAL_DESKTOP_SIZE_KEY, JSON.stringify(size));
  } catch {
    /* storage blocked */
  }
}

function clearStoredSize() {
  try {
    window.localStorage.removeItem(SOCIAL_DESKTOP_SIZE_KEY);
  } catch {
    /* storage blocked */
  }
}

function useScreenshotSize(src: string | null): Size | null {
  const [size, setSize] = useState<Size | null>(null);
  useEffect(() => {
    if (!src) {
      setSize(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth >= 320 && img.naturalHeight >= 240) {
        setSize({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.src = src;
    return () => {
      img.onload = null;
    };
  }, [src]);
  return size;
}

function fitInto(vm: Size, hostWidth: number, maxHeight: number): Size {
  const widthCap = Math.max(MIN_WIDTH, hostWidth);
  const heightCap = Math.max(MIN_HEIGHT, maxHeight);
  if (vm.width <= widthCap && vm.height <= heightCap) {
    return { width: vm.width, height: vm.height };
  }
  const scale = Math.min(widthCap / vm.width, heightCap / vm.height);
  return {
    width: Math.max(MIN_WIDTH, Math.round(vm.width * scale)),
    height: Math.max(MIN_HEIGHT, Math.round(vm.height * scale)),
  };
}

function DesktopFrame({
  src,
  title,
  className,
}: {
  src: string;
  title: string;
  className?: string;
}) {
  return (
    <iframe
      title={title}
      src={src}
      className={cn("size-full border-0 bg-bg", className)}
      allow="clipboard-read; clipboard-write; fullscreen; autoplay; keyboard-map"
      allowFullScreen
      referrerPolicy="no-referrer"
    />
  );
}

function ImmersiveDesktop({
  src,
  vm,
  onClose,
  onReload,
  onOpenTab,
  refreshing,
}: {
  src: string;
  vm: Size;
  onClose: () => void;
  onReload: () => void;
  onOpenTab: () => void;
  refreshing: boolean;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="vm-immersive"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vm-immersive-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-elevated px-3 py-2">
        <div className="min-w-0">
          <p id="vm-immersive-title" className="text-card font-semibold tracking-tight">
            Social Machine
          </p>
          <p className="text-caption text-muted">
            Full desktop · {formatDisplaySize(vm.width, vm.height)} · Esc to return
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={onReload} disabled={refreshing}>
            <RefreshCw className={`size-3.5 ${refreshing ? "motion-safe:animate-spin" : ""}`} />
            Reload
          </Button>
          <Button size="sm" variant="ghost" onClick={onOpenTab}>
            <ExternalLink className="size-3.5" />
            New tab
          </Button>
          <Button size="sm" onClick={onClose}>
            <Minimize2 className="size-3.5" />
            Exit full desktop
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 bg-bg">
        <DesktopFrame src={src} title="Social Machine desktop full view" />
      </div>
    </div>,
    document.body,
  );
}

export function DesktopSurface({
  machine,
  onRefresh,
  refreshing,
}: {
  machine: SocialMachineStatus;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const running = machine.state === "running";
  const src = novncEmbedUrl(machine.previewUrl);
  const shotSize = useScreenshotSize(machine.lastScreenshot);
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [hostWidth, setHostWidth] = useState(0);
  const [viewportH, setViewportH] = useState(() =>
    typeof window === "undefined" ? 800 : window.innerHeight,
  );
  const [mode, setMode] = useState<Mode>("fit");
  const [custom, setCustom] = useState<Size | null>(null);
  const [immersive, setImmersive] = useState(false);
  const dragRef = useRef<{
    kind: DragKind;
    startX: number;
    startY: number;
    start: Size;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const vm: Size = useMemo(() => {
    if (machine.displayWidth && machine.displayHeight) {
      return { width: machine.displayWidth, height: machine.displayHeight };
    }
    if (shotSize) return shotSize;
    return { width: DEFAULT_DESKTOP_WIDTH, height: DEFAULT_DESKTOP_HEIGHT };
  }, [machine.displayWidth, machine.displayHeight, shotSize]);

  useEffect(() => {
    const stored = readStoredSize();
    if (stored) {
      setCustom(stored);
      setMode("custom");
    }
  }, []);

  useEffect(() => {
    const node = hostRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const update = () => setHostWidth(Math.round(node.getBoundingClientRect().width));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const maxHeight = Math.max(MIN_HEIGHT, Math.round(viewportH * 0.82));

  const fitted = useMemo(
    () => fitInto(vm, hostWidth || vm.width, maxHeight),
    [vm, hostWidth, maxHeight],
  );

  const filled = useMemo(() => {
    const width = Math.max(MIN_WIDTH, hostWidth || vm.width);
    return { width, height: maxHeight };
  }, [hostWidth, maxHeight, vm.width]);

  const view = mode === "fill" ? filled : mode === "custom" && custom ? custom : fitted;
  const scale = Math.min(view.width / vm.width, view.height / vm.height);

  function applyCustom(next: Size) {
    const width = Math.min(
      Math.max(MIN_WIDTH, Math.round(next.width)),
      Math.max(MIN_WIDTH, hostWidth || next.width),
    );
    const height = Math.min(Math.max(MIN_HEIGHT, Math.round(next.height)), maxHeight);
    const size = { width, height };
    setCustom(size);
    setMode("custom");
    persistSize(size);
  }

  function fitMachine() {
    clearStoredSize();
    setCustom(null);
    setMode("fit");
  }

  function fillPage() {
    clearStoredSize();
    setMode("fill");
  }

  const onPointerMove = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      if (drag.kind === "height") {
        applyCustom({ width: drag.start.width, height: drag.start.height + deltaY });
      } else {
        applyCustom({
          width: drag.start.width + deltaX,
          height: drag.start.height + deltaY,
        });
      }
    },
    [hostWidth, maxHeight],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
  }, [onPointerMove]);

  function startDrag(kind: DragKind, event: ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    dragRef.current = {
      kind,
      startX: event.clientX,
      startY: event.clientY,
      start: view,
    };
    setDragging(true);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
  }

  useEffect(() => () => endDrag(), [endDrag]);

  function onResizeKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    const step = event.shiftKey ? 48 : 16;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      applyCustom({ width: view.width, height: view.height - step });
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      applyCustom({ width: view.width, height: view.height + step });
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      applyCustom({ width: view.width - step, height: view.height });
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      applyCustom({ width: view.width + step, height: view.height });
    } else if (event.key === "Home") {
      event.preventDefault();
      fitMachine();
    }
  }

  function openTab() {
    if (!machine.previewUrl) return;
    window.open(machine.previewUrl, "_blank", "noopener,noreferrer");
  }

  const sizeKnown = Boolean(machine.displayWidth || shotSize);
  const viewingEntire =
    Math.abs(view.width / view.height - vm.width / vm.height) < 0.04;

  return (
    <GlassCard className="overflow-visible p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-card font-semibold tracking-tight">Computer Use</h2>
            {running ? (
              <Badge tone="green">Live desktop</Badge>
            ) : (
              <Badge tone="neutral">Idle</Badge>
            )}
            <Badge tone="blue">{formatDisplaySize(vm.width, vm.height)}</Badge>
          </div>
          <p className="mt-1 text-caption text-muted">
            Direct view of the Social Machine. Drag the handle to resize. Fit Machine
            matches the VM display so you see the entire desktop.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {running ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`size-3.5 ${refreshing ? "motion-safe:animate-spin" : ""}`} />
                {refreshing ? "Refreshing…" : "Reload desktop"}
              </Button>
              <Button
                size="sm"
                variant={mode === "fit" ? "secondary" : "ghost"}
                onClick={fitMachine}
                disabled={!src}
                aria-pressed={mode === "fit"}
              >
                <Scaling className="size-3.5" />
                Fit machine
              </Button>
              <Button
                size="sm"
                variant={mode === "fill" ? "secondary" : "ghost"}
                onClick={fillPage}
                disabled={!src}
                aria-pressed={mode === "fill"}
              >
                <Maximize2 className="size-3.5" />
                Fill page
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setImmersive(true)}
                disabled={!src}
              >
                <Expand className="size-3.5" />
                Full desktop
              </Button>
              <Button size="sm" variant="ghost" onClick={openTab} disabled={!src}>
                <ExternalLink className="size-3.5" />
                New tab
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <div ref={hostRef} className="mt-4">
        {running && src ? (
          <div className="hidden md:block">
            <div
              ref={frameRef}
              className="vm-bezel mx-auto"
              style={{ width: view.width, height: view.height, maxWidth: "100%" }}
            >
              {immersive ? (
                <div className="grid size-full place-items-center px-6 text-center text-caption text-muted">
                  Full desktop is open. Exit to return to this view.
                </div>
              ) : (
                <DesktopFrame src={src} title="Social Machine desktop" />
              )}
              {dragging ? <div className="vm-drag-mask" /> : null}
            </div>
            <div className="vm-resize-row mx-auto" style={{ width: view.width, maxWidth: "100%" }}>
              <button
                type="button"
                className="vm-resize-bar"
                role="slider"
                aria-label="Resize Social Machine height"
                aria-orientation="vertical"
                aria-valuemin={MIN_HEIGHT}
                aria-valuemax={maxHeight}
                aria-valuenow={view.height}
                aria-valuetext={`${view.width} by ${view.height} pixels`}
                onPointerDown={(event) => startDrag("height", event)}
                onKeyDown={onResizeKey}
              >
                <span className="vm-resize-grip" />
                <span className="sr-only">Drag to resize the desktop</span>
              </button>
              <button
                type="button"
                className="vm-resize-corner"
                aria-label="Resize Social Machine width and height"
                onPointerDown={(event) => startDrag("both", event)}
                onKeyDown={onResizeKey}
              >
                <span aria-hidden="true" className="vm-resize-corner-mark" />
              </button>
            </div>
            <p className="mt-2 text-center text-caption text-muted">
              Viewing {formatDisplaySize(view.width, view.height)}
              {sizeKnown ? ` of a ${formatDisplaySize(vm.width, vm.height)} desktop` : ""}
              {viewingEntire ? " · entire machine visible" : " · scaled to fit"}
              {scale < 0.99 ? ` · ${Math.round(scale * 100)}%` : " · 1:1"}
            </p>
          </div>
        ) : running ? (
          <p className="hidden text-caption text-muted md:block">
            The desktop URL is being minted. Reload desktop if this stays blank.
          </p>
        ) : null}

        <div className="md:hidden">
          {machine.lastScreenshot ? (
            <img
              src={machine.lastScreenshot}
              alt="Last Social Machine screenshot"
              className="w-full rounded-control border border-border"
            />
          ) : (
            <p className="text-caption text-muted">
              {running
                ? "Open full desktop to use the machine on this phone, or rotate to a wider screen."
                : "Start the machine to capture a desktop screenshot."}
            </p>
          )}
          {running && src ? (
            <Button className="mt-3 w-full" onClick={() => setImmersive(true)}>
              <Expand className="size-4" />
              Open full desktop
            </Button>
          ) : null}
        </div>

        {!running && machine.lastScreenshot ? (
          <img
            src={machine.lastScreenshot}
            alt="Last Social Machine screenshot"
            className="mt-1 hidden w-full rounded-control border border-border md:block"
          />
        ) : null}
      </div>

      {immersive && src ? (
        <ImmersiveDesktop
          src={src}
          vm={vm}
          refreshing={refreshing}
          onClose={() => setImmersive(false)}
          onReload={onRefresh}
          onOpenTab={openTab}
        />
      ) : null}
    </GlassCard>
  );
}