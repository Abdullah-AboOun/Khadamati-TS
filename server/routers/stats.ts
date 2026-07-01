import { router, publicProcedure } from "../trpc";
import { db, schema } from "../db";
import { eq, and, count, sql, gte } from "drizzle-orm";

export const statsRouter = router({
  publicStats: publicProcedure.query(async () => {
    // 1. Total providers count
    const [providersCount] = await db
      .select({ total: count() })
      .from(schema.user)
      .where(eq(schema.user.role, "provider"));

    // 2. Total completed orders
    const [completedOrdersCount] = await db
      .select({ total: count() })
      .from(schema.order)
      .where(eq(schema.order.status, "completed"));

    // 3. Average rating of all reviews
    const [avgRatingResult] = await db
      .select({ avg: sql<number>`COALESCE(AVG(${schema.review.rating}), 0)` })
      .from(schema.review);

    // 4. Today's orders count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [todayOrdersCountResult] = await db
      .select({ total: count() })
      .from(schema.order)
      .where(gte(schema.order.createdAt, startOfToday));

    // 5. Recent providers who joined in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [recentProvidersCountResult] = await db
      .select({ total: count() })
      .from(schema.user)
      .where(and(eq(schema.user.role, "provider"), gte(schema.user.createdAt, sevenDaysAgo)));

    return {
      totalProviders: providersCount.total,
      totalCompletedOrders: completedOrdersCount.total,
      avgRating: Math.round((avgRatingResult?.avg ?? 0) * 10) / 10, // 1 decimal place
      todayOrdersCount: todayOrdersCountResult.total,
      recentProvidersCount: recentProvidersCountResult.total,
    };
  }),
});
