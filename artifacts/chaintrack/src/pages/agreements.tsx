import { Link } from "wouter";
import { useListAgreements, getListAgreementsQueryKey } from "@workspace/api-client-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { FileText, CheckCircle, Clock } from "lucide-react";

export default function AgreementsPage() {
  const { data, isLoading } = useListAgreements({ query: { queryKey: getListAgreementsQueryKey() } });
  const agreements = (data?.agreements ?? []) as {
    id: number; requestId: number; agreedPrice: number; customerSigned: boolean;
    providerSigned: boolean; fullyExecuted: boolean; terms: string; createdAt: string;
  }[];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-white font-bold text-2xl">Agreements</h1>
        <p className="text-slate-400 text-sm mt-0.5">Your digital service agreements</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : agreements.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No agreements yet</p>
          <p className="text-slate-500 text-sm">Agreements are created when a provider accepts your request.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {agreements.map((agr) => (
            <Link key={agr.id} href={`/requests/${agr.requestId}`}>
              <div data-testid={`card-agreement-${agr.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 cursor-pointer transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span className="text-white font-medium text-sm">Agreement for Request #{agr.requestId}</span>
                  </div>
                  {agr.fullyExecuted ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-800/50">
                      <CheckCircle className="w-3 h-3" /> Executed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded-full border border-amber-800/50">
                      <Clock className="w-3 h-3" /> Pending Signatures
                    </span>
                  )}
                </div>

                <p className="text-slate-500 text-xs line-clamp-2 mb-3">{agr.terms}</p>

                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-xs">
                    <span className={agr.customerSigned ? "text-emerald-400" : "text-slate-600"}>
                      {agr.customerSigned ? "✓" : "○"} Customer
                    </span>
                    <span className={agr.providerSigned ? "text-emerald-400" : "text-slate-600"}>
                      {agr.providerSigned ? "✓" : "○"} Provider
                    </span>
                  </div>
                  <span className="text-indigo-400 font-semibold text-sm">{formatCurrency(agr.agreedPrice)}</span>
                </div>

                <div className="text-slate-600 text-xs mt-2">{formatDateTime(agr.createdAt)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
