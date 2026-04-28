import { Router, type IRouter } from "express";
import { and, desc, eq, or } from "drizzle-orm";
import { db, requestsTable, usersTable, agreementsTable, notificationsTable } from "@workspace/db";
import { CreateRequestBody, EstimatePriceBody, UpdateRequestStatusBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { canAccessRequest } from "../lib/request-access";

const router: IRouter = Router();

function calcPrice(distanceKm: number, serviceType: string) {
  const baseFare =
    serviceType === "logistics" ? 950 :
    serviceType === "transport" ? 620 :
    350;
  const ratePerKm =
    serviceType === "logistics" ? 12 :
    serviceType === "transport" ? 9 :
    6;
  const custodyBuffer =
    serviceType === "logistics" ? 180 :
    serviceType === "transport" ? 120 :
    75;

  const distanceCharge = Math.round(distanceKm * ratePerKm);
  const total = baseFare + distanceCharge + custodyBuffer;

  return {
    baseFare,
    distanceCharge,
    serviceFee: custodyBuffer,
    total,
    breakdown: [
      { label: "Rail booking base", amount: baseFare },
      { label: `Route coverage (${distanceKm} km x INR ${ratePerKm}/km)`, amount: distanceCharge },
      { label: "Accountability and diversion-risk buffer", amount: custodyBuffer },
    ],
    distanceKm,
  };
}

async function getRequestWithUsers(id: number) {
  const [requestRow] = await db.select().from(requestsTable).where(eq(requestsTable.id, id));
  if (!requestRow) return null;

  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, requestRow.customerId));
  let provider = null;

  if (requestRow.providerId) {
    const [providerRow] = await db.select().from(usersTable).where(eq(usersTable.id, requestRow.providerId));
    provider = providerRow ? (({ passwordHash: _, ...rest }) => rest)(providerRow) : null;
  }

  return {
    ...requestRow,
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
  if (req.user!.role !== "train_staff") {
    res.status(403).json({ error: "Train staff only" });
    return;
  }

  const requestRows = await db.select().from(requestsTable)
    .where(eq(requestsTable.status, "requested"))
    .orderBy(desc(requestsTable.createdAt))
    .limit(50);

  const enriched = await Promise.all(requestRows.map((requestRow) => getRequestWithUsers(requestRow.id)));
  res.json({ requests: enriched.filter(Boolean), total: enriched.length });
});

router.get("/requests", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const role = req.user!.role;
  const email = req.user!.email;
  const status = req.query.status as string | undefined;

  let conditions;

  if (role === "shipper") {
    conditions = status
      ? and(eq(requestsTable.customerId, userId), eq(requestsTable.status, status))
      : eq(requestsTable.customerId, userId);
  } else if (role === "receiver") {
    const receiverFilter = email
      ? or(eq(requestsTable.receiverEmail, email))
      : eq(requestsTable.receiverPhone, "");
    conditions = status
      ? and(receiverFilter, eq(requestsTable.status, status))
      : receiverFilter;
  } else if (role === "train_staff") {
    conditions = status
      ? and(eq(requestsTable.providerId, userId), eq(requestsTable.status, status))
      : eq(requestsTable.providerId, userId);
  } else {
    conditions = status
      ? eq(requestsTable.status, status)
      : undefined;
  }

  const requestRows = conditions
    ? await db.select().from(requestsTable).where(conditions).orderBy(desc(requestsTable.createdAt))
    : await db.select().from(requestsTable).orderBy(desc(requestsTable.createdAt));

  const enriched = await Promise.all(requestRows.map((requestRow) => getRequestWithUsers(requestRow.id)));
  res.json({ requests: enriched.filter(Boolean), total: enriched.length });
});

router.post("/requests", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "shipper") {
    res.status(403).json({ error: "Shippers only" });
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
    receiverName: data.receiverName ?? null,
    receiverPhone: data.receiverPhone ?? null,
    receiverEmail: data.receiverEmail ?? null,
    receiverBusiness: data.receiverBusiness ?? null,
    consignmentId: data.consignmentId ?? null,
    bookingReference: data.bookingReference ?? null,
    invoiceReference: data.invoiceReference ?? null,
    originStation: data.originStation ?? null,
    destinationStation: data.destinationStation ?? null,
    expectedUnloadStation: data.expectedUnloadStation ?? null,
    trainReference: data.trainReference ?? null,
    coachOrWagon: data.coachOrWagon ?? null,
    cargoCategory: data.cargoCategory ?? null,
    declaredValue: data.declaredValue ?? null,
    riskNote: data.riskNote ?? null,
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
  const [requestRow] = await db.select().from(requestsTable).where(eq(requestsTable.id, id));

  if (!requestRow) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (!canAccessRequest(requestRow, req.user!, { allowRequestedToTrainStaff: true })) {
    res.status(403).json({ error: "Not authorized to view this consignment" });
    return;
  }

  const enriched = await getRequestWithUsers(id);

  if (!enriched) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  res.json(enriched);
});

router.patch("/requests/:id/status", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "train_staff" && req.user!.role !== "railway_monitor") {
    res.status(403).json({ error: "Only train staff or railway monitors can update status" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const parsed = UpdateRequestStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(requestsTable).where(eq(requestsTable.id, id));
  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (req.user!.role === "train_staff" && existing.providerId !== req.user!.userId) {
    res.status(403).json({ error: "You can only update consignments assigned to you" });
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

  await db.insert(notificationsTable).values({
    userId: updated.customerId,
    type: "request_updated",
    title: "Consignment status updated",
    message: `Cargo ${updated.consignmentId ?? `#${updated.id}`} is now ${parsed.data.status.replace(/_/g, " ")}.`,
    requestId: updated.id,
  });

  const [receiverUser] = updated.receiverEmail
    ? await db.select().from(usersTable).where(eq(usersTable.email, updated.receiverEmail))
    : [];

  if (receiverUser) {
    await db.insert(notificationsTable).values({
      userId: receiverUser.id,
      type: "request_updated",
      title: "Receiver timeline updated",
      message: `Consignment ${updated.consignmentId ?? `#${updated.id}`} is now ${parsed.data.status.replace(/_/g, " ")}.`,
      requestId: updated.id,
    });
  }

  res.json(enriched);
});

router.post("/requests/:id/accept", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "train_staff") {
    res.status(403).json({ error: "Train staff only" });
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
  await db.update(requestsTable)
    .set({ providerId: req.user!.userId, status: "accepted", agreedPrice })
    .where(eq(requestsTable.id, id))
    .returning();

  await db.insert(agreementsTable).values({
    requestId: id,
    terms: `Rail cargo accountability agreement for consignment ${existing.consignmentId ?? `#${id}`}. Expected unload station: ${existing.expectedUnloadStation ?? existing.destinationStation ?? existing.dropLocation}. The assigned train staff confirms custody from ${existing.originStation ?? existing.pickupLocation} to ${existing.destinationStation ?? existing.dropLocation}. Any diversion, off-route transfer, or unofficial unloading demand must be recorded and escalated through ChainTrack.`,
    agreedPrice,
    customerSigned: false,
    providerSigned: false,
    fullyExecuted: false,
  }).onConflictDoNothing();

  await db.insert(notificationsTable).values({
    userId: existing.customerId,
    type: "request_accepted",
    title: "Consignment assigned",
    message: `Your cargo ${existing.consignmentId ?? `#${id}`} is now assigned to onboard train staff for ${existing.expectedUnloadStation ?? existing.dropLocation}.`,
    requestId: id,
  });

  const [receiverUser] = existing.receiverEmail
    ? await db.select().from(usersTable).where(eq(usersTable.email, existing.receiverEmail))
    : [];

  if (receiverUser) {
    await db.insert(notificationsTable).values({
      userId: receiverUser.id,
      type: "request_updated",
      title: "Incoming consignment visible",
      message: `A consignment for ${existing.expectedUnloadStation ?? existing.dropLocation} is now visible in your receiver portal.`,
      requestId: id,
    });
  }

  const enriched = await getRequestWithUsers(id);
  res.json(enriched);
});

export default router;
