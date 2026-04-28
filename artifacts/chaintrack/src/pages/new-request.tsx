import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCreateRequest, useEstimatePrice, getListRequestsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, getServiceTypeLabel } from "@/lib/utils";
import {
  Calculator,
  FileSignature,
  Landmark,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrainFront,
  UserRoundCheck,
  WalletCards,
} from "lucide-react";

const schema = z.object({
  consignmentId: z.string().min(3, "Consignment ID required"),
  bookingReference: z.string().min(3, "Booking reference required"),
  invoiceReference: z.string().optional(),
  cargoCategory: z.string().min(2, "Cargo category required"),
  declaredValue: z.coerce.number().min(1, "Declared value required").optional(),
  receiverName: z.string().min(2, "Receiver name required"),
  receiverPhone: z.string().min(6, "Receiver phone required"),
  receiverEmail: z.string().email("Valid receiver email required"),
  receiverBusiness: z.string().optional(),
  originStation: z.string().min(2, "Origin station required"),
  destinationStation: z.string().min(2, "Destination station required"),
  expectedUnloadStation: z.string().min(2, "Expected unload station required"),
  trainReference: z.string().min(2, "Train reference required"),
  coachOrWagon: z.string().optional(),
  pickupLocation: z.string().min(3, "Pickup location required"),
  dropLocation: z.string().min(3, "Drop location required"),
  description: z.string().min(10, "Description required"),
  riskNote: z.string().optional(),
  serviceType: z.enum(["delivery", "transport", "logistics"]),
  distanceKm: z.coerce.number().min(0.1, "Distance required").optional(),
  offeredPrice: z.coerce.number().min(1).optional(),
  scheduledAt: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface PriceEstimate {
  baseFare: number;
  distanceCharge: number;
  serviceFee: number;
  total: number;
  breakdown: { label: string; amount: number }[];
  distanceKm: number;
}

export default function NewRequestPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const createRequest = useCreateRequest();
  const estimatePrice = useEstimatePrice();
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      consignmentId: "",
      bookingReference: "",
      invoiceReference: "",
      cargoCategory: "",
      declaredValue: undefined,
      receiverName: "",
      receiverPhone: "",
      receiverEmail: "",
      receiverBusiness: "",
      originStation: "",
      destinationStation: "",
      expectedUnloadStation: "",
      trainReference: "",
      coachOrWagon: "",
      pickupLocation: "",
      dropLocation: "",
      description: "",
      riskNote: "",
      serviceType: "logistics",
      distanceKm: undefined,
      offeredPrice: undefined,
      scheduledAt: "",
    },
  });

  function handleEstimate() {
    const { pickupLocation, dropLocation, distanceKm, serviceType } = form.getValues();
    if (!pickupLocation || !dropLocation || !distanceKm || !serviceType) {
      toast({ variant: "destructive", title: "Fill route and distance first" });
      return;
    }

    estimatePrice.mutate(
      { data: { pickupLocation, dropLocation, distanceKm, serviceType } },
      {
        onSuccess: (est) => {
          setEstimate(est as PriceEstimate);
          form.setValue("offeredPrice", (est as PriceEstimate).total);
        },
        onError: () => toast({ variant: "destructive", title: "Failed to estimate price" }),
      },
    );
  }

  function onSubmit(data: FormData) {
    createRequest.mutate(
      {
        data: {
          consignmentId: data.consignmentId,
          bookingReference: data.bookingReference,
          invoiceReference: data.invoiceReference || null,
          cargoCategory: data.cargoCategory,
          declaredValue: data.declaredValue ?? null,
          receiverName: data.receiverName,
          receiverPhone: data.receiverPhone,
          receiverEmail: data.receiverEmail,
          receiverBusiness: data.receiverBusiness || null,
          originStation: data.originStation,
          destinationStation: data.destinationStation,
          expectedUnloadStation: data.expectedUnloadStation,
          trainReference: data.trainReference,
          coachOrWagon: data.coachOrWagon || null,
          pickupLocation: data.pickupLocation,
          dropLocation: data.dropLocation,
          description: data.description,
          riskNote: data.riskNote || null,
          serviceType: data.serviceType,
          distanceKm: data.distanceKm ?? null,
          offeredPrice: data.offeredPrice ?? estimate?.total ?? null,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : null,
        },
      },
      {
        onSuccess: (request) => {
          toast({
            title: "Consignment created",
            description: "Train staff, receivers, and monitors can now work from the same cargo record.",
          });
          qc.invalidateQueries({ queryKey: getListRequestsQueryKey() });
          setLocation(`/requests/${(request as { id: number }).id}`);
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to create consignment";
          toast({ variant: "destructive", title: "Error", description: msg });
        },
      },
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.14),transparent_20%),rgba(15,23,42,0.92)] p-6 sm:p-8">
        <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
          Create a railway cargo record
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
          Start the consignment with enough detail that diversion and pressure become harder to hide.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
          Add the booking reference, receiver, train, expected unload station, and risk notes. This creates the shared
          record that the shipper, receiver, train staff, and railway monitor will all rely on later.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <UserRoundCheck className="mb-3 h-5 w-5 text-cyan-300" />
            <div className="text-sm font-medium text-white">Receiver-ready</div>
            <p className="mt-2 text-sm leading-6 text-slate-400">The destination contact is visible before the unload point becomes disputed.</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <TrainFront className="mb-3 h-5 w-5 text-cyan-300" />
            <div className="text-sm font-medium text-white">Train-specific</div>
            <p className="mt-2 text-sm leading-6 text-slate-400">Train reference and expected station remain attached to the cargo timeline.</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <Calculator className="mb-3 h-5 w-5 text-cyan-300" />
            <div className="text-sm font-medium text-white">Transparent pricing</div>
            <p className="mt-2 text-sm leading-6 text-slate-400">Estimate a fair starting price before anyone asks for extra money later.</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <ShieldCheck className="mb-3 h-5 w-5 text-cyan-300" />
            <div className="text-sm font-medium text-white">Dispute-ready</div>
            <p className="mt-2 text-sm leading-6 text-slate-400">Risk notes and route proof help if the cargo is delayed, diverted, or held up.</p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 xl:grid-cols-[1.28fr_0.72fr]">
          <div className="space-y-5">
            <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-semibold text-white">Consignment identity</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="consignmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Consignment ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="CT-MUM-JAL-1042" data-testid="input-consignment-id" className="border-white/10 bg-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bookingReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Rail booking reference</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="IR-PCL-449103" data-testid="input-booking-reference" className="border-white/10 bg-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="invoiceReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Invoice reference</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="INV-2881" data-testid="input-invoice-reference" className="border-white/10 bg-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cargoCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Cargo category</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Textiles, footwear, spares..." data-testid="input-cargo-category" className="border-white/10 bg-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="declaredValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Declared value (INR)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <WalletCards className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          <Input {...field} type="number" placeholder="180000" data-testid="input-declared-value" className="border-white/10 bg-slate-800 pl-10 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-semibold text-white">Receiver and rail route</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="receiverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Receiver name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Gurpreet Singh" data-testid="input-receiver-name" className="border-white/10 bg-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receiverPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Receiver phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+91 9872203344" data-testid="input-receiver-phone" className="border-white/10 bg-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="receiverEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Receiver email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="receiver@example.com" data-testid="input-receiver-email" className="border-white/10 bg-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receiverBusiness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Receiver business</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Singh Cloth House" data-testid="input-receiver-business" className="border-white/10 bg-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="originStation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Origin station</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Landmark className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                          <Input {...field} placeholder="Mumbai Central" data-testid="input-origin-station" className="border-white/10 bg-slate-800 pl-10 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destinationStation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Destination station</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Landmark className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" />
                          <Input {...field} placeholder="Jalandhar City" data-testid="input-destination-station" className="border-white/10 bg-slate-800 pl-10 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expectedUnloadStation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Expected unload station</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Jalandhar City" data-testid="input-unload-station" className="border-white/10 bg-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="trainReference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Train reference</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <TrainFront className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          <Input {...field} placeholder="12925 Paschim Express" data-testid="input-train-reference" className="border-white/10 bg-slate-800 pl-10 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="coachOrWagon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Coach or wagon</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SLR-2 / Parcel Van 1" data-testid="input-coach-or-wagon" className="border-white/10 bg-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-semibold text-white">Ground handoff and risk notes</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="pickupLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Origin pickup point</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                          <Input {...field} placeholder="Kalbadevi warehouse, Mumbai" data-testid="input-pickup" className="border-white/10 bg-slate-800 pl-10 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dropLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Receiver delivery point</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-500" />
                          <Input {...field} placeholder="Focal Point market yard, Jalandhar" data-testid="input-drop" className="border-white/10 bg-slate-800 pl-10 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="serviceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Cargo mode</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-service-type" className="border-white/10 bg-slate-800 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-white/10 bg-slate-800">
                            <SelectItem value="delivery" className="text-white">Parcel cargo</SelectItem>
                            <SelectItem value="transport" className="text-white">Bulk cargo</SelectItem>
                            <SelectItem value="logistics" className="text-white">High-accountability cargo</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="distanceKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Distance (km)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.1" placeholder="1710" data-testid="input-distance" className="border-white/10 bg-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Scheduled handoff time</FormLabel>
                      <FormControl>
                        <Input {...field} type="datetime-local" data-testid="input-scheduled-at" className="border-white/10 bg-slate-800 text-white focus:border-cyan-400" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-slate-300">Cargo description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the cargo, sealing expectations, receiver checks, or special handling notes..."
                        data-testid="input-description"
                        className="resize-none border-white/10 bg-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-400"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="riskNote"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-slate-300">Risk note</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Document concerns such as unofficial unloading pressure, sensitivity, late-night arrival, or strict receiver verification..."
                        data-testid="input-risk-note"
                        className="resize-none border-white/10 bg-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-400"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              disabled={createRequest.isPending}
              data-testid="button-submit"
              className="h-11 w-full bg-cyan-400 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              {createRequest.isPending ? "Creating..." : "Create Consignment"}
            </Button>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-white">Smart pricing</h2>
                  <p className="mt-1 text-xs text-slate-500">Build a transparent starting point for the cargo leg.</p>
                </div>
                <button
                  type="button"
                  onClick={handleEstimate}
                  disabled={estimatePrice.isPending}
                  data-testid="button-estimate"
                  className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-200 transition-colors hover:bg-cyan-400/15"
                >
                  <Calculator className="h-3.5 w-3.5" />
                  {estimatePrice.isPending ? "Calculating..." : "Get Estimate"}
                </button>
              </div>

              {estimate ? (
                <div className="mb-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-cyan-100">
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                    Recommended breakdown
                  </div>
                  <div className="mb-3 space-y-2">
                    {estimate.breakdown.map((item, index) => (
                      <div key={`${item.label}-${index}`} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{item.label}</span>
                        <span className="text-slate-300">{formatCurrency(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="font-semibold text-white">Total</span>
                    <span className="text-lg font-bold text-cyan-300">{formatCurrency(estimate.total)}</span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 rounded-2xl border border-dashed border-white/10 bg-slate-950/30 p-4 text-sm leading-6 text-slate-400">
                  Add the route, service mode, and distance to generate a fair price anchor before this cargo is posted.
                </div>
              )}

              <FormField
                control={form.control}
                name="offeredPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm text-slate-300">Your offered price (INR)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="Use estimate or enter manually" data-testid="input-price" className="border-white/10 bg-slate-800 text-white placeholder:text-slate-600 focus:border-cyan-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-semibold text-white">Useful checkpoints</h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <FileSignature className="h-4 w-4 text-cyan-300" />
                    Agreement quality
                  </div>
                  <p className="text-sm leading-6 text-slate-400">
                    The train staff agreement will reuse this route, price, and unload expectation, so specific inputs matter.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <ShieldCheck className="h-4 w-4 text-cyan-300" />
                    Risk framing
                  </div>
                  <p className="text-sm leading-6 text-slate-400">
                    Mention if the receiver has already faced unloading pressure or if the cargo is sensitive to delay or rerouting.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                    <Landmark className="h-4 w-4 text-cyan-300" />
                    Station accuracy
                  </div>
                  <p className="text-sm leading-6 text-slate-400">
                    Keep destination station and expected unload station exact. That is the heart of the anti-diversion story.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-amber-400/20 bg-amber-400/10 p-5">
              <div className="text-sm font-semibold text-amber-100">Selected mode</div>
              <div className="mt-2 text-base font-semibold text-white">
                {getServiceTypeLabel(form.watch("serviceType"))}
              </div>
              <p className="mt-2 text-sm leading-6 text-amber-50/90">
                Choose the service mode that best matches the scrutiny and handling complexity of this consignment.
              </p>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
