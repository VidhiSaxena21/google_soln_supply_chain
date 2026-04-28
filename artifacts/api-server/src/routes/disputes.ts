import { Router, type IRouter } from "express";
import { db, disputesTable, requestsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateDisputeBody, ResolveDisputeBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { canAccessRequest } from "../lib/request-access";

const router: IRouter = Router();

async function enrichDispute(dispute: typeof disputesTable.$inferSelect) {
  const [request] = await db.select().from(requestsTable).where(eq(requestsTable.id, dispute.requestId));
  if (!request) return { ...dispute, request: null };

  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, request.customerId));
  let provider = null;
  if (request.providerId) {
    const [p] = await db.select().from(usersTable).where(eq(usersTable.id, request.providerId));
    provider = p ? (({ passwordHash: _, ...rest }) => rest)(p) : null;
  }

  return {
    ...dispute,
    request: {
      ...request,
      customer: customer ? (({ passwordHash: _, ...rest }) => rest)(customer) : null,
      provider,
    },
  };
}

router.get("/disputes", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  let disputes = await db.select().from(disputesTable).orderBy(desc(disputesTable.createdAt));

  if (req.user!.role !== "railway_monitor") {
    const visibleDisputes = await Promise.all(disputes.map(async (dispute) => {
      if (dispute.raisedById === userId) {
        return dispute;
      }

      const [requestRow] = await db.select().from(requestsTable).where(eq(requestsTable.id, dispute.requestId));
      if (!requestRow) {
        return null;
      }

      return canAccessRequest(requestRow, req.user!, { allowRequestedToTrainStaff: true }) ? dispute : null;
    }));

    disputes = visibleDisputes.filter(Boolean) as typeof disputesTable.$inferSelect[];
  }

  const enriched = await Promise.all(disputes.map(enrichDispute));
  res.json({ disputes: enriched });
});

router.post("/disputes", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateDisputeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [requestRow] = await db.select().from(requestsTable).where(eq(requestsTable.id, parsed.data.requestId));
  if (!requestRow) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  if (!canAccessRequest(requestRow, req.user!, { allowRequestedToTrainStaff: true })) {
    res.status(403).json({ error: "Not authorized to raise a dispute for this consignment" });
    return;
  }

  const [dispute] = await db.insert(disputesTable).values({
    requestId: parsed.data.requestId,
    raisedById: req.user!.userId,
    reason: parsed.data.reason,
    description: parsed.data.description,
    status: "open",
  }).returning();

  const enriched = await enrichDispute(dispute);
  res.status(201).json(enriched);
});

router.get("/disputes/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [dispute] = await db.select().from(disputesTable).where(eq(disputesTable.id, id));
  if (!dispute) {
    res.status(404).json({ error: "Dispute not found" });
    return;
  }

  if (req.user!.role !== "railway_monitor" && dispute.raisedById !== req.user!.userId) {
    const [requestRow] = await db.select().from(requestsTable).where(eq(requestsTable.id, dispute.requestId));
    if (!requestRow || !canAccessRequest(requestRow, req.user!, { allowRequestedToTrainStaff: true })) {
      res.status(403).json({ error: "Not authorized to view this dispute" });
      return;
    }
  }

  const enriched = await enrichDispute(dispute);
  res.json(enriched);
});

router.patch("/disputes/:id/resolve", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "railway_monitor") {
    res.status(403).json({ error: "Railway monitor only" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const parsed = ResolveDisputeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db.update(disputesTable).set({
    status: parsed.data.status,
    resolution: parsed.data.resolution,
    resolvedAt: new Date(),
  }).where(eq(disputesTable.id, id)).returning();

  if (!updated) {
    res.status(404).json({ error: "Dispute not found" });
    return;
  }

  const enriched = await enrichDispute(updated);
  res.json(enriched);
});

export default router;
