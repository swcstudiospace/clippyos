import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="relative inline-flex size-5 items-center justify-center">
        <Sun
          className={`absolute size-5 transition-[opacity,transform,filter] duration-(--motion-fast) ease-[var(--ease-out)] ${
            isDark
              ? "scale-[0.25] opacity-0 blur-sm"
              : "scale-100 opacity-100 blur-none"
          }`}
        />
        <Moon
          className={`absolute size-5 transition-[opacity,transform,filter] duration-(--motion-fast) ease-[var(--ease-out)] ${
            isDark
              ? "scale-100 opacity-100 blur-none"
              : "scale-[0.25] opacity-0 blur-sm"
          }`}
        />
      </span>
    </Button>
  );
}
