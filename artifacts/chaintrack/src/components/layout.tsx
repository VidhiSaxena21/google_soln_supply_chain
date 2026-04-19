import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useListNotifications, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Package,
  FileText,
  AlertTriangle,
  Bell,
  LogOut,
  Truck,
  ChevronRight,
  MapPin,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

const customerNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requests", label: "My Requests", icon: Package },
  { href: "/agreements", label: "Agreements", icon: FileText },
  { href: "/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

const providerNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requests", label: "Jobs", icon: Truck },
  { href: "/agreements", label: "Agreements", icon: FileText },
  { href: "/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const qc = useQueryClient();

  const { data: notifData } = useListNotifications();
  const unreadCount = notifData?.unreadCount ?? 0;

  const nav = user?.role === "provider" ? providerNav : customerNav;

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-wide">ChainTrack</div>
              <div className="text-slate-500 text-xs capitalize">{user?.role}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== "/" && location.startsWith(href));
            const isNotif = href === "/notifications";
            return (
              <Link key={href} href={href}>
                <div
                  data-testid={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer group",
                    active
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isNotif && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{user?.name}</div>
              {user?.rating != null && (
                <div className="flex items-center gap-1 text-slate-400 text-xs">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {user.rating.toFixed(1)}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={logout}
            data-testid="button-logout"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
