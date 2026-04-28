import { useState } from "react";
import { Link, useParams } from "wouter";
import {
  useCreateRating,
  useGetAgreement,
  useGetRequest,
  useSignAgreement,
  useUpdateRequestStatus,
  getGetAgreementQueryKey,
  getGetRequestQueryKey,
  getListRequestsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDateTime, getServiceTypeLabel, getStatusColor, getStatusLabel } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Landmark,
  Navigation,
  ShieldCheck,
  Star,
  TrainFront,
  User,
  WalletCards,
} from "lucide-react";

type ConsignmentDetail = {
  id: number;
  consignmentId?: string | null;
  bookingReference?: string | null;
  invoiceReference?: string | null;
  originStation?: string | null;
  destinationStation?: string | null;
  expectedUnloadStation?: string | null;
  trainReference?: string | null;
  coachOrWagon?: string | null;
  cargoCategory?: string | null;
  declaredValue?: number | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  receiverEmail?: string | null;
  receiverBusiness?: string | null;
  riskNote?: string | null;
  pickupLocation: string;
  dropLocation: string;
  description: string;
  serviceType: string;
  status: string;
  offeredPrice?: number | null;
  agreedPrice?: number | null;
  distanceKm?: number | null;
  createdAt: string;
  scheduledAt?: string | null;
  completedAt?: string | null;
  customer?: { id: number; name: string; email: string; rating?: number | null } | null;
  provider?: { id: number; name: string; vehicleType?: string | null; rating?: number | null } | null;
};

export default function RequestDetailPage() {
  const params = useParams();
  const id = parseInt(params.id ?? "0", 10);
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: request, isLoading } = useGetRequest(id, { query: { queryKey: getGetRequestQueryKey(id), enabled: !!id } });
  const { data: agreement } = useGetAgreement(id, { query: { queryKey: getGetAgreementQueryKey(id), enabled: !!id } });

  const updateStatus = useUpdateRequestStatus();
  const signAgreement = useSignAgreement();
  const createRating = useCreateRating();
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingReview, setRatingReview] = useState("");

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  if (!request) {
    return <div className="p-6 text-slate-400">Consignment not found</div>;
  }

  const r = request as ConsignmentDetail;
  const agr = agreement as {
    customerSigned: boolean;
    providerSigned: boolean;
    fullyExecuted: boolean;
    agreedPrice: number;
    terms: string;
  } | undefined;

  const isShipper = user?.role === "shipper";
  const isTrainStaff = user?.role === "train_staff";
  const isMyShipment = r.customer?.id === user?.id;
  const isMyHandoff = r.provider?.id === user?.id;

  function handleStatus(status: "in_progress" | "completed" | "cancelled") {
    updateStatus.mutate(
      { id, data: { status } },
      {
        onSuccess: () => {
          toast({ title: "Status updated" });
          qc.invalidateQueries({ queryKey: getGetRequestQueryKey(id) });
          qc.invalidateQueries({ queryKey: getListRequestsQueryKey() });
        },
        onError: () => toast({ variant: "destructive", title: "Failed to update status" }),
      },
    );
  }

  function handleSign() {
    signAgreement.mutate(
      { requestId: id },
      {
        onSuccess: () => {
          toast({ title: "Agreement signed" });
          qc.invalidateQueries({ queryKey: getGetAgreementQueryKey(id) });
        },
        onError: () => toast({ variant: "destructive", title: "Failed to sign agreement" }),
      },
    );
  }

  function handleRating() {
    const ratedUserId = isShipper ? r.provider?.id : r.customer?.id;
    if (!ratedUserId) return;

    createRating.mutate(
      { data: { requestId: id, ratedUserId, score: ratingScore, review: ratingReview || null } },
      {
        onSuccess: () => toast({ title: "Rating submitted" }),
        onError: () => toast({ variant: "destructive", title: "Failed to submit rating" }),
      },
    );
  }

  const canSignAgreement = agr && !agr.fullyExecuted && (
    (isShipper && isMyShipment && !agr.customerSigned) ||
    (isTrainStaff && isMyHandoff && !agr.providerSigned)
  );

  const canRate = r.status === "completed" && ((isShipper && isMyShipment) || (isTrainStaff && isMyHandoff));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Link href="/requests" className="text-sm text-slate-500 hover:text-slate-300">Consignments</Link>
        <span className="text-slate-700">/</span>
        <span className="text-sm text-white">{r.consignmentId ?? `#${r.id}`}</span>
      </div>

      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_24%),rgba(15,23,42,0.92)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusColor(r.status)}`}>
                {getStatusLabel(r.status)}
              </span>
              <span className="text-xs text-slate-500">{getServiceTypeLabel(r.serviceType)}</span>
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">{r.consignmentId ?? `Consignment #${r.id}`}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{r.description}</p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <Landmark className="h-4 w-4 text-emerald-400" />
                {r.originStation ?? r.pickupLocation}
              </div>
              <div className="text-slate-600">to</div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                <Landmark className="h-4 w-4 text-rose-400" />
                {r.expectedUnloadStation ?? r.destinationStation ?? r.dropLocation}
              </div>
              {r.trainReference ? (
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <TrainFront className="h-4 w-4 text-cyan-300" />
                  {r.trainReference}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-slate-500">Agreed value</div>
              <div className="mt-2 text-lg font-semibold text-white">{formatCurrency(r.agreedPrice ?? r.offeredPrice ?? 0)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-slate-500">Declared goods value</div>
              <div className="mt-2 text-lg font-semibold text-white">{r.declaredValue ? formatCurrency(r.declaredValue) : "Not added"}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-slate-500">Created</div>
              <div className="mt-2 text-sm font-semibold text-white">{formatDateTime(r.createdAt)}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-semibold text-white">Route and booking details</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Booking reference", r.bookingReference],
                ["Invoice reference", r.invoiceReference],
                ["Origin station", r.originStation ?? r.pickupLocation],
                ["Destination station", r.destinationStation ?? r.dropLocation],
                ["Expected unload station", r.expectedUnloadStation ?? r.destinationStation ?? r.dropLocation],
                ["Train reference", r.trainReference],
                ["Coach or wagon", r.coachOrWagon],
                ["Cargo category", r.cargoCategory],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="text-xs text-slate-500">{label}</div>
                  <div className="mt-2 text-sm text-white">{value || "Not added"}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-semibold text-white">Receiver and custody contacts</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <User className="h-4 w-4 text-cyan-300" />
                  Shipper
                </div>
                <div className="text-sm text-white">{r.customer?.name ?? "Unknown"}</div>
                <div className="mt-1 text-xs text-slate-500">{r.customer?.email}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <User className="h-4 w-4 text-cyan-300" />
                  Receiver
                </div>
                <div className="text-sm text-white">{r.receiverName ?? "Not added"}</div>
                <div className="mt-1 text-xs text-slate-500">{r.receiverPhone ?? "No phone"} {r.receiverEmail ? `• ${r.receiverEmail}` : ""}</div>
                {r.receiverBusiness ? <div className="mt-1 text-xs text-slate-500">{r.receiverBusiness}</div> : null}
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 md:col-span-2">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <TrainFront className="h-4 w-4 text-cyan-300" />
                  Assigned train staff
                </div>
                <div className="text-sm text-white">{r.provider?.name ?? "Unassigned"}</div>
                <div className="mt-1 text-xs text-slate-500">{r.provider?.vehicleType ?? "No assignment note available"}</div>
              </div>
            </div>
          </section>

          {agr ? (
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                  <FileText className="h-4 w-4 text-cyan-300" />
                  Cargo agreement
                </h2>
                {agr.fullyExecuted ? (
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                    Fully executed
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
                    Awaiting signatures
                  </span>
                )}
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-400">{agr.terms}</p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="text-xs text-slate-500">Agreed price</div>
                  <div className="mt-2 text-lg font-semibold text-white">{formatCurrency(agr.agreedPrice)}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="text-xs text-slate-500">Shipper signature</div>
                  <div className={`mt-2 text-sm ${agr.customerSigned ? "text-emerald-300" : "text-slate-400"}`}>
                    {agr.customerSigned ? "Signed" : "Pending"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="text-xs text-slate-500">Train staff signature</div>
                  <div className={`mt-2 text-sm ${agr.providerSigned ? "text-emerald-300" : "text-slate-400"}`}>
                    {agr.providerSigned ? "Signed" : "Pending"}
                  </div>
                </div>
              </div>

              {canSignAgreement ? (
                <button
                  onClick={handleSign}
                  disabled={signAgreement.isPending}
                  data-testid="button-sign"
                  className="mt-4 w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
                >
                  {signAgreement.isPending ? "Signing..." : "Sign agreement"}
                </button>
              ) : null}
            </section>
          ) : null}

          {canRate ? (
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">Rate this handoff</h2>
              <div className="mb-3 flex gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button key={score} onClick={() => setRatingScore(score)} data-testid={`star-${score}`} className="transition-colors">
                    <Star className={`h-7 w-7 ${score <= ratingScore ? "fill-amber-400 text-amber-400" : "text-slate-700"}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={ratingReview}
                onChange={(event) => setRatingReview(event.target.value)}
                placeholder="What went well or what should improve?"
                data-testid="input-review"
                className="mb-3 w-full resize-none rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                rows={3}
              />
              <button
                onClick={handleRating}
                disabled={createRating.isPending}
                data-testid="button-submit-rating"
                className="rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:opacity-50"
              >
                {createRating.isPending ? "Submitting..." : "Submit rating"}
              </button>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-semibold text-white">Operational snapshot</h2>
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <Clock className="h-4 w-4 text-cyan-300" />
                  Timing
                </div>
                <div className="text-sm text-slate-300">Created {formatDateTime(r.createdAt)}</div>
                {r.scheduledAt ? <div className="mt-1 text-sm text-slate-300">Scheduled {formatDateTime(r.scheduledAt)}</div> : null}
                {r.completedAt ? <div className="mt-1 text-sm text-emerald-300">Completed {formatDateTime(r.completedAt)}</div> : null}
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <WalletCards className="h-4 w-4 text-cyan-300" />
                  Financial context
                </div>
                <div className="text-sm text-slate-300">Posted price: {formatCurrency(r.offeredPrice ?? 0)}</div>
                <div className="mt-1 text-sm text-slate-300">Final price: {formatCurrency(r.agreedPrice ?? r.offeredPrice ?? 0)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                  <ShieldCheck className="h-4 w-4 text-cyan-300" />
                  Risk note
                </div>
                <p className="text-sm leading-6 text-slate-400">
                  {r.riskNote ?? "No extra risk note has been attached to this consignment."}
                </p>
              </div>
            </div>
          </section>

          {(isTrainStaff && isMyHandoff && ["accepted", "in_progress"].includes(r.status)) ? (
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">Update cargo state</h2>
              <div className="space-y-3">
                {r.status === "accepted" ? (
                  <button
                    onClick={() => handleStatus("in_progress")}
                    disabled={updateStatus.isPending}
                    data-testid="button-start"
                    className="w-full rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
                  >
                    Start monitored transit
                  </button>
                ) : null}
                {r.status === "in_progress" ? (
                  <button
                    onClick={() => handleStatus("completed")}
                    disabled={updateStatus.isPending}
                    data-testid="button-complete"
                    className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Mark unload completed
                  </button>
                ) : null}
                <Link href={`/tracking/${r.id}`}>
                  <button
                    data-testid="button-tracking"
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-slate-800"
                  >
                    Open tracking timeline
                  </button>
                </Link>
              </div>
            </section>
          ) : null}

          <div className="grid gap-3">
            <Link href={`/tracking/${r.id}`}>
              <button
                data-testid="button-view-tracking"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/20 hover:bg-white/10"
              >
                <Navigation className="h-4 w-4" />
                View tracking
              </button>
            </Link>
            <Link href={`/disputes?requestId=${r.id}`}>
              <button
                data-testid="button-dispute"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/15"
              >
                <AlertTriangle className="h-4 w-4" />
                Raise dispute
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
