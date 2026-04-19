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
import { formatCurrency } from "@/lib/utils";
import { Calculator, MapPin, ArrowRight } from "lucide-react";

const schema = z.object({
  pickupLocation: z.string().min(3, "Pickup location required"),
  dropLocation: z.string().min(3, "Drop location required"),
  description: z.string().min(5, "Description required"),
  serviceType: z.enum(["delivery", "transport", "logistics"]),
  distanceKm: z.coerce.number().min(0.1, "Distance required").optional(),
  offeredPrice: z.coerce.number().min(1).optional(),
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
      pickupLocation: "",
      dropLocation: "",
      description: "",
      serviceType: "delivery",
      distanceKm: undefined,
      offeredPrice: undefined,
    },
  });

  function handleEstimate() {
    const { pickupLocation, dropLocation, distanceKm, serviceType } = form.getValues();
    if (!pickupLocation || !dropLocation || !distanceKm || !serviceType) {
      toast({ variant: "destructive", title: "Fill required fields first" });
      return;
    }
    estimatePrice.mutate({ data: { pickupLocation, dropLocation, distanceKm, serviceType } }, {
      onSuccess: (est) => {
        setEstimate(est as PriceEstimate);
        form.setValue("offeredPrice", (est as PriceEstimate).total);
      },
      onError: () => toast({ variant: "destructive", title: "Failed to estimate price" }),
    });
  }

  function onSubmit(data: FormData) {
    createRequest.mutate({
      data: {
        pickupLocation: data.pickupLocation,
        dropLocation: data.dropLocation,
        description: data.description,
        serviceType: data.serviceType,
        distanceKm: data.distanceKm ?? null,
        offeredPrice: data.offeredPrice ?? (estimate?.total ?? null),
      },
    }, {
      onSuccess: (r) => {
        toast({ title: "Request created", description: "Providers can now accept your job." });
        qc.invalidateQueries({ queryKey: getListRequestsQueryKey() });
        setLocation(`/requests/${(r as { id: number }).id}`);
      },
      onError: (err: unknown) => {
        const msg = (err as { data?: { error?: string } })?.data?.error ?? "Failed to create request";
        toast({ variant: "destructive", title: "Error", description: msg });
      },
    });
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white font-bold text-2xl">New Request</h1>
        <p className="text-slate-400 text-sm mt-0.5">Create a service request and get fair pricing</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-white font-semibold text-sm">Route Details</h2>

            <FormField
              control={form.control}
              name="pickupLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 text-sm">Pickup Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                      <Input {...field} placeholder="e.g. Connaught Place, Delhi" data-testid="input-pickup"
                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500" />
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
                  <FormLabel className="text-slate-300 text-sm">Drop Location</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                      <Input {...field} placeholder="e.g. Lajpat Nagar, Delhi" data-testid="input-drop"
                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="serviceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 text-sm">Service Type</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-service-type" className="bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="delivery" className="text-white">Delivery</SelectItem>
                          <SelectItem value="transport" className="text-white">Transport</SelectItem>
                          <SelectItem value="logistics" className="text-white">Logistics</SelectItem>
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
                    <FormLabel className="text-slate-300 text-sm">Distance (km)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.1" placeholder="e.g. 5.5" data-testid="input-distance"
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500" />
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
                  <FormLabel className="text-slate-300 text-sm">Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Describe what needs to be delivered or transported..." data-testid="input-description"
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500 resize-none" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm">Smart Pricing</h2>
              <button
                type="button"
                onClick={handleEstimate}
                disabled={estimatePrice.isPending}
                data-testid="button-estimate"
                className="flex items-center gap-2 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 px-3 py-1.5 rounded-lg font-medium transition-colors border border-indigo-600/30"
              >
                <Calculator className="w-3.5 h-3.5" />
                {estimatePrice.isPending ? "Calculating..." : "Get Estimate"}
              </button>
            </div>

            {estimate && (
              <div className="mb-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <div className="space-y-2 mb-3">
                  {estimate.breakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="text-slate-300">{formatCurrency(item.amount)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-700">
                  <span className="text-white font-semibold">Total</span>
                  <span className="text-indigo-400 font-bold text-lg">{formatCurrency(estimate.total)}</span>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="offeredPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 text-sm">Your Offered Price (₹)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="Enter price or use estimate" data-testid="input-price"
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-600 focus:border-indigo-500" />
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
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium h-11"
          >
            {createRequest.isPending ? "Creating..." : "Post Request"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
