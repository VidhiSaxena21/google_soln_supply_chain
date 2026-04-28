import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSignature, Lock, Mail, MapPin, Phone, Radar, ShieldCheck, TrainFront, User } from "lucide-react";

const onboardingNotes = [
  {
    icon: ShieldCheck,
    title: "Safer railway cargo workflows",
    body: "Replace fragmented calls and pressure-driven handoffs with a shared consignment record.",
  },
  {
    icon: FileSignature,
    title: "Clear station accountability",
    body: "Expected unload points, agreements, and checkpoints stay visible across all relevant portals.",
  },
  {
    icon: Radar,
    title: "Stronger small-business protection",
    body: "When a route is threatened by diversion or unofficial payments, the dispute trail is already in place.",
  },
];

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["shipper", "receiver", "railway_monitor", "train_staff"]),
  phone: z.string().optional(),
  vehicleType: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", role: "shipper", phone: "", vehicleType: "" },
  });

  const role = form.watch("role");

  async function onSubmit(data: FormData) {
    registerMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          login(res.token, res.user as Parameters<typeof login>[1]);
          setLocation("/");
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Registration failed";
          toast({ variant: "destructive", title: "Error", description: msg });
        },
      },
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.14),transparent_20%),rgba(15,23,42,0.92)] p-8 sm:p-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500">
              <MapPin className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">ChainTrack</div>
              <div className="text-xs text-slate-400">For accountable railway cargo handoffs</div>
            </div>
          </Link>

          <div className="mt-12">
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              Create your portal
            </div>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Build a railway cargo workflow that small businesses can actually trust.
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Choose the portal that matches your role in the cargo chain and start working from one shared record instead of scattered calls, verbal promises, and pressure at unload time.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {onboardingNotes.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-lg font-semibold text-white">{title}</div>
                </div>
                <p className="text-sm leading-6 text-slate-300">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-5">
            <div className="text-sm font-semibold text-amber-100">Who should use this?</div>
            <p className="mt-2 text-sm leading-6 text-amber-50/90">
              Shippers who book cargo, receivers waiting on safe unload, train staff managing onboard custody, and railway monitors resolving friction before it becomes loss.
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-full rounded-[32px] border border-white/10 bg-slate-900/85 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.4)] backdrop-blur sm:p-10">
            <h2 className="text-2xl font-semibold text-white">Create account</h2>
            <p className="mt-2 text-sm text-slate-400">
              Join ChainTrack and choose the portal you need in the railway cargo chain.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Portal</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-role" className="h-12 rounded-2xl border-white/10 bg-slate-800/80 text-white">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent className="border-white/10 bg-slate-800">
                            <SelectItem value="shipper" className="text-white">Shipper - I book and send cargo</SelectItem>
                            <SelectItem value="receiver" className="text-white">Receiver - I receive cargo at destination</SelectItem>
                            <SelectItem value="railway_monitor" className="text-white">Railway monitor - I review risk and disputes</SelectItem>
                            <SelectItem value="train_staff" className="text-white">Train staff - I handle onboard custody</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Full name or business name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          <Input
                            {...field}
                            placeholder="Mahajan Agro Traders"
                            data-testid="input-name"
                            className="h-12 rounded-2xl border-white/10 bg-slate-800/80 pl-10 text-white placeholder:text-slate-600 focus:border-cyan-400"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          <Input
                            {...field}
                            type="email"
                            placeholder="you@example.com"
                            data-testid="input-email"
                            className="h-12 rounded-2xl border-white/10 bg-slate-800/80 pl-10 text-white placeholder:text-slate-600 focus:border-cyan-400"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          <Input
                            {...field}
                            type="password"
                            placeholder="********"
                            data-testid="input-password"
                            className="h-12 rounded-2xl border-white/10 bg-slate-800/80 pl-10 text-white placeholder:text-slate-600 focus:border-cyan-400"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm text-slate-300">Phone</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                          <Input
                            {...field}
                            placeholder="+91 9876543210"
                            data-testid="input-phone"
                            className="h-12 rounded-2xl border-white/10 bg-slate-800/80 pl-10 text-white placeholder:text-slate-600 focus:border-cyan-400"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {role === "train_staff" && (
                  <FormField
                    control={form.control}
                    name="vehicleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-slate-300">Assignment note</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <TrainFront className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                            <Input
                              {...field}
                              placeholder="Coach, wagon, or duty note"
                              data-testid="input-vehicle"
                              className="h-12 rounded-2xl border-white/10 bg-slate-800/80 pl-10 text-white placeholder:text-slate-600 focus:border-cyan-400"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button
                  type="submit"
                  disabled={registerMutation.isPending}
                  data-testid="button-submit"
                  className="mt-2 h-12 w-full rounded-2xl border-cyan-300 bg-cyan-400 font-semibold text-slate-950 hover:bg-cyan-300"
                >
                  {registerMutation.isPending ? "Creating account..." : "Create account"}
                </Button>
              </form>
            </Form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-cyan-300 hover:text-cyan-200">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
