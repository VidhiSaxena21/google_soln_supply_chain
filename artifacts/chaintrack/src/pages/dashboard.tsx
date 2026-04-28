import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import {
  getGetCustomerDashboardQueryKey,
  getGetProviderDashboardQueryKey,
  getListDisputesQueryKey,
  getListNotificationsQueryKey,
  getListRequestsQueryKey,
  useGetCustomerDashboard,
  useGetProviderDashboard,
  useListDisputes,
  useListNotifications,
  useListRequests,
} from "@workspace/api-client-react";
import {
  formatCurrency,
  formatDateTime,
  getPortalLabel,
  getRoleDescription,
  getServiceTypeLabel,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils";
import {
  AlertTriangle,
  BadgeIndianRupee,
  Bell,
  CheckCircle,
  Clock,
  FileSignature,
  Package,
  Plus,
  Radar,
  ShieldCheck,
  Star,
  TrainFront,
  TrendingUp,
  UserRoundCheck,
} from "lucide-react";

type RequestLike = {
  id: number;
  consignmentId?: string | null;
  originStation?: string | null;
  expectedUnloadStation?: string | null;
  trainReference?: string | null;
  pickupLocation: string;
  dropLocation: string;
  status: string;
  createdAt: string;
  offeredPrice?: number | null;
  agreedPrice?: number | null;
  customer?: { name: string } | null;
  receiverName?: string | null;
};

function LoadingState() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Package;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur">
      <div className="mb-4 flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mb-0.5 text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function InsightCard({
  title,
  body,
  icon: Icon,
}: {
  title: string;
  body: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-slate-950/40 p-5">
      <Icon className="mb-3 h-5 w-5 text-cyan-300" />
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
    </div>
  );
}

function ConsignmentRow({ req, href = "/requests" }: { req: RequestLike; href?: string }) {
  return (
    <Link href={`${href}/${req.id}`}>
      <div
        data-testid={`card-request-${req.id}`}
        className="flex cursor-pointer items-center gap-4 border-b border-white/10 px-5 py-4 transition-colors hover:bg-white/5 last:border-0"
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">
            {req.consignmentId ?? `Consignment #${req.id}`}{" "}
            <span className="text-slate-500">
              {req.originStation ?? req.pickupLocation} {"->"} {req.expectedUnloadStation ?? req.dropLocation}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-slate-500">
            {req.trainReference ? `${req.trainReference} • ` : ""}
            {formatDateTime(req.createdAt)}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-medium text-slate-300">
            {formatCurrency(req.agreedPrice ?? req.offeredPrice ?? 0)}
          </div>
          <span className={`rounded-full border px-2 py-0.5 text-xs ${getStatusColor(req.status)}`}>
            {getStatusLabel(req.status)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function PortalHero({
  badge,
  title,
  body,
  action,
}: {
  badge: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.12),transparent_18%),rgba(15,23,42,0.92)] p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
            {badge}
          </div>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">{body}</p>
        </div>
        {action}
      </div>
    </section>
  );
}

function ShipperDashboard() {
  const { data, isLoading } = useGetCustomerDashboard({
    query: { queryKey: getGetCustomerDashboardQueryKey() },
  });

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <PortalHero
        badge="Shipper command center"
        title="Control the route story before anyone else can change it."
        body="Create accountable consignments, lock the expected unload station, and keep enough evidence on record to challenge diversion, delay, or unofficial payments."
        action={(
          <Link href="/requests/new">
            <button
              data-testid="button-new-request"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <Plus className="h-4 w-4" />
              New Consignment
            </button>
          </Link>
        )}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Package} label="Total consignments" value={data?.totalRequests ?? 0} color="bg-cyan-400/15 text-cyan-300" />
        <StatCard icon={Clock} label="Active movement" value={data?.activeRequests ?? 0} color="bg-amber-400/15 text-amber-300" />
        <StatCard icon={CheckCircle} label="Completed" value={data?.completedRequests ?? 0} color="bg-emerald-400/15 text-emerald-300" />
        <StatCard icon={BadgeIndianRupee} label="Protected spend" value={formatCurrency(data?.totalSpent ?? 0)} color="bg-violet-400/15 text-violet-300" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InsightCard
          icon={FileSignature}
          title="Price and route before handoff"
          body="Receiver details, train reference, and offered price are captured before anyone is asked to trust a verbal promise."
        />
        <InsightCard
          icon={ShieldCheck}
          title="Proof against coercion"
          body="If someone pressures the receiver for extra money, the original unload expectation and checkpoint trail are already visible."
        />
        <InsightCard
          icon={AlertTriangle}
          title="Disputes with context"
          body="When something goes wrong, you are not reconstructing the story from screenshots and memory."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Recent consignments</h2>
              <p className="mt-1 text-xs text-slate-500">Your most recent rail cargo records.</p>
            </div>
            <Link href="/requests" className="text-xs text-cyan-300 hover:text-cyan-200">
              View all
            </Link>
          </div>
          {data?.recentRequests?.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-500">
              No consignments yet.{" "}
              <Link href="/requests/new" className="text-cyan-300 hover:text-cyan-200">
                Create your first cargo record
              </Link>
            </div>
          ) : (
            (data?.recentRequests as RequestLike[]).map((req) => <ConsignmentRow key={req.id} req={req} />)
          )}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold text-white">Why shippers use this</h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-sm font-medium text-white">Destination lock</div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The expected unload station is not left to a phone conversation at the last minute.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-sm font-medium text-white">Receiver visibility</div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The receiver sees the same consignment and can respond quickly if unload pressure starts building.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-sm font-medium text-white">Open disputes: {data?.openDisputes ?? 0}</div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Issues stay attached to the cargo record so escalation starts with evidence instead of confusion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrainStaffDashboard() {
  const { data, isLoading } = useGetProviderDashboard({
    query: { queryKey: getGetProviderDashboardQueryKey() },
  });

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <PortalHero
        badge="Train staff workspace"
        title="Show clean custody, not just completed unloads."
        body="Accept consignments with clear station expectations, log checkpoints, and build a professional record that separates legitimate work from coercive cargo handling."
        action={(
          <Link href="/requests">
            <button
              data-testid="button-view-jobs"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              <TrainFront className="h-4 w-4" />
              Open cargo queue
            </button>
          </Link>
        )}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={TrainFront} label="Total handoffs" value={data?.totalDeliveries ?? 0} color="bg-cyan-400/15 text-cyan-300" />
        <StatCard icon={Clock} label="Active custody" value={data?.activeDeliveries ?? 0} color="bg-amber-400/15 text-amber-300" />
        <StatCard icon={CheckCircle} label="Completed unloads" value={data?.completedDeliveries ?? 0} color="bg-emerald-400/15 text-emerald-300" />
        <StatCard icon={TrendingUp} label="Recorded earnings" value={formatCurrency(data?.totalEarnings ?? 0)} color="bg-violet-400/15 text-violet-300" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <div className="mb-1 flex items-center gap-2">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-2xl font-bold text-white">{(data?.averageRating ?? 0).toFixed(1)}</span>
          </div>
          <div className="text-sm text-slate-400">Accountability rating</div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
          <div className="mb-1 flex items-center gap-2">
            <Package className="h-4 w-4 text-amber-300" />
            <span className="text-2xl font-bold text-white">{data?.pendingRequests ?? 0}</span>
          </div>
          <div className="text-sm text-slate-400">Unassigned consignments</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Recent custody records</h2>
              <p className="mt-1 text-xs text-slate-500">The work that is shaping your trust history.</p>
            </div>
            <Link href="/requests" className="text-xs text-cyan-300 hover:text-cyan-200">
              View all
            </Link>
          </div>
          {data?.recentDeliveries?.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-500">
              No assigned consignments yet.{" "}
              <Link href="/requests" className="text-cyan-300 hover:text-cyan-200">
                Browse the queue
              </Link>
            </div>
          ) : (
            (data?.recentDeliveries as RequestLike[]).map((req) => <ConsignmentRow key={req.id} req={req} />)
          )}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold text-white">Why train staff win here</h2>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-sm font-medium text-white">Clear unload expectation</div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                You know the assigned station, receiver contact, and escalation path before taking custody.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-sm font-medium text-white">Checkpoint credibility</div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Each update becomes proof that you handled the cargo properly if a dispute appears later.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
              <div className="text-sm font-medium text-white">Open disputes: {data?.openDisputes ?? 0}</div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Legitimate staff are protected by having their own documented version of the route history.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceiverDashboard() {
  const { data: requestData, isLoading } = useListRequests(undefined, {
    query: { queryKey: getListRequestsQueryKey() },
  });
  const { data: notificationData } = useListNotifications({
    query: { queryKey: getListNotificationsQueryKey() },
  });

  if (isLoading) return <LoadingState />;

  const requests = (requestData?.requests ?? []) as RequestLike[];
  const active = requests.filter((req) => ["requested", "accepted", "in_progress"].includes(req.status));
  const completed = requests.filter((req) => req.status === "completed");

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <PortalHero
        badge="Receiver portal"
        title="Know what is coming, where it should unload, and when something starts looking wrong."
        body="Receivers should not be surprised by last-minute cash demands or destination changes. This portal keeps incoming cargo visible before the handoff becomes a problem."
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Package} label="Incoming cargo" value={requests.length} color="bg-cyan-400/15 text-cyan-300" />
        <StatCard icon={Clock} label="Awaiting arrival" value={active.length} color="bg-amber-400/15 text-amber-300" />
        <StatCard icon={CheckCircle} label="Received" value={completed.length} color="bg-emerald-400/15 text-emerald-300" />
        <StatCard icon={Bell} label="Unread alerts" value={notificationData?.unreadCount ?? 0} color="bg-violet-400/15 text-violet-300" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InsightCard
          icon={UserRoundCheck}
          title="Receiver-first visibility"
          body="You can see whether the consignment is still tied to the correct unload station before it disappears into station-level confusion."
        />
        <InsightCard
          icon={AlertTriangle}
          title="Early warning for trouble"
          body="If somebody asks for unofficial unloading money or claims the cargo moved elsewhere, the original plan is already recorded."
        />
        <InsightCard
          icon={FileSignature}
          title="Proof after handoff"
          body="Completed cargo records remain visible so you can show what was delivered and when."
        />
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Receiver cargo queue</h2>
            <p className="mt-1 text-xs text-slate-500">Consignments linked to your receiver portal.</p>
          </div>
          <Link href="/requests" className="text-xs text-cyan-300 hover:text-cyan-200">
            Open queue
          </Link>
        </div>
        {requests.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-500">
            No consignments are linked to this receiver account yet.
          </div>
        ) : (
          requests.slice(0, 6).map((req) => <ConsignmentRow key={req.id} req={req} />)
        )}
      </div>
    </div>
  );
}

function RailwayMonitorDashboard() {
  const { data: requestData, isLoading: requestsLoading } = useListRequests(undefined, {
    query: { queryKey: getListRequestsQueryKey() },
  });
  const { data: disputeData, isLoading: disputesLoading } = useListDisputes({
    query: { queryKey: getListDisputesQueryKey() },
  });

  if (requestsLoading || disputesLoading) return <LoadingState />;

  const requests = (requestData?.requests ?? []) as RequestLike[];
  const disputes = (disputeData?.disputes ?? []) as {
    id: number;
    requestId: number;
    reason: string;
    status: string;
    createdAt: string;
  }[];

  const active = requests.filter((req) => ["accepted", "in_progress"].includes(req.status));
  const openDisputes = disputes.filter((dispute) => ["open", "under_review"].includes(dispute.status));

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <PortalHero
        badge="Railway monitor portal"
        title="Watch the risky corridors before a small business loses leverage."
        body="Monitor live consignments, spot active disputes, and preserve enough visibility that delayed unloads, diversions, and unofficial charge complaints cannot be quietly buried."
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard icon={Radar} label="Visible consignments" value={requests.length} color="bg-cyan-400/15 text-cyan-300" />
        <StatCard icon={TrainFront} label="Active in transit" value={active.length} color="bg-amber-400/15 text-amber-300" />
        <StatCard icon={AlertTriangle} label="Open risk cases" value={openDisputes.length} color="bg-rose-400/15 text-rose-300" />
        <StatCard icon={CheckCircle} label="Resolved cases" value={disputes.filter((d) => ["resolved", "closed"].includes(d.status)).length} color="bg-emerald-400/15 text-emerald-300" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InsightCard
          icon={ShieldCheck}
          title="Neutral oversight"
          body="The monitor portal sees both live movement and dispute pressure instead of only hearing about problems after cargo is already misplaced."
        />
        <InsightCard
          icon={AlertTriangle}
          title="Diversion-focused review"
          body="A disputed consignment can be checked against its expected unload station and recent checkpoints immediately."
        />
        <InsightCard
          icon={Radar}
          title="Useful for IRCTC-style control desks"
          body="This is the operational layer that turns informal complaints into reviewable consignment histories."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Monitored consignments</h2>
              <p className="mt-1 text-xs text-slate-500">Recent cargo records across the visible network.</p>
            </div>
            <Link href="/requests" className="text-xs text-cyan-300 hover:text-cyan-200">
              View queue
            </Link>
          </div>
          {requests.slice(0, 6).map((req) => <ConsignmentRow key={req.id} req={req} />)}
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-semibold text-white">Dispute pressure now</h2>
          <div className="mt-4 space-y-3">
            {openDisputes.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
                No open disputes right now.
              </div>
            ) : (
              openDisputes.slice(0, 4).map((dispute) => (
                <Link key={dispute.id} href={`/disputes/${dispute.id}`}>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 transition hover:border-rose-400/20">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-white">Request #{dispute.requestId}</div>
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${getStatusColor(dispute.status)}`}>
                        {getStatusLabel(dispute.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{dispute.reason}</p>
                    <div className="mt-2 text-xs text-slate-500">{formatDateTime(dispute.createdAt)}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case "shipper":
      return <ShipperDashboard />;
    case "receiver":
      return <ReceiverDashboard />;
    case "railway_monitor":
      return <RailwayMonitorDashboard />;
    case "train_staff":
      return <TrainStaffDashboard />;
    default:
      return (
        <div className="p-6 text-slate-400">
          <div className="text-white">{getPortalLabel(user.role)}</div>
          <p className="mt-2">{getRoleDescription(user.role)}</p>
        </div>
      );
  }
}
