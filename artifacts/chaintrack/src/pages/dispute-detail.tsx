import { useParams, Link } from "wouter";
import { useGetDispute, getGetDisputeQueryKey } from "@workspace/api-client-react";
import { formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import { AlertTriangle, MapPin } from "lucide-react";

export default function DisputeDetailPage() {
  const params = useParams();
  const id = parseInt(params.id ?? "0", 10);
  const { data: dispute, isLoading } = useGetDispute(id, { query: { queryKey: getGetDisputeQueryKey(id), enabled: !!id } });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!dispute) return <div className="p-6 text-slate-400">Dispute not found</div>;

  const d = dispute as {
    id: number; requestId: number; reason: string; description: string; status: string;
    resolution?: string | null; createdAt: string; resolvedAt?: string | null;
    request?: {
      pickupLocation: string; dropLocation: string; serviceType: string;
    } | null;
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/disputes" className="text-slate-500 hover:text-slate-300 text-sm">Disputes</Link>
        <span className="text-slate-700">/</span>
        <span className="text-white text-sm">#{d.id}</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h1 className="text-white font-bold text-lg">Dispute #{d.id}</h1>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusColor(d.status)}`}>
            {getStatusLabel(d.status)}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-slate-500 text-xs mb-1">Reason</div>
            <div className="text-white font-medium">{d.reason}</div>
          </div>
          <div>
            <div className="text-slate-500 text-xs mb-1">Description</div>
            <p className="text-slate-300 text-sm leading-relaxed">{d.description}</p>
          </div>
          <div className="text-slate-500 text-xs">Filed {formatDateTime(d.createdAt)}</div>
        </div>
      </div>

      {d.request && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-500 text-xs mb-3">Related Request #{d.requestId}</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-white">{d.request.pickupLocation}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span className="text-slate-400">{d.request.dropLocation}</span>
            </div>
          </div>
          <Link href={`/requests/${d.requestId}`} className="text-indigo-400 hover:text-indigo-300 text-xs mt-3 block">
            View Request
          </Link>
        </div>
      )}

      {d.resolution && (
        <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-5">
          <div className="text-emerald-400 text-xs font-medium mb-2">Resolution</div>
          <p className="text-slate-300 text-sm">{d.resolution}</p>
          {d.resolvedAt && <div className="text-slate-500 text-xs mt-2">Resolved {formatDateTime(d.resolvedAt)}</div>}
        </div>
      )}

      {d.status === "open" && (
        <div className="bg-slate-900 border border-amber-900/30 rounded-xl p-4">
          <div className="text-amber-400 text-sm font-medium mb-1">Under Review</div>
          <p className="text-slate-400 text-xs">Our team will review your dispute and respond within 24-48 hours.</p>
        </div>
      )}
    </div>
  );
}
