import { Router, type IRouter } from "express";
import { db, requestsTable, disputesTable } from "@workspace/db";
import { eq, and, sum, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { usersTable } from "@workspace/db";

const router: IRouter = Router();

async function getRequestWithUsers(id: number) {
  const [req] = await db.select().from(requestsTable).where(eq(requestsTable.id, id));
  if (!req) return null;
  const [customer] = await db.select().from(usersTable).where(eq(usersTable.id, req.customerId));
  let provider = null;
  if (req.providerId) {
    const [p] = await db.select().from(usersTable).where(eq(usersTable.id, req.providerId));
    provider = p ? (({ passwordHash: _, ...rest }) => rest)(p) : null;
  }
  return { ...req, customer: customer ? (({ passwordHash: _, ...rest }) => rest)(customer) : null, provider };
}

router.get("/dashboard/customer", requireAuth, async (req, res): Promise<void> => {
  const userId = req.user!.userId;
  const allRequests = await db.select().from(requestsTable).where(eq(requestsTable.customerId, userId));

  const activeStatuses = ["requested", "accepted", "in_progress"];
  const activeRequests = allRequests.filter(r => activeStatuses.includes(r.status)).length;
  const completedRequests = allRequests.filter(r => r.status === "completed").length;
  const totalSpent = allRequests
    .filter(r => r.status === "completed")
    .reduce((s, r) => s + (r.agreedPrice ?? r.offeredPrice ?? 0), 0);

  const recent = allRequests
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentEnriched = await Promise.all(recent.map(r => getRequestWithUsers(r.id)));

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
  const userId = req.user!.userId;
  const allDeliveries = await db.select().from(requestsTable).where(eq(requestsTable.providerId, userId));

  const activeStatuses = ["accepted", "in_progress"];
  const activeDeliveries = allDeliveries.filter(r => activeStatuses.includes(r.status)).length;
  const completedDeliveries = allDeliveries.filter(r => r.status === "completed").length;
  const totalEarnings = allDeliveries
    .filter(r => r.status === "completed")
    .reduce((s, r) => s + (r.agreedPrice ?? 0), 0);

  const [providerUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const averageRating = providerUser?.rating ?? 0;

  const pendingRequests = await db.select().from(requestsTable)
    .where(eq(requestsTable.status, "requested"));

  const recent = allDeliveries
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const recentEnriched = await Promise.all(recent.map(r => getRequestWithUsers(r.id)));

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
