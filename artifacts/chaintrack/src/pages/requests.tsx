import { useMemo, useState } from "react";
import { Link } from "wouter";
import {
  useAcceptRequest,
  useListAvailableRequests,
  useListRequests,
  getListAvailableRequestsQueryKey,
  getListRequestsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  formatCurrency,
  formatDateTime,
  getRoleLabel,
  getServiceTypeLabel,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils";
import { Clock, Filter, Landmark, Package, Plus, Search, TrainFront, UserRoundCheck } from "lucide-react";

interface RequestItem {
  id: number;
  consignmentId?: string | null;
  bookingReference?: string | null;
  originStation?: string | null;
  destinationStation?: string | null;
  expectedUnloadStation?: string | null;
  trainReference?: string | null;
  cargoCategory?: string | null;
  receiverName?: string | null;
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

function RequestCard({
  request,
  showAccept,
}: {
  request: RequestItem;
  showAccept?: boolean;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const accept = useAcceptRequest();

  function handleAccept(event: React.MouseEvent) {
    event.preventDefault();
    accept.mutate(
      { id: request.id },
      {
        onSuccess: () => {
          toast({ title: "Consignment accepted", description: "This cargo is now visible in your train staff queue." });
          qc.invalidateQueries({ queryKey: getListAvailableRequestsQueryKey() });
          qc.invalidateQueries({ queryKey: getListRequestsQueryKey() });
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to accept";
          toast({ variant: "destructive", title: "Error", description: msg });
        },
      },
    );
  }

  return (
    <Link href={`/requests/${request.id}`}>
      <div
        data-testid={`card-request-${request.id}`}
        className="cursor-pointer rounded-[28px] border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/20 hover:bg-white/7"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs ${getStatusColor(request.status)}`}>
                {getStatusLabel(request.status)}
              </span>
              <span className="text-xs text-slate-500">{getServiceTypeLabel(request.serviceType)}</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {request.consignmentId ?? `Consignment #${request.id}`}
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-300">
              <Landmark className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{request.originStation ?? request.pickupLocation}</span>
              <span className="text-slate-600">to</span>
              <span>{request.expectedUnloadStation ?? request.destinationStation ?? request.dropLocation}</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-base font-semibold text-white">
              {formatCurrency(request.agreedPrice ?? request.offeredPrice ?? 0)}
            </div>
            {request.distanceKm ? <div className="mt-1 text-xs text-slate-500">{request.distanceKm} km</div> : null}
          </div>
        </div>

        <div className="grid gap-3 text-sm text-slate-400 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Train</div>
            <div className="mt-1 text-slate-200">{request.trainReference ?? "To be assigned"}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Receiver</div>
            <div className="mt-1 text-slate-200">{request.receiverName ?? "Not added"}</div>
          </div>
        </div>

        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-400">{request.description}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDateTime(request.createdAt)}
            </span>
            {request.customer?.name ? <span>Shipper: {request.customer.name}</span> : null}
            {request.bookingReference ? <span>Booking: {request.bookingReference}</span> : null}
          </div>

          {showAccept ? (
            <button
              onClick={handleAccept}
              disabled={accept.isPending}
              data-testid={`button-accept-${request.id}`}
              className="rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
            >
              {accept.isPending ? "Accepting..." : "Accept custody"}
            </button>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

type RequestFilter = "all" | "requested" | "accepted" | "in_progress" | "completed";

export default function RequestsPage() {
  const { user } = useAuth();
  const isTrainStaff = user?.role === "train_staff";
  const isShipper = user?.role === "shipper";
  const [tab, setTab] = useState<"mine" | "available">(isTrainStaff ? "available" : "mine");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RequestFilter>("all");
  const [serviceFilter, setServiceFilter] = useState<"all" | "delivery" | "transport" | "logistics">("all");

  const { data: myData, isLoading: myLoading } = useListRequests(undefined, {
    query: { queryKey: getListRequestsQueryKey() },
  });
  const { data: availableData, isLoading: availableLoading } = useListAvailableRequests({
    query: { queryKey: getListAvailableRequestsQueryKey(), enabled: isTrainStaff },
  });

  const loading = tab === "mine" ? myLoading : availableLoading;
  const requests = ((tab === "mine" ? myData?.requests : availableData?.requests) ?? []) as RequestItem[];

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesStatus = filter === "all" || request.status === filter;
      const matchesService = serviceFilter === "all" || request.serviceType === serviceFilter;
      const haystack = [
        request.consignmentId,
        request.bookingReference,
        request.originStation,
        request.destinationStation,
        request.expectedUnloadStation,
        request.trainReference,
        request.cargoCategory,
        request.receiverName,
        request.customer?.name,
        request.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      return matchesStatus && matchesService && matchesQuery;
    });
  }, [filter, query, requests, serviceFilter]);

  const summary = useMemo(() => {
    return {
      total: requests.length,
      active: requests.filter((request) => ["accepted", "in_progress"].includes(request.status)).length,
      requested: requests.filter((request) => request.status === "requested").length,
      completed: requests.filter((request) => request.status === "completed").length,
    };
  }, [requests]);

  const header = useMemo(() => {
    switch (user?.role) {
      case "shipper":
        return {
          badge: "Shipper queue",
          title: "Manage the cargo records you have posted without losing station-level context.",
          body: "Search consignments by route, train, receiver, or booking reference so the story stays organized when a handoff becomes stressful.",
        };
      case "receiver":
        return {
          badge: "Receiver queue",
          title: "Watch incoming cargo by unload station, train, and status.",
          body: "This queue gives receivers the same cargo truth the shipper and train staff are working from.",
        };
      case "railway_monitor":
        return {
          badge: "Monitor queue",
          title: "See the visible network of consignments before disputes become opaque.",
          body: "A monitor should be able to sort by status, route, and train reference without waiting for a complaint to escalate.",
        };
      case "train_staff":
        return {
          badge: "Train staff queue",
          title: tab === "available" ? "Pick up clear consignments with known unload expectations." : "Manage the cargo already assigned to your custody.",
          body: tab === "available"
            ? "Browse unassigned cargo records with shipper, receiver, train, and price context before accepting custody."
            : "Use this queue to revisit accepted consignments and keep your route history organized.",
        };
      default:
        return {
          badge: `${getRoleLabel(user?.role ?? "shipper")} queue`,
          title: "Consignments",
          body: "",
        };
    }
  }, [tab, user?.role]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_24%),rgba(15,23,42,0.92)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              {header.badge}
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">{header.title}</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">{header.body}</p>
          </div>

          {isShipper ? (
            <Link href="/requests/new">
              <button
                data-testid="button-new-request"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                <Plus className="h-4 w-4" />
                New Consignment
              </button>
            </Link>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-slate-500">Total</div>
            <div className="mt-2 text-2xl font-semibold text-white">{summary.total}</div>
          </div>
          <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-4">
            <div className="text-xs text-cyan-100">Active</div>
            <div className="mt-2 text-2xl font-semibold text-white">{summary.active}</div>
          </div>
          <div className="rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4">
            <div className="text-xs text-amber-100">{isTrainStaff ? "Awaiting action" : "Requested"}</div>
            <div className="mt-2 text-2xl font-semibold text-white">{summary.requested}</div>
          </div>
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4">
            <div className="text-xs text-emerald-100">Completed</div>
            <div className="mt-2 text-2xl font-semibold text-white">{summary.completed}</div>
          </div>
        </div>
      </section>

      {isTrainStaff ? (
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTab("available")}
              data-testid="tab-available"
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                tab === "available" ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              Unassigned cargo
            </button>
            <button
              onClick={() => setTab("mine")}
              data-testid="tab-mine"
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                tab === "mine" ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              My custody queue
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto] xl:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search consignment, station, receiver, train, or booking reference"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              ["all", "All"],
              ["requested", "Requested"],
              ["accepted", "Accepted"],
              ["in_progress", "In Progress"],
              ["completed", "Completed"],
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

          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <select
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value as typeof serviceFilter)}
              className="bg-transparent text-sm text-white outline-none"
            >
              <option value="all">All cargo modes</option>
              <option value="delivery">Parcel cargo</option>
              <option value="transport">Bulk cargo</option>
              <option value="logistics">High-accountability cargo</option>
            </select>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-slate-700" />
          <p className="mb-1 font-medium text-white">
            {requests.length === 0
              ? tab === "available"
                ? "No unassigned consignments right now"
                : "No consignments yet"
              : "No consignments match this view"}
          </p>
          <p className="text-sm text-slate-500">
            {requests.length === 0
              ? tab === "available"
                ? "Check back soon for new cargo waiting for onboard custody."
                : "This portal does not have any matching cargo records yet."
              : "Try a different search or filter to find the consignment you need."}
          </p>
          {isShipper && requests.length === 0 ? (
            <Link href="/requests/new">
              <button className="mt-4 rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                Create consignment
              </button>
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredRequests.map((request) => (
            <RequestCard key={request.id} request={request} showAccept={tab === "available" && isTrainStaff} />
          ))}
        </div>
      )}
    </div>
  );
}
