import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  FileSignature,
  MapPinned,
  Radar,
  ShieldCheck,
  TrainFront,
  UserRoundCheck,
  WalletCards,
} from "lucide-react";

const problemCards = [
  {
    title: "Unofficial unloading pressure",
    body: "Small businesses can be pushed to pay extra cash at destination just to ensure the cargo is unloaded where it should be.",
    icon: WalletCards,
    accent: "from-amber-500/20 to-orange-500/10 text-amber-300",
  },
  {
    title: "Diversion without proof",
    body: "If the cargo is delayed, marked missing, or pushed toward the wrong station, the weaker party often has no shared evidence trail.",
    icon: TrainFront,
    accent: "from-cyan-500/20 to-sky-500/10 text-cyan-300",
  },
  {
    title: "No neutral visibility",
    body: "Shipper, receiver, and railway staff rarely work from the same record, so every dispute becomes one story against another.",
    icon: Radar,
    accent: "from-rose-500/20 to-red-500/10 text-rose-300",
  },
];

const portalCards = [
  {
    title: "Shipper portal",
    body: "Create a consignment, lock the expected unload station, and keep pricing and handoff terms visible from origin to destination.",
  },
  {
    title: "Receiver portal",
    body: "See incoming cargo, arrival updates, and whether the consignment is still on track for the correct unload point.",
  },
  {
    title: "Railway monitor portal",
    body: "Review live consignments, track disputes, and intervene when cargo is at risk of diversion or coercive handling.",
  },
  {
    title: "Train staff portal",
    body: "Accept custody, publish checkpoints, and show legitimate unload progress with time-stamped proof.",
  },
];

const trustPillars = [
  "Expected unload station and receiver details stay attached to every consignment",
  "Digital agreement captures route, price, and custody expectations before the train leg begins",
  "Checkpoint timeline makes diversion, delay, and missing cargo harder to hide",
  "Dispute support gives small businesses a structured escalation record instead of scattered chats",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,1))]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-5 sm:px-6 lg:px-8">
        <header className="mb-10 flex items-center justify-between rounded-full border border-white/10 bg-slate-900/70 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_40px_rgba(34,211,238,0.25)]">
              <MapPinned className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">ChainTrack</div>
              <div className="text-xs text-slate-400">Railway cargo accountability for small businesses</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Launch demo
            </Link>
          </div>
        </header>

        <main className="grid flex-1 gap-10 lg:grid-cols-[1.25fr_0.85fr] lg:items-start">
          <section className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
              <ShieldCheck className="h-4 w-4" />
              Built for Indian railway cargo handoffs where trust is weakest
            </div>

            <div className="space-y-6">
              <div className="max-w-4xl space-y-4">
                <h1 className="max-w-5xl text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                  Stop cargo from disappearing into unofficial payments, verbal promises, and invisible handoffs.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">
                  ChainTrack is a digital trust layer for railway cargo. It helps shippers, receivers, train staff,
                  and railway monitors work from the same consignment record: price, route, expected unload station,
                  checkpoints, and dispute evidence.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Create an account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/10"
                >
                  Use demo portals
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {trustPillars.map((pillar) => (
                <div
                  key={pillar}
                  className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200 backdrop-blur"
                >
                  {pillar}
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {problemCards.map(({ title, body, icon: Icon, accent }) => (
                <div
                  key={title}
                  className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 backdrop-blur"
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mb-2 text-lg font-semibold text-white">{title}</h2>
                  <p className="text-sm leading-6 text-slate-400">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-5 lg:sticky lg:top-6">
            <div className="rounded-[32px] border border-cyan-400/20 bg-slate-900/80 p-6 shadow-[0_30px_120px_rgba(8,145,178,0.12)] backdrop-blur">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Why It Works</div>
                  <p className="mt-1 text-sm text-slate-400">A shared record from booking to unload.</p>
                </div>
                <TrainFront className="h-5 w-5 text-cyan-300" />
              </div>

              <div className="space-y-4">
                {[
                  "Shipper posts the consignment with train, receiver, and expected unload station details.",
                  "Train staff accepts custody and signs into a route-specific accountability trail.",
                  "Receiver watches the same timeline instead of waiting on fragmented calls.",
                  "Railway monitor reviews alerts and disputes when coercion or diversion risk appears.",
                ].map((step, index) => (
                  <div key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400 font-semibold text-slate-950">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm leading-6 text-slate-200">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {portalCards.map(({ title, body }) => (
                <div key={title} className="rounded-[28px] border border-white/10 bg-gradient-to-br from-cyan-400/10 to-slate-900 p-5">
                  <UserRoundCheck className="mb-3 h-5 w-5 text-cyan-300" />
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border border-emerald-400/20 bg-emerald-400/10 p-5">
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Demo access</div>
              <div className="space-y-2 text-sm text-emerald-50">
                <p><span className="font-semibold">Shipper:</span> shipper@demo.com / demo123</p>
                <p><span className="font-semibold">Receiver:</span> receiver@demo.com / demo123</p>
                <p><span className="font-semibold">Railway monitor:</span> monitor@demo.com / demo123</p>
                <p><span className="font-semibold">Train staff:</span> staff@demo.com / demo123</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-rose-400/20 bg-rose-400/10 p-5">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-100">
                <AlertTriangle className="h-4 w-4" />
                Real-world failure this is built for
              </div>
              <p className="text-sm leading-6 text-rose-50/90">
                If a Mumbai consignment meant for Jalandhar is threatened with diversion unless extra cash is paid,
                ChainTrack keeps the expected unload point, custody trail, and dispute evidence visible before the story can be rewritten.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
