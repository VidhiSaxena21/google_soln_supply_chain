import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListDisputes, useCreateDispute, getListDisputesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import { AlertTriangle, Plus, X } from "lucide-react";

export default function DisputesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [location] = useLocation();
  const urlParams = new URLSearchParams(location.split("?")[1] ?? "");
  const prefillRequestId = urlParams.get("requestId");

  const [showForm, setShowForm] = useState(!!prefillRequestId);
  const [requestId, setRequestId] = useState(prefillRequestId ?? "");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading } = useListDisputes({ query: { queryKey: getListDisputesQueryKey() } });
  const createDispute = useCreateDispute();

  const disputes = (data?.disputes ?? []) as {
    id: number; requestId: number; reason: string; description: string; status: string; createdAt: string;
  }[];

  function handleSubmit() {
    if (!requestId || !reason || !description) {
      toast({ variant: "destructive", title: "Fill all fields" });
      return;
    }
    createDispute.mutate({ data: { requestId: parseInt(requestId, 10), reason, description } }, {
      onSuccess: () => {
        toast({ title: "Dispute raised", description: "We will review it shortly." });
        qc.invalidateQueries({ queryKey: getListDisputesQueryKey() });
        setShowForm(false);
        setRequestId(""); setReason(""); setDescription("");
      },
      onError: () => toast({ variant: "destructive", title: "Failed to raise dispute" }),
    });
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white font-bold text-2xl">Disputes</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your complaints and disputes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          data-testid="button-new-dispute"
          className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-red-600/30"
        >
          <Plus className="w-4 h-4" />
          Raise Dispute
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-red-900/50 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">New Dispute</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-slate-300 text-sm block mb-1">Request ID</label>
              <input
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
                type="number"
                placeholder="Enter request ID"
                data-testid="input-request-id"
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm block mb-1">Reason</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Overcharging, Item damaged, No-show..."
                data-testid="input-reason"
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="text-slate-300 text-sm block mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue in detail..."
                data-testid="input-description"
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 resize-none"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={createDispute.isPending}
              data-testid="button-submit-dispute"
              className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {createDispute.isPending ? "Submitting..." : "Submit Dispute"}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : disputes.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-slate-700 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No disputes</p>
          <p className="text-slate-500 text-sm">You have no disputes. We hope it stays that way!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((d) => (
            <Link key={d.id} href={`/disputes/${d.id}`}>
              <div data-testid={`card-dispute-${d.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 cursor-pointer transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-white font-medium text-sm">Request #{d.requestId}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(d.status)}`}>
                    {getStatusLabel(d.status)}
                  </span>
                </div>
                <div className="text-slate-300 text-sm font-medium mb-1">{d.reason}</div>
                <p className="text-slate-500 text-xs line-clamp-2">{d.description}</p>
                <div className="text-slate-600 text-xs mt-2">{formatDateTime(d.createdAt)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
