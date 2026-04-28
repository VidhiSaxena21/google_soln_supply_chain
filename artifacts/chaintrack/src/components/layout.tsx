import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useListNotifications } from "@workspace/api-client-react";
import {
  AlertTriangle,
  Bell,
  FileSignature,
  FileText,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Package,
  Radar,
  ShieldCheck,
  Star,
  TrainFront,
  UserRoundCheck,
} from "lucide-react";
import { cn, getPortalLabel, getRoleDescription, getRoleLabel, type PortalRole } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const navByRole: Record<PortalRole, NavItem[]> = {
  shipper: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/requests/new", label: "New Consignment", icon: TrainFront },
    { href: "/requests", label: "My Consignments", icon: Package },
    { href: "/agreements", label: "Agreements", icon: FileText },
    { href: "/disputes", label: "Disputes", icon: AlertTriangle },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ],
  receiver: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/requests", label: "Incoming Cargo", icon: Package },
    { href: "/agreements", label: "Agreements", icon: FileText },
    { href: "/disputes", label: "Disputes", icon: AlertTriangle },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ],
  railway_monitor: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/requests", label: "Monitor Queue", icon: Radar },
    { href: "/agreements", label: "Agreements", icon: FileText },
    { href: "/disputes", label: "Disputes", icon: AlertTriangle },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ],
  train_staff: [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/requests", label: "Cargo Queue", icon: TrainFront },
    { href: "/agreements", label: "Agreements", icon: FileText },
    { href: "/disputes", label: "Disputes", icon: AlertTriangle },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ],
};

const trustSignals = [
  {
    icon: ShieldCheck,
    label: "Route accountability",
    body: "Origin, train reference, expected unload station, and receiver details stay attached to the consignment.",
  },
  {
    icon: FileSignature,
    label: "Recorded evidence",
    body: "Agreements and checkpoint updates reduce the chance of coercion or unofficial charge disputes becoming invisible.",
  },
  {
    icon: UserRoundCheck,
    label: "Shared visibility",
    body: "Shipper, receiver, train staff, and railway monitor can each work from the same record instead of fragmented calls.",
  },
];

function NavLinks({
  nav,
  location,
  unreadCount,
}: {
  nav: NavItem[];
  location: string;
  unreadCount: number;
}) {
  return (
    <nav className="space-y-1">
      {nav.map(({ href, label, icon: Icon }) => {
        const active = location === href || (href !== "/" && location.startsWith(href));
        const isNotif = href === "/notifications";

        return (
          <Link key={href} href={href}>
            <div
              data-testid={`nav-${label.toLowerCase().replace(/\s/g, "-")}`}
              className={cn(
                "group flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all",
                active
                  ? "border border-cyan-400/30 bg-cyan-400/15 text-white shadow-[0_0_0_1px_rgba(34,211,238,0.1)]"
                  : "border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {isNotif && unreadCount > 0 && (
                <span className="min-w-[20px] rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-xs text-white">
                  {unreadCount}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const { data: notifData } = useListNotifications();
  const unreadCount = notifData?.unreadCount ?? 0;

  const role = user?.role ?? "shipper";
  const nav = navByRole[role];
  const roleLabel = getPortalLabel(role);
  const roleDescription = getRoleDescription(role);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.1),transparent_20%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
        <aside className="hidden w-80 shrink-0 flex-col border-r border-white/10 bg-slate-950/85 px-5 py-5 backdrop-blur lg:flex">
          <div className="mb-6 rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_36px_rgba(34,211,238,0.25)]">
                <MapPin className="h-5 w-5 text-slate-950" />
              </div>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">ChainTrack</div>
                <div className="text-xs text-slate-400">{roleLabel}</div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-4 text-sm leading-6 text-slate-200">
              {roleDescription}
            </div>
          </div>

          <div className="flex-1 px-1">
            <NavLinks nav={nav} location={location} unreadCount={unreadCount} />

            <div className="mt-6 space-y-3 rounded-[28px] border border-white/10 bg-white/5 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Trust signals</div>
              {trustSignals.map(({ icon: Icon, label, body }) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <Icon className="h-4 w-4 text-cyan-300" />
                    {label}
                  </div>
                  <p className="text-xs leading-5 text-slate-400">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-3 px-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-100">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{user?.name}</div>
                <div className="text-xs text-slate-400">{getRoleLabel(role)}</div>
              </div>
              {user?.rating != null && (
                <div className="flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-xs text-amber-200">
                  <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                  {user.rating.toFixed(1)}
                </div>
              )}
            </div>
            <button
              onClick={logout}
              data-testid="button-logout"
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 px-3 py-3 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500">
                  <MapPin className="h-4 w-4 text-slate-950" />
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">ChainTrack</div>
                  <div className="text-xs text-slate-400">{roleLabel}</div>
                </div>
              </div>

              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-2xl border-white/10 bg-white/5 text-white">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="border-white/10 bg-slate-950 text-white">
                  <DrawerHeader>
                    <DrawerTitle>Portal menu</DrawerTitle>
                    <DrawerDescription className="text-slate-400">
                      Navigate your railway cargo workflow, records, and alerts.
                    </DrawerDescription>
                  </DrawerHeader>

                  <div className="space-y-5 px-4 pb-6">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-100">
                          {user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-white">{user?.name}</div>
                          <div className="text-xs text-slate-400">{getRoleLabel(role)}</div>
                        </div>
                        {user?.rating != null && (
                          <div className="flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-xs text-amber-200">
                            <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                            {user.rating.toFixed(1)}
                          </div>
                        )}
                      </div>

                      <NavLinks nav={nav} location={location} unreadCount={unreadCount} />
                    </div>

                    <button
                      onClick={logout}
                      data-testid="button-logout-mobile"
                      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 px-3 py-3 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </header>

          {isMobile && (
            <div className="border-b border-cyan-400/10 bg-cyan-400/10 px-4 py-2 text-xs text-cyan-100 lg:hidden">
              Expected unload station, train handoff proof, and dispute visibility stay attached to each consignment.
            </div>
          )}

          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
