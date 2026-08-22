import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ClientListItem } from "@/lib/server/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function ClientSelector({
  clients,
  value,
  onChange,
  disabled,
}: {
  clients: ClientListItem[];
  value: string | null;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const active = useMemo(
    () => clients.filter((client) => client.status === "ACTIVE" && !client.deletedAt),
    [clients],
  );
  const selected = active.find((client) => client.id === value) ?? null;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return active;
    return active.filter((client) =>
      `${client.name} ${client.channelUrl ?? ""}`.toLowerCase().includes(needle),
    );
  }, [active, query]);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <Popover.Trigger asChild>
        <Button
          variant="secondary"
          className="max-w-[16rem] rounded-full px-3"
          disabled={disabled}
          aria-label={selected ? `Client: ${selected.name}` : "Select client"}
        >
          <span className="min-w-0 truncate">
            {selected ? selected.name : active.length === 0 ? "Add a client first" : "Select client"}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted" />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="glass-card z-50 w-72 overflow-hidden p-2"
        >
          <p className="px-2 pt-1 pb-2 text-caption text-muted">Required — every session is tagged.</p>
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search clients"
              aria-label="Search clients"
              className="pl-9"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-caption text-muted">
                {active.length === 0 ? "No active clients yet" : "No matches"}
              </li>
            ) : (
              filtered.map((client) => {
                const on = client.id === value;
                return (
                  <li key={client.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={on}
                      className={cn(
                        "flex min-h-11 w-full items-center justify-between gap-2 rounded-control px-3 text-left text-body hover:bg-glass",
                        on && "bg-glass",
                      )}
                      onClick={() => {
                        onChange(client.id);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="min-w-0 truncate">{client.name}</span>
                      {on ? <Check className="size-4 shrink-0 text-accent" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
