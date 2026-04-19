import { Router, type IRouter } from "express";
import { db, ratingsTable, usersTable } from "@workspace/db";
import { eq, avg, count } from "drizzle-orm";
import { CreateRatingBody } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.post("/ratings", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateRatingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [rating] = await db.insert(ratingsTable).values({
    requestId: parsed.data.requestId,
    raterId: req.user!.userId,
    ratedUserId: parsed.data.ratedUserId,
    score: parsed.data.score,
    review: parsed.data.review ?? null,
  }).returning();

  const stats = await db.select({
    avg: avg(ratingsTable.score),
    count: count(ratingsTable.id),
  }).from(ratingsTable).where(eq(ratingsTable.ratedUserId, parsed.data.ratedUserId));

  if (stats[0]) {
    await db.update(usersTable).set({
      rating: parseFloat(stats[0].avg ?? "0"),
      totalRatings: Number(stats[0].count),
    }).where(eq(usersTable.id, parsed.data.ratedUserId));
  }

  res.status(201).json(rating);
});

router.get("/ratings/user/:userId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const userId = parseInt(raw, 10);

  const ratings = await db.select().from(ratingsTable).where(eq(ratingsTable.ratedUserId, userId));
  const total = ratings.length;
  const avgScore = total > 0 ? ratings.reduce((s, r) => s + r.score, 0) / total : 0;

  res.json({ ratings, averageScore: Math.round(avgScore * 10) / 10, totalCount: total });
});

export default router;
