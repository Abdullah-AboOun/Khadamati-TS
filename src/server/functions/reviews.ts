import { createServerFn } from "@tanstack/react-start";
import { db, schema } from "../../../server/db";
import { requireAuth } from "../auth.server";
import { createReviewSchema } from "../../../shared/schemas";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

export const createReviewFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => createReviewSchema.parse(input))
  .handler(async ({ data: input }) => {
    const session = await requireAuth();

    const [order] = await db
      .select()
      .from(schema.order)
      .where(
        and(
          eq(schema.order.id, input.orderId),
          eq(schema.order.clientId, session.user.id),
          eq(schema.order.status, "completed"),
        ),
      )
      .limit(1);

    if (!order) {
      throw new Error("الطلب غير موجود، أو لم يكتمل بعد، أو ليس ملكك");
    }

    const [existing] = await db
      .select()
      .from(schema.review)
      .where(eq(schema.review.orderId, input.orderId))
      .limit(1);

    if (existing) {
      throw new Error("لقد قمت بتقييم هذا الطلب من قبل");
    }

    const [review] = await db
      .insert(schema.review)
      .values({
        orderId: input.orderId,
        serviceId: order.serviceId,
        clientId: session.user.id,
        rating: input.rating,
        comment: input.comment,
      })
      .returning();

    return review;
  });

export const getReviewsByServiceFn = createServerFn({ method: "GET" })
  .validator((serviceId: unknown) => z.number().int().positive().parse(serviceId))
  .handler(async ({ data: serviceId }) => {
    const reviews = await db
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
      .where(eq(schema.review.serviceId, serviceId))
      .orderBy(desc(schema.review.createdAt));

    return reviews;
  });
