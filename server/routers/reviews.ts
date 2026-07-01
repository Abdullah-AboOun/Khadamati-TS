import { router, protectedProcedure } from "../trpc";
import { db, schema } from "../db";
import { createReviewSchema } from "../../shared/schemas";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const reviewsRouter = router({
  create: protectedProcedure.input(createReviewSchema).mutation(async ({ ctx, input }) => {
    // Verify the order exists, belongs to this client, and is completed
    const [order] = await db
      .select()
      .from(schema.order)
      .where(
        and(
          eq(schema.order.id, input.orderId),
          eq(schema.order.clientId, ctx.user.id),
          eq(schema.order.status, "completed"),
        ),
      )
      .limit(1);

    if (!order) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "لا يمكن تقييم هذا الطلب",
      });
    }

    // Check if review already exists
    const [existing] = await db
      .select()
      .from(schema.review)
      .where(eq(schema.review.orderId, input.orderId))
      .limit(1);

    if (existing) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "تم تقييم هذا الطلب مسبقاً",
      });
    }

    const [review] = await db
      .insert(schema.review)
      .values({
        orderId: input.orderId,
        clientId: ctx.user.id,
        serviceId: order.serviceId,
        rating: input.rating,
        comment: input.comment,
      })
      .returning();

    return review;
  }),

  getByService: protectedProcedure
    .input(z.object({ serviceId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return db
        .select({
          id: schema.review.id,
          rating: schema.review.rating,
          comment: schema.review.comment,
          createdAt: schema.review.createdAt,
          clientName: schema.user.name,
          clientImage: schema.user.image,
        })
        .from(schema.review)
        .leftJoin(schema.user, eq(schema.review.clientId, schema.user.id))
        .where(eq(schema.review.serviceId, input.serviceId))
        .orderBy(desc(schema.review.createdAt));
    }),
});
