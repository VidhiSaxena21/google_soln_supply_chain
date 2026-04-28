import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileSignature, Lock, Mail, MapPin, Radar, ShieldCheck, TrainFront, UserRoundCheck } from "lucide-react";

const trustBullets = [
  { icon: ShieldCheck, text: "Expected unload station stays visible to every portal" },
  { icon: FileSignature, text: "Agreements and checkpoints create proof beyond calls and chats" },
  { icon: Radar, text: "Railway monitors can review disputes before cargo gets rewritten as lost or rerouted" },
];

const demoAccounts = [
  { label: "Shipper", email: "shipper@demo.com", password: "demo123" },
  { label: "Receiver", email: "receiver@demo.com", password: "demo123" },
  { label: "Monitor", email: "monitor@demo.com", password: "demo123" },
  { label: "Train staff", email: "staff@demo.com", password: "demo123" },
];

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: FormData) {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          login(res.token, res.user as Parameters<typeof login>[1]);
          setLocation("/");
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Login failed";
          toast({ variant: "destructive", title: "Error", description: msg });
        },
      },
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_20%),rgba(15,23,42,0.92)] p-8 sm:p-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500">
              <MapPin className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">ChainTrack</div>
              <div className="text-xs text-slate-400">Railway cargo accountability for SMEs</div>
            </div>
          </Link>

          <div className="mt-12 max-w-xl">
            <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              Sign in to your portal
            </div>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Bring one shared record to railway cargo deals that usually depend on pressure, memory, and phone calls.
            </h1>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Shippers, receivers, train staff, and railway monitors all see the same consignment truth:
              route, expected unload station, checkpoints, agreement, and dispute history.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {trustBullets.map(({ icon: Icon, text }) => (
              <div key={text} className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur">
                <Icon className="mb-3 h-5 w-5 text-cyan-300" />
                <p className="text-sm leading-6 text-slate-200">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Demo portals</div>
            <div className="space-y-2 text-sm text-emerald-50">
              <p><span className="font-semibold">Shipper:</span> shipper@demo.com / demo123</p>
              <p><span className="font-semibold">Receiver:</span> receiver@demo.com / demo123</p>
              <p><span className="font-semibold">Railway monitor:</span> monitor@demo.com / demo123</p>
              <p><span className="font-semibold">Train staff:</span> staff@demo.com / demo123</p>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="w-full rounded-[32px] border border-white/10 bg-slate-900/85 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.4)] backdrop-blur sm:p-10">
            <h2 className="text-2xl font-semibold text-white">Sign in</h2>
            <p className="mt-2 text-sm text-slate-400">Enter your credentials to continue into the railway cargo workspace.</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5">
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

                <div className="grid grid-cols-2 gap-3">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() => {
                        form.setValue("email", account.email);
                        form.setValue("password", account.password);
                      }}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-200 transition hover:border-cyan-400/20 hover:bg-cyan-400/10"
                    >
                      {account.label} demo
                    </button>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  data-testid="button-submit"
                  className="mt-2 h-12 w-full rounded-2xl border-cyan-300 bg-cyan-400 font-semibold text-slate-950 hover:bg-cyan-300"
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              <div className="mb-2 flex items-center gap-2 font-medium text-white">
                <TrainFront className="h-4 w-4 text-cyan-300" />
                Portal outcomes
              </div>
              <p className="leading-6">
                Shippers create accountable consignments, receivers verify incoming cargo, train staff log custody,
                and railway monitors review disputes before cargo goes missing into the wrong corridor.
              </p>
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-medium text-cyan-300 hover:text-cyan-200">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
