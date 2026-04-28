import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, disputesTable, requestsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

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

router.get("/dashboard/customer", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "shipper") {
    res.status(403).json({ error: "Shippers only" });
    return;
  }

  const userId = req.user!.userId;
  const allRequests = await db.select().from(requestsTable).where(eq(requestsTable.customerId, userId));

  const activeRequests = allRequests.filter((requestRow) => ["requested", "accepted", "in_progress"].includes(requestRow.status)).length;
  const completedRequests = allRequests.filter((requestRow) => requestRow.status === "completed").length;
  const totalSpent = allRequests
    .filter((requestRow) => requestRow.status === "completed")
    .reduce((sum, requestRow) => sum + (requestRow.agreedPrice ?? requestRow.offeredPrice ?? 0), 0);

  const recent = allRequests
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentEnriched = await Promise.all(recent.map((requestRow) => getRequestWithUsers(requestRow.id)));
  const openDisputes = await db.select().from(disputesTable)
    .where(and(eq(disputesTable.raisedById, userId), eq(disputesTable.status, "open")));

  res.json({
    totalRequests: allRequests.length,
    activeRequests,
    completedRequests,
    totalSpent: Math.round(totalSpent),
    recentRequests: recentEnriched.filter(Boolean),
    openDisputes: openDisputes.length,
  });
});

router.get("/dashboard/provider", requireAuth, async (req, res): Promise<void> => {
  if (req.user!.role !== "train_staff") {
    res.status(403).json({ error: "Train staff only" });
    return;
  }

  const userId = req.user!.userId;
  const allDeliveries = await db.select().from(requestsTable).where(eq(requestsTable.providerId, userId));

  const activeDeliveries = allDeliveries.filter((requestRow) => ["accepted", "in_progress"].includes(requestRow.status)).length;
  const completedDeliveries = allDeliveries.filter((requestRow) => requestRow.status === "completed").length;
  const totalEarnings = allDeliveries
    .filter((requestRow) => requestRow.status === "completed")
    .reduce((sum, requestRow) => sum + (requestRow.agreedPrice ?? 0), 0);

  const [trainStaffUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const averageRating = trainStaffUser?.rating ?? 0;

  const pendingRequests = await db.select().from(requestsTable).where(eq(requestsTable.status, "requested"));
  const recent = allDeliveries
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentEnriched = await Promise.all(recent.map((requestRow) => getRequestWithUsers(requestRow.id)));
  const openDisputes = await db.select().from(disputesTable)
    .where(and(eq(disputesTable.raisedById, userId), eq(disputesTable.status, "open")));

  res.json({
    totalDeliveries: allDeliveries.length,
    activeDeliveries,
    completedDeliveries,
    totalEarnings: Math.round(totalEarnings),
    averageRating: Math.round((averageRating ?? 0) * 10) / 10,
    recentDeliveries: recentEnriched.filter(Boolean),
    openDisputes: openDisputes.length,
    pendingRequests: pendingRequests.length,
  });
});

export default router;
