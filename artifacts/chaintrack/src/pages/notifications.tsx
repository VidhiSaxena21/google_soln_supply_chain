import { Link } from "wouter";
import { useListNotifications, useMarkNotificationRead, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateTime } from "@/lib/utils";
import { Bell, Package, CheckCircle, AlertTriangle } from "lucide-react";

const typeIcons: Record<string, typeof Bell> = {
  request_accepted: CheckCircle,
  request_updated: Package,
  dispute_update: AlertTriangle,
};

export default function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useListNotifications({ query: { queryKey: getListNotificationsQueryKey() } });
  const markRead = useMarkNotificationRead();

  const notifications = (data?.notifications ?? []) as {
    id: number; type: string; title: string; message: string; isRead: boolean;
    requestId?: number | null; createdAt: string;
  }[];

  function handleRead(id: number) {
    markRead.mutate({ id }, {
      onSuccess: () => qc.invalidateQueries({ queryKey: getListNotificationsQueryKey() }),
    });
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-white font-bold text-2xl">Notifications</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {data?.unreadCount ? `${data.unreadCount} unread` : "All caught up"}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Bell className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No notifications</p>
          <p className="text-slate-500 text-sm">You're all caught up!</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {notifications.map((n, i) => {
            const Icon = typeIcons[n.type] ?? Bell;
            return (
              <div
                key={n.id}
                data-testid={`notification-${n.id}`}
                onClick={() => !n.isRead && handleRead(n.id)}
                className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors border-b border-slate-800 last:border-0 ${!n.isRead ? "bg-indigo-950/20 hover:bg-indigo-950/30" : "hover:bg-slate-800/30"}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${!n.isRead ? "bg-indigo-600/20" : "bg-slate-800"}`}>
                  <Icon className={`w-4 h-4 ${!n.isRead ? "text-indigo-400" : "text-slate-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-medium ${!n.isRead ? "text-white" : "text-slate-300"}`}>{n.title}</span>
                    {!n.isRead && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-slate-600 text-xs">{formatDateTime(n.createdAt)}</span>
                    {n.requestId && (
                      <Link href={`/requests/${n.requestId}`} onClick={(e) => e.stopPropagation()}
                        className="text-indigo-400 hover:text-indigo-300 text-xs">
                        View Request
                      </Link>
                    )}
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
