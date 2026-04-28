import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useCreateDispute, useListDisputes, getListDisputesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import { AlertTriangle, Plus, Search, X } from "lucide-react";

const disputeTemplates = [
  "Unofficial unloading demand",
  "Cargo diverted toward wrong station",
  "Cargo marked missing after refusal to pay",
  "Receiver not informed before unload",
  "Damage or seal mismatch at handoff",
  "Delay beyond agreed unload plan",
];

type DisputeFilter = "all" | "open" | "under_review" | "resolved";

export default function DisputesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split("?")[1] ?? "");
  const prefillRequestId = urlParams.get("requestId");

  const [showForm, setShowForm] = useState(Boolean(prefillRequestId));
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DisputeFilter>("all");
  const [requestId, setRequestId] = useState(prefillRequestId ?? "");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading } = useListDisputes({ query: { queryKey: getListDisputesQueryKey() } });
  const createDispute = useCreateDispute();

  const disputes = (data?.disputes ?? []) as {
    id: number;
    requestId: number;
    reason: string;
    description: string;
    status: string;
    createdAt: string;
  }[];

  const summary = useMemo(() => ({
    total: disputes.length,
    open: disputes.filter((dispute) => dispute.status === "open").length,
    inReview: disputes.filter((dispute) => dispute.status === "under_review").length,
    resolved: disputes.filter((dispute) => dispute.status === "resolved" || dispute.status === "closed").length,
  }), [disputes]);

  const filteredDisputes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return disputes.filter((dispute) => {
      const matchesFilter = filter === "all" || dispute.status === filter || (filter === "resolved" && dispute.status === "closed");
      const haystack = `${dispute.requestId} ${dispute.reason} ${dispute.description}`.toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [disputes, filter, query]);

  function resetForm() {
    setShowForm(false);
    setRequestId("");
    setReason("");
    setDescription("");
  }

  function handleSubmit() {
    if (!requestId || !reason || !description) {
      toast({ variant: "destructive", title: "Fill all fields" });
      return;
    }

    createDispute.mutate(
      { data: { requestId: parseInt(requestId, 10), reason, description } },
      {
        onSuccess: () => {
          toast({ title: "Dispute raised", description: "This issue is now attached to the cargo record." });
          qc.invalidateQueries({ queryKey: getListDisputesQueryKey() });
          resetForm();
        },
        onError: () => toast({ variant: "destructive", title: "Failed to raise dispute" }),
      },
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.14),transparent_24%),rgba(15,23,42,0.92)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-100">
              Dispute support
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">When a rail handoff turns coercive or unclear, make the issue reviewable.</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              A dispute should capture the request, the failure mode, and the impact while the route details and checkpoint evidence are still fresh.
            </p>
          </div>

          <button
            onClick={() => setShowForm(true)}
            data-testid="button-new-dispute"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/15"
          >
            <Plus className="h-4 w-4" />
            Raise dispute
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-slate-500">Total</div>
            <div className="mt-2 text-2xl font-semibold text-white">{summary.total}</div>
          </div>
          <div className="rounded-2xl border border-rose-400/15 bg-rose-400/10 p-4">
            <div className="text-xs text-rose-100">Open</div>
            <div className="mt-2 text-2xl font-semibold text-white">{summary.open}</div>
          </div>
          <div className="rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4">
            <div className="text-xs text-amber-100">In review</div>
            <div className="mt-2 text-2xl font-semibold text-white">{summary.inReview}</div>
          </div>
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4">
            <div className="text-xs text-emerald-100">Resolved</div>
            <div className="mt-2 text-2xl font-semibold text-white">{summary.resolved}</div>
          </div>
        </div>
      </section>

      {showForm ? (
        <section className="rounded-[28px] border border-rose-400/20 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">New dispute</h2>
              <p className="mt-1 text-xs text-slate-500">Anchor the issue to a consignment, the failure mode, and the real impact.</p>
            </div>
            <button onClick={resetForm} className="text-slate-500 transition hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-300">Request ID</label>
              <input
                value={requestId}
                onChange={(event) => setRequestId(event.target.value)}
                type="number"
                placeholder="Enter request ID"
                data-testid="input-request-id"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-3 text-sm text-white placeholder:text-slate-600 focus:border-rose-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-300">Reason</label>
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Summarize the core problem"
                data-testid="input-reason"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-3 text-sm text-white placeholder:text-slate-600 focus:border-rose-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {disputeTemplates.map((template) => (
              <button
                key={template}
                onClick={() => setReason(template)}
                className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 transition hover:border-rose-400/20 hover:text-white"
              >
                {template}
              </button>
            ))}
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-sm text-slate-300">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe what happened, where the consignment was supposed to unload, what extra demand or failure occurred, and what review you need."
              data-testid="input-description"
              rows={4}
              className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-3 text-sm text-white placeholder:text-slate-600 focus:border-rose-400 focus:outline-none"
            />
            <div className="mt-2 text-right text-xs text-slate-500">{description.length} characters</div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={createDispute.isPending}
            data-testid="button-submit-dispute"
            className="mt-4 w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-50"
          >
            {createDispute.isPending ? "Submitting..." : "Submit dispute"}
          </button>
        </section>
      ) : null}

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by request, reason, or dispute description"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              ["all", "All"],
              ["open", "Open"],
              ["under_review", "In review"],
              ["resolved", "Resolved"],
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
        </div>
      </section>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-12 text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-slate-700" />
          <p className="mb-1 font-medium text-white">{disputes.length === 0 ? "No disputes" : "No disputes match this view"}</p>
          <p className="text-sm text-slate-500">
            {disputes.length === 0
              ? "No cargo disputes are visible in this portal right now."
              : "Try a different search or filter to find the dispute you need."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredDisputes.map((dispute) => (
            <Link key={dispute.id} href={`/disputes/${dispute.id}`}>
              <div
                data-testid={`card-dispute-${dispute.id}`}
                className="cursor-pointer rounded-[28px] border border-white/10 bg-white/5 p-5 transition hover:border-rose-400/20 hover:bg-white/7"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-300" />
                      <span className="text-sm font-medium text-white">Request #{dispute.requestId}</span>
                    </div>
                    <p className="text-xs text-slate-500">{formatDateTime(dispute.createdAt)}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs ${getStatusColor(dispute.status)}`}>
                    {getStatusLabel(dispute.status)}
                  </span>
                </div>
                <div className="text-base font-semibold text-white">{dispute.reason}</div>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{dispute.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
