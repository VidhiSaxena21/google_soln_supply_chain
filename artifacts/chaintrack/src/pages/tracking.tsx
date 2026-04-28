import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { useAddTrackingUpdate, useGetRequest, useGetTracking, getGetRequestQueryKey, getGetTrackingQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime, getStatusLabel } from "@/lib/utils";
import { CheckCircle, Clock, Landmark, Navigation, Route, Send, Signal, TrainFront } from "lucide-react";

const statusSteps = ["requested", "accepted", "in_progress", "completed"];
const quickTemplates = [
  "Loaded at origin parcel office and seal count verified.",
  "Reached checkpoint without diversion or off-record payment demand.",
  "Receiver has been alerted for expected unload station handoff.",
  "Unload completed at the assigned station and custody closed cleanly.",
];

export default function TrackingPage() {
  const params = useParams();
  const id = parseInt(params.id ?? "0", 10);
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: request } = useGetRequest(id, {
    query: { queryKey: getGetRequestQueryKey(id), enabled: !!id },
  });
  const { data: tracking, isLoading } = useGetTracking(id, {
    query: { queryKey: getGetTrackingQueryKey(id), enabled: !!id },
  });

  const addUpdate = useAddTrackingUpdate();
  const [message, setMessage] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const currentRequest = request as {
    status: string;
    consignmentId?: string | null;
    originStation?: string | null;
    expectedUnloadStation?: string | null;
    trainReference?: string | null;
    pickupLocation: string;
    dropLocation: string;
    distanceKm?: number | null;
    provider?: { id: number } | null;
  } | undefined;

  const updates = (tracking?.updates ?? []) as {
    id: number;
    status: string;
    message: string;
    createdAt: string;
    lat?: number | null;
    lng?: number | null;
  }[];

  const latestUpdate = updates.at(-1);
  const isTrainStaff = user?.role === "train_staff" && currentRequest?.provider?.id === user?.id;
  const currentStep = statusSteps.indexOf(currentRequest?.status ?? "requested");
  const progress = currentStep === -1 ? 0 : (currentStep / (statusSteps.length - 1)) * 100;

  const journeyState = useMemo(() => {
    switch (currentRequest?.status) {
      case "requested":
        return {
          title: "Waiting for onboard custody",
          body: "The consignment exists, but no train staff member has accepted responsibility yet.",
        };
      case "accepted":
        return {
          title: "Accepted for custody",
          body: "Train staff is assigned. This is the moment to keep route expectations and receiver timing visible.",
        };
      case "in_progress":
        return {
          title: "Moving through the rail corridor",
          body: "Checkpoint updates make it harder for delay, diversion, or unofficial unload pressure to stay hidden.",
        };
      case "completed":
        return {
          title: "Unload completed",
          body: "The consignment is marked complete, but the timeline remains as proof of what happened and where.",
        };
      default:
        return {
          title: "Tracking unavailable",
          body: "This cargo record is missing a recognized status.",
        };
    }
  }, [currentRequest?.status]);

  function handleAddUpdate() {
    if (!message.trim()) return;

    const parsedLat = lat.trim() ? Number(lat) : undefined;
    const parsedLng = lng.trim() ? Number(lng) : undefined;
    if ((lat.trim() && Number.isNaN(parsedLat)) || (lng.trim() && Number.isNaN(parsedLng))) {
      toast({ variant: "destructive", title: "Latitude and longitude must be valid numbers" });
      return;
    }

    addUpdate.mutate(
      {
        requestId: id,
        data: {
          status: currentRequest?.status ?? "in_progress",
          message,
          lat: parsedLat,
          lng: parsedLng,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Checkpoint added" });
          setMessage("");
          setLat("");
          setLng("");
          qc.invalidateQueries({ queryKey: getGetTrackingQueryKey(id) });
        },
        onError: () => toast({ variant: "destructive", title: "Failed to add checkpoint" }),
      },
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Link href={`/requests/${id}`} className="text-sm text-slate-500 hover:text-slate-300">
          {currentRequest?.consignmentId ?? `Request #${id}`}
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-sm text-white">Tracking</span>
      </div>

      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_24%),rgba(15,23,42,0.92)] p-6 sm:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              Rail cargo timeline
            </div>
            <h1 className="text-3xl font-semibold text-white sm:text-4xl">{journeyState.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{journeyState.body}</p>

            {currentRequest ? (
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <Landmark className="h-4 w-4 text-emerald-400" />
                  {currentRequest.originStation ?? currentRequest.pickupLocation}
                </div>
                <div className="text-slate-600">to</div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                  <Landmark className="h-4 w-4 text-rose-400" />
                  {currentRequest.expectedUnloadStation ?? currentRequest.dropLocation}
                </div>
                {currentRequest.trainReference ? (
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
                    <TrainFront className="h-4 w-4 text-cyan-300" />
                    {currentRequest.trainReference}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-slate-500">Current status</div>
              <div className="mt-2 text-lg font-semibold text-white">{getStatusLabel(currentRequest?.status ?? "requested")}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-slate-500">Checkpoints logged</div>
              <div className="mt-2 text-lg font-semibold text-white">{updates.length}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-slate-500">Latest coordinates</div>
              <div className="mt-2 text-sm font-semibold text-white">
                {latestUpdate?.lat != null && latestUpdate?.lng != null ? `${latestUpdate.lat}, ${latestUpdate.lng}` : "No coordinates yet"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="relative mb-6 flex items-center justify-between">
          <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-800" />
          <div className="absolute left-0 top-4 h-0.5 bg-cyan-400 transition-all duration-500" style={{ width: `${progress}%` }} />
          {statusSteps.map((step, index) => {
            const done = index <= currentStep;
            const active = index === currentStep;
            return (
              <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                    done ? "border-cyan-400 bg-cyan-400 text-slate-950" : "border-slate-700 bg-slate-900"
                  } ${active ? "ring-4 ring-cyan-400/20" : ""}`}
                >
                  {done ? <CheckCircle className="h-4 w-4" /> : <div className="h-2 w-2 rounded-full bg-slate-700" />}
                </div>
                <span className={`text-xs font-medium ${done ? "text-white" : "text-slate-600"}`}>{getStatusLabel(step)}</span>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
          {currentRequest?.status === "in_progress"
            ? "Every checkpoint here strengthens the case against later claims that the cargo was lost, delayed without explanation, or shifted to the wrong station."
            : currentRequest?.status === "completed"
              ? "This recorded path remains available after completion so the unload proof does not disappear."
              : "Tracking becomes most valuable once the onboard staff starts posting checkpoints."}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Clock className="h-4 w-4 text-slate-400" />
            Timeline
          </h2>

          {isLoading ? (
            <div className="py-6 text-center text-sm text-slate-500">Loading checkpoints...</div>
          ) : updates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-6 text-center text-sm text-slate-500">
              No checkpoints have been posted yet.
            </div>
          ) : (
            <div className="space-y-3">
              {updates.map((update, index) => (
                <div key={update.id} data-testid={`tracking-update-${update.id}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                    {index < updates.length - 1 ? <div className="mt-1 w-0.5 flex-1 bg-slate-800" /> : null}
                  </div>
                  <div className="flex-1 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium text-white">{update.message}</div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-400">
                        {getStatusLabel(update.status)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">{formatDateTime(update.createdAt)}</div>
                    {update.lat != null && update.lng != null ? (
                      <div className="mt-3 flex items-center gap-2 text-xs text-cyan-200">
                        <Signal className="h-3.5 w-3.5" />
                        Coordinates: {update.lat}, {update.lng}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Route className="h-4 w-4 text-cyan-300" />
              Latest checkpoint
            </h2>
            {latestUpdate ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="text-sm font-medium text-white">{latestUpdate.message}</div>
                  <div className="mt-2 text-xs text-slate-500">{formatDateTime(latestUpdate.createdAt)}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="text-xs text-slate-500">Latitude</div>
                    <div className="mt-2 text-sm text-white">{latestUpdate.lat ?? "Not shared"}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                    <div className="text-xs text-slate-500">Longitude</div>
                    <div className="mt-2 text-sm text-white">{latestUpdate.lng ?? "Not shared"}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-6 text-sm text-slate-500">
                No checkpoint has been posted yet.
              </div>
            )}
          </section>

          {isTrainStaff ? (
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">Post a checkpoint</h2>
              <div className="mb-3 flex flex-wrap gap-2">
                {quickTemplates.map((template) => (
                  <button
                    key={template}
                    onClick={() => setMessage(template)}
                    className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-400/20 hover:text-white"
                  >
                    Use template
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Describe the latest checkpoint, station arrival, or custody note..."
                  data-testid="input-update"
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/70 p-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={lat}
                    onChange={(event) => setLat(event.target.value)}
                    placeholder="Latitude (optional)"
                    className="rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                  <input
                    value={lng}
                    onChange={(event) => setLng(event.target.value)}
                    placeholder="Longitude (optional)"
                    className="rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <button
                  onClick={handleAddUpdate}
                  disabled={addUpdate.isPending || !message.trim()}
                  data-testid="button-add-update"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {addUpdate.isPending ? "Posting checkpoint..." : "Add checkpoint"}
                </button>
              </div>
            </section>
          ) : (
            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">Why this matters</h2>
              <div className="space-y-3 text-sm leading-6 text-slate-400">
                <p>Receivers can see if the route is staying honest before unload time.</p>
                <p>Shippers keep evidence that the cargo was actually moving through the intended corridor.</p>
                <p>Railway monitors can compare disputes against checkpoint history instead of treating every complaint as unstructured hearsay.</p>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
