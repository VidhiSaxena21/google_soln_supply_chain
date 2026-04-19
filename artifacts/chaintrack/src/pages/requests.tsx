import { useState } from "react";
import { Link } from "wouter";
import {
  useListRequests,
  useListAvailableRequests,
  useAcceptRequest,
  getListRequestsQueryKey,
  getListAvailableRequestsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import { Package, MapPin, Clock, Truck, ChevronRight, Plus } from "lucide-react";

interface RequestItem {
  id: number;
  pickupLocation: string;
  dropLocation: string;
  description: string;
  serviceType: string;
  status: string;
  offeredPrice?: number | null;
  agreedPrice?: number | null;
  distanceKm?: number | null;
  createdAt: string;
  customer?: { name: string } | null;
}

function RequestCard({ req, showAccept }: { req: RequestItem; showAccept?: boolean }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const accept = useAcceptRequest();

  function handleAccept(e: React.MouseEvent) {
    e.preventDefault();
    accept.mutate({ id: req.id }, {
      onSuccess: () => {
        toast({ title: "Job accepted", description: "Check your dashboard." });
        qc.invalidateQueries({ queryKey: getListAvailableRequestsQueryKey() });
        qc.invalidateQueries({ queryKey: getListRequestsQueryKey() });
      },
      onError: (err: unknown) => {
        const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to accept";
        toast({ variant: "destructive", title: "Error", description: msg });
      },
    });
  }

  return (
    <Link href={`/requests/${req.id}`}>
      <div data-testid={`card-request-${req.id}`}
        className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 cursor-pointer transition-all group">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(req.status)}`}>
                {getStatusLabel(req.status)}
              </span>
              <span className="text-slate-500 text-xs capitalize">{req.serviceType}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white text-sm font-medium">
              <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{req.pickupLocation}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="truncate">{req.dropLocation}</span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-white font-semibold text-base">
              {formatCurrency(req.agreedPrice ?? req.offeredPrice ?? 0)}
            </div>
            {req.distanceKm && (
              <div className="text-slate-500 text-xs mt-0.5">{req.distanceKm} km</div>
            )}
          </div>
        </div>

        <p className="text-slate-500 text-xs line-clamp-1 mb-3">{req.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-slate-600 text-xs">
            <Clock className="w-3 h-3" />
            {formatDateTime(req.createdAt)}
          </div>
          {showAccept ? (
            <button
              onClick={handleAccept}
              disabled={accept.isPending}
              data-testid={`button-accept-${req.id}`}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {accept.isPending ? "Accepting..." : "Accept Job"}
            </button>
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          )}
        </div>
      </div>
    </Link>
  );
}

export default function RequestsPage() {
  const { user } = useAuth();
  const isProvider = user?.role === "provider";
  const [tab, setTab] = useState<"mine" | "available">(isProvider ? "available" : "mine");

  const { data: myData, isLoading: myLoading } = useListRequests(undefined, { query: { queryKey: getListRequestsQueryKey() } });
  const { data: availData, isLoading: availLoading } = useListAvailableRequests({ query: { queryKey: getListAvailableRequestsQueryKey(), enabled: isProvider } });

  const loading = tab === "mine" ? myLoading : availLoading;
  const requests = (tab === "mine" ? myData?.requests : availData?.requests) ?? [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-bold text-2xl">{isProvider ? "Jobs" : "My Requests"}</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {isProvider ? "Find and manage delivery jobs" : "Track your service requests"}
          </p>
        </div>
        {!isProvider && (
          <Link href="/requests/new">
            <button data-testid="button-new-request" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" />
              New Request
            </button>
          </Link>
        )}
      </div>

      {isProvider && (
        <div className="flex gap-1 mb-6 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
          <button
            onClick={() => setTab("available")}
            data-testid="tab-available"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "available" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            Available Jobs
          </button>
          <button
            onClick={() => setTab("mine")}
            data-testid="tab-mine"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "mine" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            My Deliveries
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">
            {tab === "available" ? "No available jobs right now" : "No requests yet"}
          </p>
          <p className="text-slate-500 text-sm">
            {tab === "available" ? "Check back soon for new delivery jobs." : "Create your first request to get started."}
          </p>
          {!isProvider && (
            <Link href="/requests/new">
              <button className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Create Request
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((r) => (
            <RequestCard key={(r as RequestItem).id} req={r as RequestItem} showAccept={tab === "available" && isProvider} />
          ))}
        </div>
      )}
    </div>
  );
}
