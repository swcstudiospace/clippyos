import { Link } from "@tanstack/react-router";
import {
  Bot,
  CalendarDays,
  Lightbulb,
  PlugZap,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QuickActions({
  onAddClient,
  onRefreshAnalytics,
  refreshing,
  youtubeReady,
  highlightIntegrations,
}: {
  onAddClient: () => void;
  onRefreshAnalytics: () => void;
  refreshing: boolean;
  youtubeReady: boolean;
  highlightIntegrations: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Quick actions">
      <Button size="sm" variant="secondary" className="shrink-0" onClick={onAddClient}>
        <Plus className="size-4" aria-hidden="true" />
        Add Client
      </Button>
      <Button size="sm" variant="ghost" asChild>
        <Link to="/calendar">
          <CalendarDays className="size-4" aria-hidden="true" />
          Open Calendar
        </Link>
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onRefreshAnalytics}
        disabled={refreshing}
        title={
          youtubeReady
            ? "Pull public stats for active clients with a channel"
            : "Connect a YouTube Data API key in Settings to pull live stats"
        }
      >
        <RefreshCw
          className={cn("size-4", refreshing && "motion-safe:animate-spin")}
          aria-hidden="true"
        />
        Refresh Analytics
      </Button>
      <Button size="sm" variant="ghost" asChild>
        <Link to="/ideation">
          <Lightbulb className="size-4" aria-hidden="true" />
          Open Ideation
        </Link>
      </Button>
      <Button size="sm" variant="ghost" asChild>
        <Link to="/agent">
          <Bot className="size-4" aria-hidden="true" />
          Open Agent
        </Link>
      </Button>
      <Button size="sm" variant="ghost" asChild>
        <Link to="/social">
          <Share2 className="size-4" aria-hidden="true" />
          Open Social
        </Link>
      </Button>
      <Button size="sm" variant="ghost" asChild>
        <Link to="/approvals">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Approvals
        </Link>
      </Button>
      <Button
        size="sm"
        variant={highlightIntegrations ? "secondary" : "ghost"}
        asChild
      >
        <Link to="/settings" hash="integrations">
          <PlugZap className="size-4" aria-hidden="true" />
          Integrations
        </Link>
      </Button>
    </div>
  );
}
