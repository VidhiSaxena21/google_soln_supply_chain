import { useParams, Link } from "wouter";
import { useGetTracking, useGetRequest, getGetTrackingQueryKey, getGetRequestQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useAddTrackingUpdate } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateTime, getStatusColor, getStatusLabel } from "@/lib/utils";
import { MapPin, Navigation, Clock, CheckCircle, Plus } from "lucide-react";

const statusSteps = ["requested", "accepted", "in_progress", "completed"];

export default function TrackingPage() {
  const params = useParams();
  const id = parseInt(params.id ?? "0", 10);
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: req } = useGetRequest(id, { query: { queryKey: getGetRequestQueryKey(id), enabled: !!id } });
  const { data: tracking, isLoading } = useGetTracking(id, { query: { queryKey: getGetTrackingQueryKey(id), enabled: !!id } });

  const addUpdate = useAddTrackingUpdate();
  const [message, setMessage] = useState("");

  const r = req as { status: string; pickupLocation: string; dropLocation: string; provider?: { id: number } | null } | undefined;
  const isProvider = user?.role === "provider" && r?.provider?.id === user?.id;

  const currentStep = statusSteps.indexOf(r?.status ?? "requested");

  function handleAddUpdate() {
    if (!message.trim()) return;
    addUpdate.mutate({ requestId: id, data: { status: r?.status ?? "in_progress", message } }, {
      onSuccess: () => {
        toast({ title: "Update added" });
        setMessage("");
        qc.invalidateQueries({ queryKey: getGetTrackingQueryKey(id) });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to add update" }),
    });
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Link href={`/requests/${id}`} className="text-slate-500 hover:text-slate-300 text-sm">Request #{id}</Link>
        <span className="text-slate-700">/</span>
        <span className="text-white text-sm">Tracking</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-indigo-400" />
            Live Tracking
          </h2>
          {r && (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-slate-300">{r.pickupLocation}</span>
              </div>
              <div className="text-slate-700">→</div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span className="text-slate-300">{r.dropLocation}</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="relative flex items-center justify-between mb-6">
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-800" />
            <div
              className="absolute left-0 top-4 h-0.5 bg-indigo-600 transition-all duration-500"
              style={{ width: `${currentStep === -1 ? 0 : (currentStep / (statusSteps.length - 1)) * 100}%` }}
            />
            {statusSteps.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              return (
                <div key={step} className="relative flex flex-col items-center gap-2 z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    done ? "bg-indigo-600 border-indigo-600" : "bg-slate-900 border-slate-700"
                  } ${active ? "ring-4 ring-indigo-600/30" : ""}`}>
                    {done ? <CheckCircle className="w-4 h-4 text-white" /> : <div className="w-2 h-2 rounded-full bg-slate-700" />}
                  </div>
                  <span className={`text-xs font-medium ${done ? "text-white" : "text-slate-600"}`}>
                    {getStatusLabel(step)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-2 mt-4">
            <div className={`w-2 h-2 rounded-full ${r?.status === "in_progress" ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
            <span className="text-slate-300 text-sm">
              {r?.status === "in_progress" ? "Your shipment is on the way" : r?.status === "completed" ? "Delivery completed" : "Waiting for provider"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Timeline
        </h3>

        {isLoading ? (
          <div className="text-slate-500 text-sm text-center py-4">Loading...</div>
        ) : (tracking?.updates?.length ?? 0) === 0 ? (
          <div className="text-slate-500 text-sm text-center py-4">No updates yet</div>
        ) : (
          <div className="space-y-3">
            {(tracking?.updates ?? []).map((upd) => {
              const u = upd as { id: number; status: string; message: string; createdAt: string };
              return (
                <div key={u.id} data-testid={`tracking-update-${u.id}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div className="w-0.5 flex-1 bg-slate-800 mt-1" />
                  </div>
                  <div className="pb-3 flex-1">
                    <div className="text-white text-sm font-medium">{u.message}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{formatDateTime(u.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isProvider && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-white font-semibold text-sm mb-3">Add Update</h3>
          <div className="flex gap-3">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Package picked up from origin..."
              data-testid="input-update"
              className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleAddUpdate}
              disabled={addUpdate.isPending || !message.trim()}
              data-testid="button-add-update"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
