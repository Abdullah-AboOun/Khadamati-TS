import { router, publicProcedure } from "../trpc";
import { db, schema } from "../db";
import { eq, and, count, sql, gte } from "drizzle-orm";

export const statsRouter = router({
  publicStats: publicProcedure.query(async () => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      [providersCount],
      [completedOrdersCount],
      [avgRatingResult],
      [todayOrdersCountResult],
      [recentProvidersCountResult],
    ] = await Promise.all([
      db
        .select({ total: count() })
        .from(schema.user)
        .where(eq(schema.user.role, "provider")),
      db
        .select({ total: count() })
        .from(schema.order)
        .where(eq(schema.order.status, "completed")),
      db
        .select({ avg: sql<number>`COALESCE(AVG(${schema.review.rating}), 0)` })
        .from(schema.review),
      db
        .select({ total: count() })
        .from(schema.order)
        .where(gte(schema.order.createdAt, startOfToday)),
      db
        .select({ total: count() })
        .from(schema.user)
        .where(and(eq(schema.user.role, "provider"), gte(schema.user.createdAt, sevenDaysAgo))),
    ]);

    return {
      totalProviders: providersCount.total,
      totalCompletedOrders: completedOrdersCount.total,
      avgRating: Math.round((avgRatingResult?.avg ?? 0) * 10) / 10, // 1 decimal place
      todayOrdersCount: todayOrdersCountResult.total,
      recentProvidersCount: recentProvidersCountResult.total,
    };
  }),
});
