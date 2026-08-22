import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Badge, statusTone } from "@/components/ui/badge";
import {
  NOTIFICATIONS_QUERY_KEY,
  SAFETY_INBOX_QUERY_KEY,
  NOTIFICATION_CATEGORY_LABELS,
  type AppNotification,
} from "@/lib/safety";
import { getSafetyInbox, listNotificationsFn, markNotificationsReadFn } from "@/lib/server/safety-fns";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

function NotificationList({
  items,
  onRead,
  onReadAll,
}: {
  items: AppNotification[];
  onRead: (id: string) => void;
  onReadAll: () => void;
}) {
  if (items.length === 0) {
    return <p className="px-3 py-6 text-body text-muted">No notifications yet.</p>;
  }
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 px-3 pb-2">
        <p className="text-caption text-muted">Ops alerts</p>
        <Button size="sm" variant="ghost" onClick={onReadAll}>
          Mark all read
        </Button>
      </div>
      <ul className="max-h-[min(24rem,70dvh)] overflow-y-auto">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={item.href ?? "/"}
              className={cn(
                "flex flex-col gap-1 rounded-control px-3 py-3 hover:bg-glass",
                !item.readAt && "bg-accent/5",
              )}
              onClick={() => {
                if (!item.readAt) onRead(item.id);
              }}
            >
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 truncate text-body font-medium">{item.title}</p>
                <Badge tone={statusTone(item.severity)}>{item.severity}</Badge>
              </div>
              <p className="text-caption text-muted">{item.body}</p>
              <p className="text-caption text-muted">
                {NOTIFICATION_CATEGORY_LABELS[item.category]} · {formatRelativeTime(item.createdAt)}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NotificationBell() {
  const queryClient = useQueryClient();
  const inbox = useQuery({
    queryKey: SAFETY_INBOX_QUERY_KEY,
    queryFn: () => getSafetyInbox(),
    refetchInterval: 20000,
  });
  const list = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => listNotificationsFn(),
    enabled: false,
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wide, setWide] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setWide(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const mark = useMutation({
    mutationFn: (input: { ids?: string[]; all?: boolean }) => markNotificationsReadFn({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SAFETY_INBOX_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });

  const unread = inbox.data?.unreadNotifications ?? 0;
  const items = useMemo(
    () => list.data?.items ?? inbox.data?.latest ?? [],
    [list.data?.items, inbox.data?.latest],
  );

  function openList() {
    void list.refetch();
  }

  const panel = (
    <NotificationList
      items={items}
      onRead={(id) => mark.mutate({ ids: [id] })}
      onReadAll={() => mark.mutate({ all: true })}
    />
  );

  return (
    <>
      {wide ? (
        <DropdownMenu
          onOpenChange={(open) => {
            if (open) openList();
          }}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-11" aria-label="Notifications">
              <Bell className="size-5" />
              {unread > 0 ? (
                <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-bg">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)] p-2">
            {panel}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="relative size-11"
            aria-label="Notifications"
            onClick={() => {
              setMobileOpen(true);
              openList();
            }}
          >
            <Bell className="size-5" />
            {unread > 0 ? (
              <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-bg">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Button>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="bottom" className="pt-8">
              <SheetTitle>Notifications</SheetTitle>
              <SheetDescription className="sr-only">Ops alerts for this workspace</SheetDescription>
              <div className="mt-4">{panel}</div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </>
  );
}
