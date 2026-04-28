import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useListNotifications, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { formatDateTime } from "@/lib/utils";
import { Bell, CheckCircle, Package, AlertTriangle, Search } from "lucide-react";

const typeIcons: Record<string, typeof Bell> = {
  request_accepted: CheckCircle,
  request_updated: Package,
  dispute_update: AlertTriangle,
};

type NotificationFilter = "all" | "unread" | "request" | "dispute";

export default function NotificationsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const qc = useQueryClient();
  const { data, isLoading } = useListNotifications({ query: { queryKey: getListNotificationsQueryKey() } });
  const markRead = useMarkNotificationRead();

  const notifications = (data?.notifications ?? []) as {
    id: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    requestId?: number | null;
    createdAt: string;
  }[];

  const filteredNotifications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "unread" && !notification.isRead) ||
        (filter === "request" && notification.type.startsWith("request_")) ||
        (filter === "dispute" && notification.type.startsWith("dispute_"));

      const haystack = `${notification.title} ${notification.message} ${notification.requestId ?? ""}`.toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, notifications, query]);

  async function handleRead(id: number) {
    await markRead.mutateAsync(
      { id },
      {
        onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
      },
    );
  }

  async function handleMarkAllRead() {
    const unread = notifications.filter((notification) => !notification.isRead);
    if (unread.length === 0) return;

    await Promise.all(unread.map((notification) => markRead.mutateAsync({ id: notification.id })));
    qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_24%),rgba(15,23,42,0.92)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              Notification center
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Keep the delivery conversation visible after the request is posted.</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              Notifications should help users act quickly, not bury important delivery changes in a generic feed.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              {data?.unreadCount ? `${data.unreadCount} unread` : "All caught up"}
            </div>
            <button
              onClick={handleMarkAllRead}
              disabled={markRead.isPending || !data?.unreadCount}
              className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
            >
              Mark all read
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notifications by title, request, or message"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              ["all", "All"],
              ["unread", "Unread"],
              ["request", "Request updates"],
              ["dispute", "Dispute updates"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  filter === value
                    ? "bg-cyan-400 text-slate-950"
                    : "border border-white/10 bg-slate-900/60 text-slate-300 hover:border-white/20 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-12 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-slate-700" />
          <p className="mb-1 font-medium text-white">{notifications.length === 0 ? "No notifications" : "No notifications match this view"}</p>
          <p className="text-sm text-slate-500">
            {notifications.length === 0
              ? "You are all caught up."
              : "Try a different filter or search to find the update you need."}
          </p>
        </div>
      ) : (
        <div className="rounded-[28px] border border-white/10 bg-white/5 overflow-hidden">
          {filteredNotifications.map((notification) => {
            const Icon = typeIcons[notification.type] ?? Bell;

            return (
              <div
                key={notification.id}
                data-testid={`notification-${notification.id}`}
                onClick={() => !notification.isRead && void handleRead(notification.id)}
                className={`flex cursor-pointer items-start gap-4 border-b border-white/10 px-5 py-4 transition last:border-0 ${
                  !notification.isRead ? "bg-cyan-400/6 hover:bg-cyan-400/10" : "hover:bg-white/5"
                }`}
              >
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${!notification.isRead ? "bg-cyan-400/12" : "bg-slate-900/70"}`}>
                  <Icon className={`h-4 w-4 ${!notification.isRead ? "text-cyan-300" : "text-slate-500"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={`text-sm font-medium ${!notification.isRead ? "text-white" : "text-slate-300"}`}>{notification.title}</div>
                      <p className="mt-1 text-sm leading-6 text-slate-500">{notification.message}</p>
                    </div>
                    {!notification.isRead ? <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400" /> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-slate-600">{formatDateTime(notification.createdAt)}</span>
                    {notification.requestId ? (
                      <Link
                        href={`/requests/${notification.requestId}`}
                        onClick={(event) => event.stopPropagation()}
                        className="text-cyan-300 hover:text-cyan-200"
                      >
                        View Request #{notification.requestId}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
