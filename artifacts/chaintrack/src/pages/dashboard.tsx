import { useAuth } from "@/lib/auth-context";
import {
  useGetCustomerDashboard,
  useGetProviderDashboard,
  getGetCustomerDashboardQueryKey,
  getGetProviderDashboardQueryKey,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatCurrency, formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import { Package, TrendingUp, CheckCircle, AlertTriangle, Plus, Truck, Star, Clock } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Package; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-slate-400 text-sm">{label}</div>
      {sub && <div className="text-slate-600 text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

function RequestRow({ req }: { req: unknown }) {
  const r = req as {
    id: number; pickupLocation: string; dropLocation: string; status: string;
    offeredPrice?: number | null; agreedPrice?: number | null; createdAt: string;
  };
  return (
    <Link href={`/requests/${r.id}`}>
      <div data-testid={`card-request-${r.id}`}
        className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-slate-800 last:border-0">
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm font-medium truncate">{r.pickupLocation} → {r.dropLocation}</div>
          <div className="text-slate-500 text-xs mt-0.5">{formatDateTime(r.createdAt)}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-slate-300 text-sm font-medium">
            {formatCurrency(r.agreedPrice ?? r.offeredPrice ?? 0)}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(r.status)}`}>
            {getStatusLabel(r.status)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function CustomerDashboard() {
  const { data, isLoading } = useGetCustomerDashboard({ query: { queryKey: getGetCustomerDashboardQueryKey() } });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-2xl">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Your logistics overview</p>
        </div>
        <Link href="/requests/new">
          <button data-testid="button-new-request" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            New Request
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Requests" value={data?.totalRequests ?? 0} color="bg-indigo-600/20 text-indigo-400" />
        <StatCard icon={Clock} label="Active" value={data?.activeRequests ?? 0} color="bg-amber-500/20 text-amber-400" />
        <StatCard icon={CheckCircle} label="Completed" value={data?.completedRequests ?? 0} color="bg-emerald-500/20 text-emerald-400" />
        <StatCard icon={TrendingUp} label="Total Spent" value={formatCurrency(data?.totalSpent ?? 0)} color="bg-violet-500/20 text-violet-400" />
      </div>

      {(data?.openDisputes ?? 0) > 0 && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <div>
            <span className="text-red-300 font-medium text-sm">{data?.openDisputes} open dispute{(data?.openDisputes ?? 0) > 1 ? "s" : ""}</span>
            <Link href="/disputes" className="text-red-400 hover:text-red-300 text-sm ml-2 underline">View</Link>
          </div>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-white font-semibold text-sm">Recent Requests</h2>
          <Link href="/requests" className="text-indigo-400 hover:text-indigo-300 text-xs">View all</Link>
        </div>
        {data?.recentRequests?.length === 0 && (
          <div className="px-5 py-8 text-center text-slate-500 text-sm">
            No requests yet.{" "}
            <Link href="/requests/new" className="text-indigo-400 hover:text-indigo-300">Create your first request</Link>
          </div>
        )}
        {(data?.recentRequests ?? []).map((r) => <RequestRow key={(r as { id: number }).id} req={r} />)}
      </div>
    </div>
  );
}

function ProviderDashboard() {
  const { data, isLoading } = useGetProviderDashboard({ query: { queryKey: getGetProviderDashboardQueryKey() } });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-2xl">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Your delivery overview</p>
        </div>
        <Link href="/requests">
          <button data-testid="button-view-jobs" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Truck className="w-4 h-4" />
            Browse Jobs
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Truck} label="Total Deliveries" value={data?.totalDeliveries ?? 0} color="bg-indigo-600/20 text-indigo-400" />
        <StatCard icon={Clock} label="Active" value={data?.activeDeliveries ?? 0} color="bg-amber-500/20 text-amber-400" />
        <StatCard icon={CheckCircle} label="Completed" value={data?.completedDeliveries ?? 0} color="bg-emerald-500/20 text-emerald-400" />
        <StatCard icon={TrendingUp} label="Earnings" value={formatCurrency(data?.totalEarnings ?? 0)} color="bg-violet-500/20 text-violet-400" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-white font-bold text-2xl">{(data?.averageRating ?? 0).toFixed(1)}</span>
          </div>
          <div className="text-slate-400 text-sm">Average Rating</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-amber-400" />
            <span className="text-white font-bold text-2xl">{data?.pendingRequests ?? 0}</span>
          </div>
          <div className="text-slate-400 text-sm">Available Jobs</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-white font-semibold text-sm">Recent Deliveries</h2>
          <Link href="/requests" className="text-indigo-400 hover:text-indigo-300 text-xs">View all</Link>
        </div>
        {data?.recentDeliveries?.length === 0 && (
          <div className="px-5 py-8 text-center text-slate-500 text-sm">
            No deliveries yet.{" "}
            <Link href="/requests" className="text-indigo-400 hover:text-indigo-300">Browse available jobs</Link>
          </div>
        )}
        {(data?.recentDeliveries ?? []).map((r) => <RequestRow key={(r as { id: number }).id} req={r} />)}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  return user?.role === "provider" ? <ProviderDashboard /> : <CustomerDashboard />;
}
