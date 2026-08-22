import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/lib/theme";

export function Toaster() {
  const { theme } = useTheme();
  return (
    <Sonner
      theme={theme}
      position="top-center"
      offset="max(12px, env(safe-area-inset-top))"
      toastOptions={{
        className:
          "glass-card !border-border !bg-glass !text-fg !text-body",
      }}
    />
  );
}
