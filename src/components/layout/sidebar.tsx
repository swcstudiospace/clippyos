import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { APP_NAME } from "@/lib/constants";
import { NAV_ITEMS } from "@/lib/nav";
import { BILLING_QUERY_KEY } from "@/lib/billing";
import { getBillingSnapshot } from "@/lib/server/billing-fns";
import { SAFETY_INBOX_QUERY_KEY } from "@/lib/safety";
import { getSafetyInbox } from "@/lib/server/safety-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BrandLockup, ClippyMark } from "@/components/brand/clippy-mark";

export function BrandMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex h-14 items-center gap-3 px-4",
        collapsed && "justify-center px-0",
      )}
    >
      <BrandLockup collapsed={collapsed} />
    </div>
  );
}

export function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hovered, setHovered] = useState<string | null>(null);
  const billing = useQuery({
    queryKey: BILLING_QUERY_KEY,
    queryFn: () => getBillingSnapshot(),
  });
  const inbox = useQuery({
    queryKey: SAFETY_INBOX_QUERY_KEY,
    queryFn: () => getSafetyInbox(),
    refetchInterval: 20000,
  });
  const gated = Boolean(billing.data?.enforced && !billing.data.entitled);
  const items = gated
    ? billing.data?.role === "owner"
      ? NAV_ITEMS.filter((item) => item.to === "/billing" || item.to === "/settings")
      : []
    : NAV_ITEMS;

  return (
    <LayoutGroup>
      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            item.to === "/"
              ? pathname === "/"
              : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const link = (
            <Link
              to={item.to}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              onClick={onNavigate}
              onMouseEnter={() => setHovered(item.to)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "sidebar-item group/sidebar relative",
                collapsed && "justify-center px-0",
                active && "sidebar-item-active",
              )}
            >
              {hovered === item.to ? (
                <motion.span
                  layoutId="hovered-sidebar-link"
                  className="absolute inset-0 z-0 rounded-control bg-secondary-surface"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              <Icon className="relative z-10 size-5 shrink-0" aria-hidden="true" />
              <span
                className={cn(
                  "relative z-10 overflow-hidden whitespace-nowrap transition-[opacity,max-width,transform] duration-(--motion-fast) ease-[var(--ease-out)] group-hover/sidebar:translate-x-1",
                  collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100",
                )}
              >
                {item.label}
              </span>
              {item.to === "/approvals" && (inbox.data?.pendingApprovals ?? 0) > 0 && !collapsed ? (
                <span className="relative z-10 ml-auto rounded-full bg-warning/20 px-2 py-0.5 text-caption font-medium text-warning">
                  {inbox.data?.pendingApprovals}
                </span>
              ) : null}
            </Link>
          );

          if (!collapsed) return <div key={item.to}>{link}</div>;

          return (
            <Tooltip key={item.to}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </LayoutGroup>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-bg/80 backdrop-blur-xl md:flex md:flex-col",
        "transition-[width] duration-(--motion-fast) ease-[var(--ease-out)] motion-reduce:transition-none",
        collapsed ? "w-sidebar-collapsed" : "w-sidebar",
      )}
    >
      <BrandMark collapsed={collapsed} />
      <SidebarNav collapsed={collapsed} />
      <div className={cn("p-3", collapsed && "flex justify-center")}>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className={cn("w-full", collapsed && "w-11")}
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="size-4" />
          ) : (
            <>
              <ChevronsLeft className="size-4" />
              Collapse
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}

export function MobileBrand() {
  return (
    <div className="flex items-center gap-2 md:hidden">
      <ClippyMark size={32} />
      <span className="text-body font-semibold tracking-tight">{APP_NAME}</span>
    </div>
  );
}
