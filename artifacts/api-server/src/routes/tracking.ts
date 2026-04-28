import { Router, type IRouter } from "express";
import { db, trackingUpdatesTable, requestsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AddTrackingUpdateBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { canAccessRequest } from "../lib/request-access";

const router: IRouter = Router();

router.get("/tracking/:requestId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
  const requestId = parseInt(raw, 10);

  const [request] = await db.select().from(requestsTable).where(eq(requestsTable.id, requestId));
  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (!canAccessRequest(request, req.user!, { allowRequestedToTrainStaff: true })) {
    res.status(403).json({ error: "Not authorized to view this tracking history" });
    return;
  }

  const updates = await db.select().from(trackingUpdatesTable)
    .where(eq(trackingUpdatesTable.requestId, requestId))
    .orderBy(trackingUpdatesTable.createdAt);

  const latest = updates[updates.length - 1];
  res.json({
    requestId,
    currentStatus: request.status,
    updates,
    currentLat: latest?.lat ?? null,
    currentLng: latest?.lng ?? null,
  });
});

router.post("/tracking/:requestId", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "train_staff") {
    res.status(403).json({ error: "Train staff only" });
    return;
  }

  const raw = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
  const requestId = parseInt(raw, 10);

  const parsed = AddTrackingUpdateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [request] = await db.select().from(requestsTable).where(eq(requestsTable.id, requestId));
  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (request.providerId !== req.user!.userId) {
    res.status(403).json({ error: "This consignment is not assigned to you" });
    return;
  }

  const [update] = await db.insert(trackingUpdatesTable).values({
    requestId,
    status: parsed.data.status,
    message: parsed.data.message,
    lat: parsed.data.lat ?? null,
    lng: parsed.data.lng ?? null,
  }).returning();

  res.status(201).json(update);
});

export default router;
