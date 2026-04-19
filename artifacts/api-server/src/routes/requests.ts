import { Router, type IRouter } from "express";
import { db, requestsTable, usersTable, agreementsTable, notificationsTable } from "@workspace/db";
import { eq, and, or, ne, desc } from "drizzle-orm";
import { CreateRequestBody, EstimatePriceBody, UpdateRequestStatusBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function calcPrice(distanceKm: number, serviceType: string) {
  const baseFare = serviceType === "logistics" ? 50 : serviceType === "transport" ? 30 : 15;
  const ratePerKm = serviceType === "logistics" ? 8 : serviceType === "transport" ? 5 : 3;
  const distanceCharge = Math.round(distanceKm * ratePerKm);
  const serviceFee = Math.round(baseFare * 0.1);
  const total = baseFare + distanceCharge + serviceFee;
  return {
    baseFare,
    distanceCharge,
    serviceFee,
    total,
    breakdown: [
      { label: "Base fare", amount: baseFare },
      { label: `Distance (${distanceKm} km × ₹${ratePerKm}/km)`, amount: distanceCharge },
      { label: "Service fee (10%)", amount: serviceFee },
    ],
    distanceKm,
  };
}

async function getRequestWithUsers(id: number) {
  const [req] = await db.select().from(requestsTable).where(eq(requestsTable.id, id));
  if (!req) return null;

  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, req.customerId));
  let provider = null;
  if (req.providerId) {
    const [p] = await db.select().from(usersTable).where(eq(usersTable.id, req.providerId));
    provider = p ? (({ passwordHash: _, ...rest }) => rest)(p) : null;
  }

  return {
    ...req,
    customer: customer ? (({ passwordHash: _, ...rest }) => rest)(customer) : null,
    provider,
  };
}

router.post("/requests/estimate", requireAuth, async (req, res): Promise<void> => {
  const parsed = EstimatePriceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { distanceKm, serviceType } = parsed.data;
  res.json(calcPrice(distanceKm, serviceType));
});

router.get("/requests/available", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "provider") {
    res.status(403).json({ error: "Providers only" });
    return;
  }
  const reqs = await db.select().from(requestsTable)
    .where(and(eq(requestsTable.status, "requested")))
    .orderBy(desc(requestsTable.createdAt))
    .limit(50);

  const enriched = await Promise.all(reqs.map(r => getRequestWithUsers(r.id)));
  res.json({ requests: enriched.filter(Boolean), total: enriched.length });
});

router.get("/requests", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const role = req.user!.role;
  const status = req.query.status as string | undefined;

  let conditions;
  if (role === "customer") {
    conditions = status
      ? and(eq(requestsTable.customerId, userId), eq(requestsTable.status, status))
      : eq(requestsTable.customerId, userId);
  } else {
    conditions = status
      ? and(eq(requestsTable.providerId, userId), eq(requestsTable.status, status))
      : eq(requestsTable.providerId, userId);
  }

  const reqs = await db.select().from(requestsTable)
    .where(conditions)
    .orderBy(desc(requestsTable.createdAt));

  const enriched = await Promise.all(reqs.map(r => getRequestWithUsers(r.id)));
  res.json({ requests: enriched.filter(Boolean), total: enriched.length });
});

router.post("/requests", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "customer") {
    res.status(403).json({ error: "Customers only" });
    return;
  }

  const parsed = CreateRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const offeredPrice = data.offeredPrice ?? (
    data.distanceKm ? calcPrice(data.distanceKm, data.serviceType).total : null
  );

  const [created] = await db.insert(requestsTable).values({
    customerId: req.user!.userId,
    pickupLocation: data.pickupLocation,
    dropLocation: data.dropLocation,
    pickupLat: data.pickupLat ?? null,
    pickupLng: data.pickupLng ?? null,
    dropLat: data.dropLat ?? null,
    dropLng: data.dropLng ?? null,
    description: data.description,
    serviceType: data.serviceType,
    offeredPrice: offeredPrice ?? null,
    distanceKm: data.distanceKm ?? null,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    status: "requested",
  }).returning();

  const enriched = await getRequestWithUsers(created.id);
  res.status(201).json(enriched);
});

router.get("/requests/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const enriched = await getRequestWithUsers(id);
  if (!enriched) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  res.json(enriched);
});

router.patch("/requests/:id/status", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = UpdateRequestStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "completed") {
    updates.completedAt = new Date();
  }

  const [updated] = await db.update(requestsTable).set(updates).where(eq(requestsTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const enriched = await getRequestWithUsers(id);
  res.json(enriched);
});

router.post("/requests/:id/accept", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "provider") {
    res.status(403).json({ error: "Providers only" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [existing] = await db.select().from(requestsTable).where(eq(requestsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  if (existing.status !== "requested") {
    res.status(400).json({ error: "Request already accepted" });
    return;
  }

  const agreedPrice = existing.offeredPrice ?? 0;
  const [updated] = await db.update(requestsTable)
    .set({ providerId: req.user!.userId, status: "accepted", agreedPrice })
    .where(eq(requestsTable.id, id))
    .returning();

  await db.insert(agreementsTable).values({
    requestId: id,
    terms: `Service Agreement between customer and provider for ${existing.serviceType} service from ${existing.pickupLocation} to ${existing.dropLocation}. Agreed price: ₹${agreedPrice}. Both parties agree to fulfill this contract in good faith. The provider agrees to deliver the goods/service safely and on time. The customer agrees to be available at pickup and provide accurate details.`,
    agreedPrice,
    customerSigned: false,
    providerSigned: false,
    fullyExecuted: false,
  }).onConflictDoNothing();

  await db.insert(notificationsTable).values({
    userId: existing.customerId,
    type: "request_accepted",
    title: "Request Accepted",
    message: `Your request from ${existing.pickupLocation} to ${existing.dropLocation} has been accepted by a provider.`,
    requestId: id,
  });

  const enriched = await getRequestWithUsers(id);
  res.json(enriched);
});

export default router;
