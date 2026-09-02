import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Download, MonitorSmartphone } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import {
  canOfferNativeInstall,
  captureBeforeInstallPrompt,
  currentInstallRuntime,
  DESKTOP_INSTALLED_LABEL,
  installSurface,
  isSafariBrowser,
  spentBeforeInstallPrompt,
  type BeforeInstallPromptEvent,
} from "@/lib/desktop-install";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassCard } from "@/components/ui/glass-card";

type InstallContextValue = {
  surface: ReturnType<typeof installSurface>;
  isOnline: boolean;
  nativeUrl: string;
  canNative: boolean;
  canPromptPwa: boolean;
  safari: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  downloadNative: () => void;
  installPwa: () => Promise<void>;
};

const InstallContext = createContext<InstallContextValue | null>(null);

export function DesktopInstallProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [runtime, setRuntime] = useState(() => ({
    isTauri: false,
    isMacOS: false,
    isOnline: true,
    nativeUrl: "",
    ua: "",
  }));

  useEffect(() => {
    const next = currentInstallRuntime();
    setRuntime(next);
    setIsOnline(next.isOnline);
    if (next.isTauri) return;
    function onPrompt(event: Event) {
      setDeferred(captureBeforeInstallPrompt(event as BeforeInstallPromptEvent));
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    function sync() {
      setIsOnline(navigator.onLine);
    }
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const surface = installSurface(runtime);
  const safari = isSafariBrowser(runtime.ua);
  const nativeUrl = runtime.nativeUrl;
  const canNative = canOfferNativeInstall({
    isTauri: runtime.isTauri,
    isMacOS: runtime.isMacOS,
    isOnline,
    nativeUrl,
  });

  const downloadNative = useCallback(() => {
    if (!canNative) return;
    window.location.assign(nativeUrl);
  }, [canNative, nativeUrl]);

  const installPwa = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } finally {
      setDeferred(spentBeforeInstallPrompt());
    }
  }, [deferred]);

  const value = useMemo<InstallContextValue>(
    () => ({
      surface,
      isOnline,
      nativeUrl,
      canNative,
      canPromptPwa: Boolean(deferred),
      safari,
      open,
      setOpen,
      downloadNative,
      installPwa,
    }),
    [surface, isOnline, nativeUrl, canNative, deferred, safari, open, downloadNative, installPwa],
  );

  return (
    <InstallContext.Provider value={value}>
      {children}
      <DesktopInstallDialog />
    </InstallContext.Provider>
  );
}

export function DesktopInstallButton() {
  const ctx = useContext(InstallContext);
  if (!ctx) return null;
  if (ctx.surface === "tauri") {
    return (
      <Badge tone="green" className="hidden sm:inline-flex">
        {DESKTOP_INSTALLED_LABEL}
      </Badge>
    );
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      className="hidden min-h-11 sm:inline-flex"
      onClick={() => ctx.setOpen(true)}
    >
      <Download className="size-4" aria-hidden="true" />
      Install
    </Button>
  );
}

export function DesktopInstallPanel() {
  const ctx = useContext(InstallContext);
  if (!ctx) return null;
  if (ctx.surface === "tauri") {
    return (
      <GlassCard>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <MonitorSmartphone className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-card font-semibold tracking-tight">Desktop app</h2>
            <p className="text-caption text-muted">{DESKTOP_INSTALLED_LABEL}</p>
          </div>
          <Badge tone="green" className="ml-auto">
            Installed
          </Badge>
        </div>
      </GlassCard>
    );
  }
  return (
    <GlassCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 place-items-center rounded-control bg-secondary-surface">
            <MonitorSmartphone className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-card font-semibold tracking-tight">Desktop app</h2>
            <p className="mt-1 text-caption text-muted">
              {ctx.surface === "macos-browser"
                ? `Install the native ${APP_NAME} app for macOS, or keep the browser web app as a fallback.`
                : `Install ${APP_NAME} as a web app in this browser.`}
            </p>
          </div>
        </div>
        <Button onClick={() => ctx.setOpen(true)} className="min-h-11 w-fit">
          <Download className="size-4" aria-hidden="true" />
          Install
        </Button>
      </div>
    </GlassCard>
  );
}

function DesktopInstallDialog() {
  const ctx = useContext(InstallContext);
  if (!ctx || ctx.surface === "tauri") return null;

  const macos = ctx.surface === "macos-browser";
  const nativeBlockedReason = !ctx.isOnline
    ? "Installer requires an internet connection. Cached web-app features still work."
    : !ctx.nativeUrl
      ? `Native macOS installer is not published yet. Use the web app until a signed .dmg URL is set in VITE_DESKTOP_DMG_URL.`
      : null;

  return (
    <Dialog open={ctx.open} onOpenChange={ctx.setOpen}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Install {APP_NAME}</DialogTitle>
        <DialogDescription>
          {macos
            ? `The native desktop app is the recommended install on a Mac. The browser web app is available as a fallback.`
            : `Add ${APP_NAME} to this device as a standalone web app.`}
        </DialogDescription>

        {macos ? (
          <div className="mt-4 flex flex-col gap-3">
            <Button
              onClick={ctx.downloadNative}
              disabled={!ctx.canNative}
              className="min-h-11"
            >
              Download {APP_NAME} for macOS
            </Button>
            {nativeBlockedReason ? (
              <p className="text-caption text-muted">{nativeBlockedReason}</p>
            ) : (
              <ol className="list-decimal space-y-1 pl-5 text-caption text-muted">
                <li>Open the downloaded .dmg.</li>
                <li>Drag {APP_NAME} into the Applications folder.</li>
                <li>
                  If macOS Gatekeeper blocks it, right-click the app and choose Open, then confirm.
                </li>
              </ol>
            )}
            <PwaFallback ctx={ctx} />
          </div>
        ) : (
          <div className="mt-4">
            <PwaFallback ctx={ctx} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PwaFallback({ ctx }: { ctx: InstallContextValue }) {
  if (ctx.canPromptPwa) {
    return (
      <Button variant="secondary" className="min-h-11" onClick={() => void ctx.installPwa()}>
        Install web version
      </Button>
    );
  }
  if (ctx.safari) {
    return (
      <p className="text-caption text-muted">
        Safari does not expose a programmatic install prompt. Use File → Add to Dock, or Share → Add
        to Dock, to keep the web app.
      </p>
    );
  }
  return (
    <p className="text-caption text-muted">
      This browser is not offering a web-app install prompt. Use the browser menu to install{" "}
      {APP_NAME}, or download the desktop app on a Mac.
    </p>
  );
}
