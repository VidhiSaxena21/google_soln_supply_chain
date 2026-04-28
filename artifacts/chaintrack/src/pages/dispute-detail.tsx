import { Link, useParams } from "wouter";
import { useGetDispute, getGetDisputeQueryKey } from "@workspace/api-client-react";
import { formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import { AlertTriangle, Landmark, TrainFront } from "lucide-react";

export default function DisputeDetailPage() {
  const params = useParams();
  const id = parseInt(params.id ?? "0", 10);
  const { data: dispute, isLoading } = useGetDispute(id, { query: { queryKey: getGetDisputeQueryKey(id), enabled: !!id } });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }
  if (!dispute) return <div className="p-6 text-slate-400">Dispute not found</div>;

  const d = dispute as {
    id: number;
    requestId: number;
    reason: string;
    description: string;
    status: string;
    resolution?: string | null;
    createdAt: string;
    resolvedAt?: string | null;
    request?: {
      consignmentId?: string | null;
      originStation?: string | null;
      expectedUnloadStation?: string | null;
      trainReference?: string | null;
      pickupLocation: string;
      dropLocation: string;
      serviceType: string;
    } | null;
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Link href="/disputes" className="text-sm text-slate-500 hover:text-slate-300">Disputes</Link>
        <span className="text-slate-700">/</span>
        <span className="text-sm text-white">#{d.id}</span>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-300" />
            <h1 className="text-lg font-bold text-white">Dispute #{d.id}</h1>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-xs ${getStatusColor(d.status)}`}>
            {getStatusLabel(d.status)}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-xs text-slate-500">Reason</div>
            <div className="mt-1 text-base font-semibold text-white">{d.reason}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Description</div>
            <p className="mt-1 text-sm leading-7 text-slate-300">{d.description}</p>
          </div>
          <div className="text-xs text-slate-500">Filed {formatDateTime(d.createdAt)}</div>
        </div>
      </div>

      {d.request ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="text-xs text-slate-500">Related consignment</div>
          <div className="mt-2 text-lg font-semibold text-white">{d.request.consignmentId ?? `Request #${d.requestId}`}</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                <Landmark className="h-4 w-4 text-emerald-400" />
                Origin
              </div>
              <div className="text-sm text-slate-300">{d.request.originStation ?? d.request.pickupLocation}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                <Landmark className="h-4 w-4 text-rose-400" />
                Expected unload
              </div>
              <div className="text-sm text-slate-300">{d.request.expectedUnloadStation ?? d.request.dropLocation}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:col-span-2">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                <TrainFront className="h-4 w-4 text-cyan-300" />
                Train reference
              </div>
              <div className="text-sm text-slate-300">{d.request.trainReference ?? "Not recorded"}</div>
            </div>
          </div>
          <Link href={`/requests/${d.requestId}`} className="mt-4 inline-block text-sm text-cyan-300 hover:text-cyan-200">
            Open full consignment record
          </Link>
        </div>
      ) : null}

      {d.resolution ? (
        <div className="rounded-[28px] border border-emerald-800/50 bg-emerald-950/30 p-5">
          <div className="text-sm font-medium text-emerald-300">Resolution</div>
          <p className="mt-2 text-sm leading-7 text-slate-300">{d.resolution}</p>
          {d.resolvedAt ? <div className="mt-3 text-xs text-slate-500">Resolved {formatDateTime(d.resolvedAt)}</div> : null}
        </div>
      ) : null}

      {d.status === "open" || d.status === "under_review" ? (
        <div className="rounded-[28px] border border-amber-900/30 bg-white/5 p-4">
          <div className="text-sm font-medium text-amber-300">Monitor review in progress</div>
          <p className="mt-1 text-xs leading-6 text-slate-400">
            This dispute remains active. Keep the related consignment timeline intact so the monitor portal can review station, train, and checkpoint evidence quickly.
          </p>
        </div>
      ) : null}
    </div>
  );
}
