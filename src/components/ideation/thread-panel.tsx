import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  MoreHorizontal,
  PanelRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import type { ThreadListItem } from "@/lib/server/ideation";
import type { ClientListItem } from "@/lib/server/clients";
import { formatRelativeTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
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

export function ThreadList({
  threads,
  selectedId,
  onSelect,
  onNew,
  onRename,
  onTag,
  onArchive,
  onDelete,
}: {
  threads: ThreadListItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (thread: ThreadListItem) => void;
  onTag: (thread: ThreadListItem) => void;
  onArchive: (thread: ThreadListItem) => void;
  onDelete: (thread: ThreadListItem) => void;
}) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(search.trim().toLowerCase()), 250);
    return () => window.clearTimeout(handle);
  }, [search]);

  const rows = useMemo(() => {
    if (!debounced) return threads;
    return threads.filter((thread) => {
      const hay = `${thread.title} ${thread.clientName ?? ""}`.toLowerCase();
      return hay.includes(debounced);
    });
  }, [threads, debounced]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
        <h2 className="text-card font-semibold tracking-tight">Threads</h2>
        <Button variant="ghost" size="icon" className="size-11" onClick={onNew} aria-label="New thread">
          <Plus className="size-5" />
        </Button>
      </div>
      <div className="px-3 pb-3">
        <label className="sr-only" htmlFor="thread-search">
          Search threads
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <Input
            id="thread-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="pl-9"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {rows.length === 0 ? (
          <p className="px-3 py-8 text-center text-body text-muted">
            {threads.length === 0 ? "No conversations yet" : "No matching conversations"}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {rows.map((thread) => {
              const active = thread.id === selectedId;
              return (
                <li key={thread.id}>
                  <div
                    className={cn(
                      "group flex items-start gap-1 rounded-control px-1",
                      active && "bg-glass shadow-[inset_0_0_0_0.5px_var(--border)]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(thread.id)}
                      className="min-h-11 min-w-0 flex-1 rounded-control px-2 py-2 text-left"
                    >
                      <p className="truncate text-body font-medium">{thread.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-caption text-muted">
                        {thread.clientName ? (
                          <Badge tone="blue" className="font-normal">
                            {thread.clientName}
                          </Badge>
                        ) : null}
                        <span>{formatRelativeTime(thread.updatedAt)}</span>
                      </p>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mt-1 size-11 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                          aria-label={`Actions for ${thread.title}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onRename(thread)}>
                          <Pencil className="size-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onTag(thread)}>
                          <UserRound className="size-4" />
                          Tag to client
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => onArchive(thread)}>
                          <Archive className="size-4" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onDelete(thread)}>
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
        )}
      </div>
    </div>
  );
}

export function ThreadPanel({
  collapsed,
  onToggle,
  className,
  ...listProps
}: {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
} & Omit<Parameters<typeof ThreadList>[0], never>) {
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
          <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Expand threads">
            <PanelRight className="size-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={listProps.onNew} aria-label="New thread">
            <Plus className="size-5" />
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-end px-2 pt-2">
            <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Collapse threads">
              <PanelRight className="size-5" />
            </Button>
          </div>
          <ThreadList {...listProps} />
        </>
      )}
    </aside>
  );
}

export function RenameThreadDialog({
  thread,
  onClose,
  onSave,
  busy,
}: {
  thread: ThreadListItem | null;
  onClose: () => void;
  onSave: (title: string) => void;
  busy: boolean;
}) {
  const [title, setTitle] = useState(thread?.title ?? "");
  useEffect(() => {
    setTitle(thread?.title ?? "");
  }, [thread]);
  return (
    <Dialog open={Boolean(thread)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Rename thread</DialogTitle>
        <DialogDescription>Shown in the thread list.</DialogDescription>
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (title.trim()) onSave(title.trim());
          }}
        >
          <Label htmlFor="thread-title">Title</Label>
          <Input
            id="thread-title"
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

export function TagClientDialog({
  thread,
  clients,
  onClose,
  onSave,
  busy,
}: {
  thread: ThreadListItem | null;
  clients: ClientListItem[];
  onClose: () => void;
  onSave: (clientId: string | null) => void;
  busy: boolean;
}) {
  const [query, setQuery] = useState("");
  const active = clients.filter((client) => client.status === "ACTIVE" && !client.deletedAt);
  const filtered = active.filter((client) =>
    `${client.name} ${client.channelUrl ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <Dialog
      open={Boolean(thread)}
      onOpenChange={(open) => {
        if (!open) {
          setQuery("");
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogTitle>Tag to client</DialogTitle>
        <DialogDescription>
          Optional. A short client summary is added to this thread’s context.
        </DialogDescription>
        <Input
          className="mt-4"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search clients"
          aria-label="Search clients"
        />
        <ul className="mt-3 max-h-64 overflow-y-auto">
          <li>
            <button
              type="button"
              className="flex min-h-11 w-full items-center rounded-control px-3 text-left text-body hover:bg-glass"
              onClick={() => onSave(null)}
              disabled={busy}
            >
              No client
            </button>
          </li>
          {filtered.map((client) => (
            <li key={client.id}>
              <button
                type="button"
                className="flex min-h-11 w-full items-center rounded-control px-3 text-left text-body hover:bg-glass"
                onClick={() => onSave(client.id)}
                disabled={busy}
              >
                {client.name}
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteThreadDialog({
  thread,
  onClose,
  onConfirm,
  busy,
}: {
  thread: ThreadListItem | null;
  onClose: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  return (
    <Dialog open={Boolean(thread)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogTitle>Delete conversation?</DialogTitle>
        <DialogDescription>
          {thread ? `“${thread.title}” and its messages will be removed.` : ""}
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
