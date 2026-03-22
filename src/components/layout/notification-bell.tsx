"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, CheckCheck, ExternalLink, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useNotificationStore } from "@/stores/notification-store";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/actions/notifications";

export function NotificationBell() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { unreadCount, startPolling, fetchUnreadCount } = useNotificationStore();
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifications, setNotifications] = useState<Record<string, any>[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Start polling on mount
  useEffect(() => {
    const stop = startPolling();
    return stop;
  }, [startPolling]);

  // Load recent notifications when popover opens
  useEffect(() => {
    if (open) {
      loadRecent();
    }
  }, [open]);

  async function loadRecent() {
    setLoadingList(true);
    try {
      const result = await getNotifications({ page: 1, pageSize: 5 });
      if (result.success && result.data) {
        setNotifications(result.data as Record<string, any>[]); // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    } catch {
      // ignore
    } finally {
      setLoadingList(false);
    }
  }

  function handleMarkRead(notificationId: string) {
    startTransition(async () => {
      await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      fetchUnreadCount();
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      fetchUnreadCount();
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}>
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-muted-foreground"
                onClick={handleMarkAllRead}
                disabled={isPending}
              >
                <CheckCheck className="h-3 w-3" />
                Read all
              </Button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loadingList ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <BellOff className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                className={cn(
                  "w-full text-left px-4 py-3 border-b last:border-b-0 transition-colors hover:bg-muted/50",
                  !n.isRead && "bg-primary/3"
                )}
                onClick={() => handleMarkRead(n.id)}
              >
                <div className="flex gap-2.5">
                  {!n.isRead && (
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                  <div className={cn("min-w-0 flex-1", n.isRead && "pl-4")}>
                    <p className={cn("text-sm line-clamp-1", !n.isRead ? "font-semibold" : "font-medium")}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs gap-1.5"
            onClick={() => { setOpen(false); router.push("/dashboard/notifications"); }}
          >
            <ExternalLink className="h-3 w-3" />
            View All Notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
