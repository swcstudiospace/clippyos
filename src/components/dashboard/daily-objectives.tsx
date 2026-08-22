import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import type { GuaranteeItem, GuaranteeStatus } from "@/lib/dashboard";
import {
  GUARANTEE_WINDOW_DAYS,
  OBJECTIVES_DISMISS_KEY,
  OBJECTIVES_TODOS_KEY,
} from "@/lib/constants";
import { todayIsoDate } from "@/lib/format";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ShineBorder } from "@/components/magicui/shine-border";
import { cn } from "@/lib/utils";

type Todo = { id: string; text: string };

type DismissStore = { date: string; ids: string[] };

const STATUS_LABEL: Record<GuaranteeStatus, string> = {
  on_track: "On track",
  approaching: "Approaching",
  past_deadline: "Past deadline",
};

function readDismissed(today: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OBJECTIVES_DISMISS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DismissStore;
    if (parsed.date !== today || !Array.isArray(parsed.ids)) return [];
    return parsed.ids.filter((id) => typeof id === "string");
  } catch {
    return [];
  }
}

function writeDismissed(today: string, ids: string[]) {
  window.localStorage.setItem(
    OBJECTIVES_DISMISS_KEY,
    JSON.stringify({ date: today, ids }),
  );
}

function readTodos(): Todo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(OBJECTIVES_TODOS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Todo[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) => item && typeof item.id === "string" && typeof item.text === "string",
    );
  } catch {
    return [];
  }
}

export function DailyObjectives({
  items,
  missingStartDates,
  loading,
}: {
  items: GuaranteeItem[];
  missingStartDates: number;
  loading: boolean;
}) {
  const today = todayIsoDate();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setDismissed(readDismissed(today));
    setTodos(readTodos());
  }, [today]);

  const visible = useMemo(
    () => items.filter((item) => !dismissed.includes(item.id)),
    [items, dismissed],
  );

  function dismiss(id: string) {
    const next = [...new Set([...dismissed, id])];
    setDismissed(next);
    writeDismissed(today, next);
  }

  function addTodo(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const next = [...todos, { id: crypto.randomUUID(), text: text.slice(0, 200) }];
    setTodos(next);
    window.localStorage.setItem(OBJECTIVES_TODOS_KEY, JSON.stringify(next));
    setDraft("");
  }

  function removeTodo(id: string) {
    const next = todos.filter((item) => item.id !== id);
    setTodos(next);
    window.localStorage.setItem(OBJECTIVES_TODOS_KEY, JSON.stringify(next));
  }

  return (
    <GlassCard className="relative overflow-hidden">
      <ShineBorder />
      <div className="relative z-[1]">
        <h2 className="text-card font-semibold tracking-tight">
          30-day guarantee tracker
        </h2>
        <p className="mt-1 max-w-2xl text-caption text-muted">
          We guarantee a full refund if a client doesn’t see a views increase in
          their first {GUARANTEE_WINDOW_DAYS} days. Day 1 is the client start date
          (inclusive). Views signals only appear when two or more snapshots exist
          on or after the start date — never invented. Acknowledge today and the
          derived items return tomorrow.
        </p>

        {loading ? (
          <div className="mt-4 flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {visible.length === 0 && items.length === 0 ? (
              <li className="rounded-control bg-secondary-surface/50 px-3 py-3 text-body text-muted">
                {missingStartDates > 0
                  ? `Add start dates on ${missingStartDates} active client${missingStartDates === 1 ? "" : "s"} to track the 30-day guarantee.`
                  : "No 30-day windows to track yet. They appear automatically when an active client has a start date."}
              </li>
            ) : null}
            {visible.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex flex-col gap-2 rounded-control px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
                  item.tone === "red" && "bg-danger/12",
                  item.tone === "orange" && "bg-warning/12",
                  item.tone === "green" && "bg-success/12",
                  item.tone === "neutral" && "bg-secondary-surface/50",
                )}
              >
                <div className="min-w-0">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-caption text-muted">
                    Inclusive day count · {GUARANTEE_WINDOW_DAYS}-day views guarantee
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    tone={
                      item.status === "past_deadline"
                        ? "red"
                        : item.status === "approaching"
                          ? "orange"
                          : "green"
                    }
                  >
                    {STATUS_LABEL[item.status]}
                  </Badge>
                  <Badge
                    tone={
                      item.viewsSignal === "up"
                        ? "green"
                        : item.viewsSignal === "flat"
                          ? "orange"
                          : "neutral"
                    }
                  >
                    {item.viewsLabel}
                  </Badge>
                  <Button asChild size="sm" variant="secondary">
                    <Link
                      to="/clients/$clientId"
                      params={{ clientId: item.clientId }}
                    >
                      Open
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismiss(item.id)}
                  >
                    Acknowledge today
                  </Button>
                </div>
              </li>
            ))}
            {todos.map((todo) => (
              <li
                key={todo.id}
                className="flex items-center justify-between gap-2 rounded-control bg-secondary-surface/40 px-3 py-3"
              >
                <p className="min-w-0 flex-1 text-body">{todo.text}</p>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remove ${todo.text}`}
                  onClick={() => removeTodo(todo.id)}
                >
                  <X className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={addTodo} className="mt-4 flex gap-2">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a personal to-do…"
            aria-label="Add a personal to-do"
            maxLength={200}
          />
          <Button type="submit" variant="secondary" aria-label="Add to-do">
            <Plus className="size-4" />
            Add
          </Button>
        </form>
      </div>
    </GlassCard>
  );
}
