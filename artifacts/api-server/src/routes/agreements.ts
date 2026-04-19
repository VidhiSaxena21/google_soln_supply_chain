import { Router, type IRouter } from "express";
import { db, agreementsTable, requestsTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/agreements", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const role = req.user!.role;

  const reqs = await db.select().from(requestsTable).where(
    role === "customer"
      ? eq(requestsTable.customerId, userId)
      : eq(requestsTable.providerId, userId)
  );

  const requestIds = reqs.map(r => r.id);
  if (requestIds.length === 0) {
    res.json({ agreements: [] });
    return;
  }

  const agreements = await db.select().from(agreementsTable)
    .where(or(...requestIds.map(id => eq(agreementsTable.requestId, id))));

  res.json({ agreements });
});

router.get("/agreements/:requestId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
  const requestId = parseInt(raw, 10);

  const [agreement] = await db.select().from(agreementsTable).where(eq(agreementsTable.requestId, requestId));
  if (!agreement) {
    res.status(404).json({ error: "Agreement not found" });
    return;
  }
  res.json(agreement);
});

router.post("/agreements/:requestId/sign", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
  const requestId = parseInt(raw, 10);
  const userId = req.user!.userId;
  const role = req.user!.role;

  const [agreement] = await db.select().from(agreementsTable).where(eq(agreementsTable.requestId, requestId));
  if (!agreement) {
    res.status(404).json({ error: "Agreement not found" });
    return;
  }

  const [requestRow] = await db.select().from(requestsTable).where(eq(requestsTable.id, requestId));
  if (!requestRow) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const now = new Date();
  const updates: Record<string, unknown> = {};

  if (role === "customer" && requestRow.customerId === userId) {
    updates.customerSigned = true;
    updates.customerSignedAt = now;
  } else if (role === "provider" && requestRow.providerId === userId) {
    updates.providerSigned = true;
    updates.providerSignedAt = now;
  } else {
    res.status(403).json({ error: "Not authorized to sign this agreement" });
    return;
  }

  const customerSigned = role === "customer" ? true : agreement.customerSigned;
  const providerSigned = role === "provider" ? true : agreement.providerSigned;
  if (customerSigned && providerSigned) {
    updates.fullyExecuted = true;
  }

  const [updated] = await db.update(agreementsTable).set(updates).where(eq(agreementsTable.requestId, requestId)).returning();
  res.json(updated);
});

export default router;
