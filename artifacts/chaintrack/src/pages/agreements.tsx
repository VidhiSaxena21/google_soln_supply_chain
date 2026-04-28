import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useListAgreements, getListAgreementsQueryKey } from "@workspace/api-client-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { FileText, Search, ShieldCheck, TrainFront } from "lucide-react";

type AgreementFilter = "all" | "pending" | "executed";

export default function AgreementsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AgreementFilter>("all");

  const { data, isLoading } = useListAgreements({ query: { queryKey: getListAgreementsQueryKey() } });
  const agreements = (data?.agreements ?? []) as {
    id: number;
    requestId: number;
    agreedPrice: number;
    customerSigned: boolean;
    providerSigned: boolean;
    fullyExecuted: boolean;
    terms: string;
    createdAt: string;
  }[];

  const summary = useMemo(() => {
    const executed = agreements.filter((agreement) => agreement.fullyExecuted).length;
    const pending = agreements.length - executed;
    return { executed, pending, total: agreements.length };
  }, [agreements]);

  const filteredAgreements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return agreements.filter((agreement) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "executed" && agreement.fullyExecuted) ||
        (filter === "pending" && !agreement.fullyExecuted);

      const haystack = [agreement.requestId.toString(), agreement.terms, agreement.agreedPrice.toString()].join(" ").toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [agreements, filter, query]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_24%),rgba(15,23,42,0.92)] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              Agreement workspace
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">Keep the unload expectation visible after custody is accepted.</h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
              These agreements turn a cargo record into a shared commitment: route, price, and proof of which sides have formally signed into the handoff.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-slate-400">Total</div>
              <div className="mt-2 text-2xl font-semibold text-white">{summary.total}</div>
            </div>
            <div className="rounded-2xl border border-amber-400/15 bg-amber-400/10 p-4">
              <div className="text-amber-100">Pending</div>
              <div className="mt-2 text-2xl font-semibold text-white">{summary.pending}</div>
            </div>
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4">
              <div className="text-emerald-100">Executed</div>
              <div className="mt-2 text-2xl font-semibold text-white">{summary.executed}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by request ID, agreement text, or amount"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              ["all", "All"],
              ["pending", "Pending"],
              ["executed", "Executed"],
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
      ) : filteredAgreements.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-700" />
          <p className="mb-1 font-medium text-white">{agreements.length === 0 ? "No agreements yet" : "No agreements match this view"}</p>
          <p className="text-sm text-slate-500">
            {agreements.length === 0
              ? "Agreements are generated once train staff accepts custody of a consignment."
              : "Try a different search or filter to find the agreement you need."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredAgreements.map((agreement) => {
            const signatureCount = Number(agreement.customerSigned) + Number(agreement.providerSigned);

            return (
              <Link key={agreement.id} href={`/requests/${agreement.requestId}`}>
                <div
                  data-testid={`card-agreement-${agreement.id}`}
                  className="cursor-pointer rounded-[28px] border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/20 hover:bg-white/7"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <TrainFront className="h-4 w-4 text-cyan-300" />
                        <span className="text-sm font-medium text-white">Agreement for Request #{agreement.requestId}</span>
                      </div>
                      <p className="text-xs text-slate-500">{formatDateTime(agreement.createdAt)}</p>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs ${
                        agreement.fullyExecuted
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                          : "border-amber-400/20 bg-amber-400/10 text-amber-200"
                      }`}
                    >
                      {agreement.fullyExecuted ? "Executed" : "Awaiting signatures"}
                    </span>
                  </div>

                  <p className="line-clamp-3 text-sm leading-6 text-slate-400">{agreement.terms}</p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-xs text-slate-500">Agreed amount</div>
                      <div className="mt-2 text-lg font-semibold text-white">{formatCurrency(agreement.agreedPrice)}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-xs text-slate-500">Signed parties</div>
                      <div className="mt-2 text-lg font-semibold text-white">{signatureCount}/2</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-xs text-slate-500">Trust state</div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-white">
                        <ShieldCheck className="h-4 w-4 text-cyan-300" />
                        {agreement.fullyExecuted ? "Locked in" : "In progress"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3 text-xs">
                    <span className={agreement.customerSigned ? "text-emerald-300" : "text-slate-500"}>
                      {agreement.customerSigned ? "Signed" : "Pending"} shipper
                    </span>
                    <span className={agreement.providerSigned ? "text-emerald-300" : "text-slate-500"}>
                      {agreement.providerSigned ? "Signed" : "Pending"} train staff
                    </span>
                    <span className="text-slate-500">
                      {agreement.fullyExecuted ? "Ready for monitored movement" : "Needs both sides to finalize"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
