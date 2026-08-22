import * as Collapsible from "@radix-ui/react-collapsible";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ChevronDown,
  MoreHorizontal,
  PanelRight,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";
import type { SessionListItem } from "@/lib/server/thumbnails";
import { formatRelativeTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ListProps = {
  sessions: SessionListItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (session: SessionListItem) => void;
  onArchive: (session: SessionListItem) => void;
  onDelete: (session: SessionListItem) => void;
};

function groupSessions(sessions: SessionListItem[]) {
  const groups: { clientId: string; clientName: string; sessions: SessionListItem[] }[] = [];
  const index = new Map<string, number>();
  for (const session of sessions) {
    const existing = index.get(session.clientId);
    if (existing == null) {
      index.set(session.clientId, groups.length);
      groups.push({
        clientId: session.clientId,
        clientName: session.clientName || "Unknown client",
        sessions: [session],
      });
    } else {
      groups[existing]!.sessions.push(session);
    }
  }
  return groups;
}

export function SessionList({
  sessions,
  selectedId,
  onSelect,
  onNew,
  onRename,
  onArchive,
  onDelete,
}: ListProps) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(search.trim().toLowerCase()), 250);
    return () => window.clearTimeout(handle);
  }, [search]);

  const rows = useMemo(() => {
    if (!debounced) return sessions;
    return sessions.filter((session) => {
      const hay = `${session.title} ${session.clientName ?? ""}`.toLowerCase();
      return hay.includes(debounced);
    });
  }, [sessions, debounced]);
  const groups = useMemo(() => groupSessions(rows), [rows]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <h2 className="text-card font-semibold tracking-tight">Sessions</h2>
        <Button variant="ghost" size="icon" className="size-11" onClick={onNew} aria-label="New session">
          <Plus className="size-5" />
        </Button>
      </div>
      <div className="px-3 pb-3">
        <label className="sr-only" htmlFor="session-search">
          Search sessions
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            id="session-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="pl-9"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {groups.length === 0 ? (
          <p className="px-3 py-8 text-center text-body text-muted">
            {sessions.length === 0 ? "No sessions yet" : "No matching sessions"}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {groups.map((group) => (
              <li key={group.clientId}>
                <Collapsible.Root defaultOpen>
                  <Collapsible.Trigger asChild>
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center justify-between gap-2 rounded-control px-2 text-left text-caption font-medium text-muted hover:text-fg"
                    >
                      <span className="min-w-0 truncate">{group.clientName}</span>
                      <ChevronDown className="size-4 shrink-0 transition-transform duration-(--motion-fast) ease-[var(--ease-out)] group-data-[state=open]:rotate-180 motion-reduce:transition-none [[data-state=open]_&]:rotate-180" />
                    </button>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <ul className="mt-1 flex flex-col gap-1">
                      {group.sessions.map((session) => {
                        const active = session.id === selectedId;
                        return (
                          <li key={session.id}>
                            <div
                              className={cn(
                                "group flex items-start gap-1 rounded-control px-1",
                                active && "bg-glass shadow-[inset_0_0_0_0.5px_var(--border)]",
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => onSelect(session.id)}
                                className="min-h-11 min-w-0 flex-1 rounded-control px-2 py-2 text-left"
                              >
                                <p className="truncate text-body font-medium">{session.title}</p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-caption text-muted">
                                  <span>{formatRelativeTime(session.updatedAt)}</span>
                                  {session.imageCount > 0 ? (
                                    <span>
                                      {session.imageCount} {session.imageCount === 1 ? "image" : "images"}
                                    </span>
                                  ) : null}
                                  {session.avgRating != null ? (
                                    <span className="inline-flex items-center gap-0.5">
                                      <Star className="size-3 fill-warning text-warning" aria-hidden="true" />
                                      {session.avgRating.toFixed(1)}
                                    </span>
                                  ) : null}
                                </p>
                              </button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mt-1 size-11 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                                    aria-label={`Actions for ${session.title}`}
                                  >
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onSelect={() => onRename(session)}>
                                    <Pencil className="size-4" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onSelect={() => onArchive(session)}>
                                    <Archive className="size-4" />
                                    Archive
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => onDelete(session)}>
                                    <Trash2 className="size-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </Collapsible.Content>
                </Collapsible.Root>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function SessionPanel({
  collapsed,
  onToggle,
  className,
  ...listProps
}: {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
} & ListProps) {
  return (
    <aside
      className={cn(
        "hidden min-h-0 flex-col border-l border-border bg-bg/90 backdrop-blur-xl md:flex",
        "transition-[width] duration-(--motion-fast) ease-[var(--ease-out)] motion-reduce:transition-none",
        collapsed ? "w-14" : "w-[300px]",
        className,
      )}
    >
      {collapsed ? (
        <div className="flex flex-col items-center gap-2 pt-3">
          <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Expand sessions">
            <PanelRight className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={listProps.onNew} aria-label="New session">
            <Plus className="size-5" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-end px-2 pt-2">
            <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Collapse sessions">
              <PanelRight className="size-5" />
            </Button>
          </div>
          <SessionList {...listProps} />
        </>
      )}
    </aside>
  );
}

export function RenameSessionDialog({
  session,
  onClose,
  onSave,
  busy,
}: {
  session: SessionListItem | null;
  onClose: () => void;
  onSave: (title: string) => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState(session?.title ?? "");
  useEffect(() => {
    setTitle(session?.title ?? "");
  }, [session]);
  return (
    <Dialog open={Boolean(session)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Rename session</DialogTitle>
        <DialogDescription>Shown in the session list.</DialogDescription>
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (title.trim()) onSave(title.trim());
          }}
        >
          <Label htmlFor="session-title">Title</Label>
          <Input
            id="session-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            autoFocus
          />
          <Button type="submit" disabled={busy || !title.trim()}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteSessionDialog({
  session,
  onClose,
  onConfirm,
  busy,
}: {
  session: SessionListItem | null;
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <Dialog open={Boolean(session)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Delete session?</DialogTitle>
        <DialogDescription>
          {session ? `“${session.title}” and its images will be removed.` : ""}
        </DialogDescription>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={busy}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
