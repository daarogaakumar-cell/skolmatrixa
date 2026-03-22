"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BellOff,
  CheckCheck,
  Loader2,
  Megaphone,
  AlertCircle,
  BookOpen,
  Calendar,
  Wallet,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/actions/notifications";

interface NotificationsClientProps {
  userRole: string;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ANNOUNCEMENT: Megaphone,
  ATTENDANCE_ALERT: AlertCircle,
  HOMEWORK: BookOpen,
  EXAM_SCHEDULE: Calendar,
  FEE_REMINDER: Wallet,
  GENERAL: Info,
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  NORMAL: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  HIGH: "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400",
  URGENT: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
};

export function NotificationsClient({ userRole }: NotificationsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isAdmin = ["TENANT_ADMIN", "VICE_ADMIN"].includes(userRole);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifications, setNotifications] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    loadNotifications();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page]);

  async function loadNotifications() {
    setLoading(true);
    try {
      const result = await getNotifications({
        page,
        pageSize: 20,
        unreadOnly: tab === "unread",
      });
      if (result.success && result.data) {
        setNotifications(result.data as Record<string, any>[]); // eslint-disable-line @typescript-eslint/no-explicit-any
        if (result.pagination) setPagination(result.pagination);
      }
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  function handleMarkRead(notificationId: string) {
    startTransition(async () => {
      await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result.success) {
        toast.success("All notifications marked as read");
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteNotification(id);
      if (result.success) {
        toast.success("Notification deleted");
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      } else {
        toast.error(result.error || "Failed to delete");
      }
    });
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={isPending} className="gap-1.5">
              <CheckCheck className="h-3.5 w-3.5" />
              Mark All Read
            </Button>
          )}
          {isAdmin && (
            <Button size="sm" onClick={() => router.push("/dashboard/notifications/new")} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Create
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 bg-primary/10 text-primary text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <BellOff className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">No notifications</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {tab === "unread" ? "You've read all your notifications." : "No notifications yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const Icon = TYPE_ICONS[notification.type] || Info;
                return (
                  <Card
                    key={notification.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-sm",
                      !notification.isRead && "border-l-4 border-l-primary bg-primary/2"
                    )}
                    onClick={() => handleMarkRead(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          notification.priority === "URGENT"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : notification.priority === "HIGH"
                              ? "bg-amber-100 dark:bg-amber-900/30"
                              : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "h-4 w-4",
                            notification.priority === "URGENT"
                              ? "text-red-600 dark:text-red-400"
                              : notification.priority === "HIGH"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className={cn("text-sm", !notification.isRead ? "font-semibold" : "font-medium")}>
                                  {notification.title}
                                </h3>
                                {notification.priority !== "NORMAL" && notification.priority !== "LOW" && (
                                  <Badge variant="secondary" className={cn("text-[10px] h-4 px-1.5", PRIORITY_COLORS[notification.priority])}>
                                    {notification.priority}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</span>
                                {notification.creator && <span>by {notification.creator.name}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!notification.isRead && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(notification.id); }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
