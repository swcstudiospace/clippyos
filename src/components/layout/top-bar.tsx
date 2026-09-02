import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountMenu } from "@/components/layout/account-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileBrand } from "@/components/layout/sidebar";
import { ScrollProgress } from "@/components/magicui/scroll-progress";
import { NotificationBell } from "@/components/safety/notification-bell";
import { DesktopInstallButton } from "@/components/desktop-install";

export function TopBar({ onOpenNav }: { onOpenNav: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-border bg-bg/70 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="size-11 md:hidden"
        onClick={onOpenNav}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>
      <MobileBrand />
      <div className="ml-auto flex items-center gap-1">
        <DesktopInstallButton />
        <NotificationBell />
        <ThemeToggle />
        <AccountMenu />
      </div>
      <ScrollProgress />
    </header>
  );
}