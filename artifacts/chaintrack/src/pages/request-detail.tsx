import { useParams, Link } from "wouter";
import {
  useGetRequest, useGetAgreement, useUpdateRequestStatus, useSignAgreement, useCreateRating,
  getGetRequestQueryKey, getGetAgreementQueryKey, getListRequestsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { formatCurrency, formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import { MapPin, Clock, FileText, Star, AlertTriangle, Navigation, CheckCircle, User } from "lucide-react";

export default function RequestDetailPage() {
  const params = useParams();
  const id = parseInt(params.id ?? "0", 10);
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: req, isLoading } = useGetRequest(id, { query: { queryKey: getGetRequestQueryKey(id), enabled: !!id } });
  const { data: agreement } = useGetAgreement(id, { query: { queryKey: getGetAgreementQueryKey(id), enabled: !!id } });

  const updateStatus = useUpdateRequestStatus();
  const signAgreement = useSignAgreement();
  const createRating = useCreateRating();
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingReview, setRatingReview] = useState("");

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!req) return <div className="p-6 text-slate-400">Request not found</div>;

  const r = req as {
    id: number; pickupLocation: string; dropLocation: string; description: string;
    serviceType: string; status: string; offeredPrice?: number | null; agreedPrice?: number | null;
    distanceKm?: number | null; createdAt: string; completedAt?: string | null;
    customer?: { id: number; name: string; email: string; rating?: number | null } | null;
    provider?: { id: number; name: string; vehicleType?: string | null; rating?: number | null } | null;
  };

  const isCustomer = user?.role === "customer";
  const isProvider = user?.role === "provider";
  const isMyRequest = r.customer?.id === user?.id;
  const isMyDelivery = r.provider?.id === user?.id;

  function handleStatus(status: string) {
    updateStatus.mutate({ id, data: { status: status as "in_progress" | "completed" | "cancelled" } }, {
      onSuccess: () => {
        toast({ title: "Status updated" });
        qc.invalidateQueries({ queryKey: getGetRequestQueryKey(id) });
        qc.invalidateQueries({ queryKey: getListRequestsQueryKey() });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update status" }),
    });
  }

  function handleSign() {
    signAgreement.mutate({ requestId: id }, {
      onSuccess: () => {
        toast({ title: "Agreement signed" });
        qc.invalidateQueries({ queryKey: getGetAgreementQueryKey(id) });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to sign" }),
    });
  }

  function handleRating() {
    const ratedUserId = isCustomer ? r.provider?.id : r.customer?.id;
    if (!ratedUserId) return;
    createRating.mutate({ data: { requestId: id, ratedUserId, score: ratingScore, review: ratingReview || null } }, {
      onSuccess: () => toast({ title: "Rating submitted" }),
      onError: () => toast({ variant: "destructive", title: "Failed to submit rating" }),
    });
  }

  const agr = agreement as {
    customerSigned: boolean; providerSigned: boolean; fullyExecuted: boolean; agreedPrice: number; terms: string;
  } | undefined;

  const canSignAgreement = agr && !agr.fullyExecuted && (
    (isCustomer && isMyRequest && !agr.customerSigned) ||
    (isProvider && isMyDelivery && !agr.providerSigned)
  );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/requests" className="text-slate-500 hover:text-slate-300 text-sm">Requests</Link>
        <span className="text-slate-700">/</span>
        <span className="text-white text-sm">#{r.id}</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${getStatusColor(r.status)}`}>
                {getStatusLabel(r.status)}
              </span>
              <span className="text-slate-500 text-xs capitalize">{r.serviceType}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-medium">{r.pickupLocation}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                <span>{r.dropLocation}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white font-bold text-xl">{formatCurrency(r.agreedPrice ?? r.offeredPrice ?? 0)}</div>
            {r.distanceKm && <div className="text-slate-500 text-sm">{r.distanceKm} km</div>}
          </div>
        </div>

        <p className="text-slate-400 text-sm mb-4 border-t border-slate-800 pt-4">{r.description}</p>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDateTime(r.createdAt)}</div>
          {r.completedAt && <div className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Completed {formatDateTime(r.completedAt)}</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {r.customer && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-500 text-xs mb-2 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Customer</div>
            <div className="text-white font-medium text-sm">{r.customer.name}</div>
            {r.customer.rating != null && (
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {r.customer.rating.toFixed(1)}
              </div>
            )}
          </div>
        )}
        {r.provider && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-slate-500 text-xs mb-2 flex items-center gap-1"><Navigation className="w-3.5 h-3.5" /> Provider</div>
            <div className="text-white font-medium text-sm">{r.provider.name}</div>
            {r.provider.vehicleType && <div className="text-slate-500 text-xs">{r.provider.vehicleType}</div>}
            {r.provider.rating != null && (
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {r.provider.rating.toFixed(1)}
              </div>
            )}
          </div>
        )}
      </div>

      {agr && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" /> Digital Agreement
            </h3>
            {agr.fullyExecuted && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-800/50">
                <CheckCircle className="w-3 h-3" /> Fully Executed
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs mb-4 leading-relaxed">{agr.terms}</p>
          <div className="text-indigo-400 font-bold mb-3">Agreed Price: {formatCurrency(agr.agreedPrice)}</div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${agr.customerSigned ? "bg-emerald-500" : "bg-slate-700"}`}>
                {agr.customerSigned && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <span className={agr.customerSigned ? "text-emerald-400" : "text-slate-500"}>Customer signed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${agr.providerSigned ? "bg-emerald-500" : "bg-slate-700"}`}>
                {agr.providerSigned && <CheckCircle className="w-3 h-3 text-white" />}
              </div>
              <span className={agr.providerSigned ? "text-emerald-400" : "text-slate-500"}>Provider signed</span>
            </div>
          </div>
          {canSignAgreement && (
            <button
              onClick={handleSign}
              disabled={signAgreement.isPending}
              data-testid="button-sign"
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {signAgreement.isPending ? "Signing..." : "Sign Agreement"}
            </button>
          )}
        </div>
      )}

      {isProvider && isMyDelivery && ["accepted", "in_progress"].includes(r.status) && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-3">Update Status</h3>
          <div className="flex gap-3">
            {r.status === "accepted" && (
              <button onClick={() => handleStatus("in_progress")} disabled={updateStatus.isPending}
                data-testid="button-start"
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                Start Delivery
              </button>
            )}
            {r.status === "in_progress" && (
              <button onClick={() => handleStatus("completed")} disabled={updateStatus.isPending}
                data-testid="button-complete"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                Mark Completed
              </button>
            )}
            <Link href={`/tracking/${r.id}`} className="flex-1">
              <button data-testid="button-tracking" className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                View Tracking
              </button>
            </Link>
          </div>
        </div>
      )}

      {r.status === "completed" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-4">Rate This Experience</h3>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRatingScore(s)} data-testid={`star-${s}`}
                className="transition-colors">
                <Star className={`w-7 h-7 ${s <= ratingScore ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} />
              </button>
            ))}
          </div>
          <textarea
            value={ratingReview}
            onChange={(e) => setRatingReview(e.target.value)}
            placeholder="Write a review (optional)..."
            data-testid="input-review"
            className="w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-indigo-500 mb-3"
            rows={2}
          />
          <button onClick={handleRating} disabled={createRating.isPending} data-testid="button-submit-rating"
            className="bg-amber-500 hover:bg-amber-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {createRating.isPending ? "Submitting..." : "Submit Rating"}
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/tracking/${r.id}`} className="flex-1">
          <button data-testid="button-view-tracking" className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Navigation className="w-4 h-4" />
            Track Shipment
          </button>
        </Link>
        {(isMyRequest || isMyDelivery) && (
          <Link href={`/disputes?requestId=${r.id}`} className="flex-1">
            <button data-testid="button-dispute" className="w-full flex items-center justify-center gap-2 bg-slate-900 border border-red-900/50 hover:border-red-700/50 text-red-400 py-2.5 rounded-lg text-sm font-medium transition-colors">
              <AlertTriangle className="w-4 h-4" />
              Raise Dispute
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
