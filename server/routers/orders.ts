import { router, protectedProcedure, providerProcedure } from "../trpc"
import { db, schema } from "../db"
import {
  createOrderSchema,
  requestQuoteSchema,
  respondToQuoteSchema,
  updateOrderStatusSchema,
} from "../../shared/schemas"
import { eq, and, desc } from "drizzle-orm"
import { TRPCError } from "@trpc/server"

export const ordersRouter = router({
  // Client places a fixed-price order
  create: protectedProcedure
    .input(createOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const [svc] = await db
        .select()
        .from(schema.service)
        .where(eq(schema.service.id, input.serviceId))
        .limit(1)

      if (!svc || !svc.isActive) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الخدمة غير متاحة" })
      }
      if (svc.pricingType !== "fixed" || !svc.price) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "هذه الخدمة تتطلب طلب تسعير",
        })
      }
      if (svc.providerId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "لا يمكنك طلب خدمتك الخاصة",
        })
      }

      const [order] = await db
        .insert(schema.order)
        .values({
          clientId: ctx.user.id,
          providerId: svc.providerId,
          serviceId: input.serviceId,
          amount: svc.price,
          status: "pending",
          details: input.details,
          notes: input.notes,
        })
        .returning()

      return order
    }),

  // Client requests a quote
  requestQuote: protectedProcedure
    .input(requestQuoteSchema)
    .mutation(async ({ ctx, input }) => {
      const [svc] = await db
        .select()
        .from(schema.service)
        .where(eq(schema.service.id, input.serviceId))
        .limit(1)

      if (!svc || !svc.isActive) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الخدمة غير متاحة" })
      }
      if (svc.providerId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "لا يمكنك طلب خدمتك الخاصة",
        })
      }

      const [order] = await db
        .insert(schema.order)
        .values({
          clientId: ctx.user.id,
          providerId: svc.providerId,
          serviceId: input.serviceId,
          status: "pending",
          details: input.description,
        })
        .returning()

      return order
    }),

  // Provider responds with a price
  respondToQuote: providerProcedure
    .input(respondToQuoteSchema)
    .mutation(async ({ ctx, input }) => {
      const [order] = await db
        .select()
        .from(schema.order)
        .where(
          and(
            eq(schema.order.id, input.orderId),
            eq(schema.order.providerId, ctx.user.id),
            eq(schema.order.status, "pending")
          )
        )
        .limit(1)

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "الطلب غير موجود أو لا يمكن تسعيره",
        })
      }

      const [updated] = await db
        .update(schema.order)
        .set({
          amount: input.quotedPrice,
          status: "quoted",
          updatedAt: new Date(),
        })
        .where(eq(schema.order.id, input.orderId))
        .returning()

      return updated
    }),

  // Client accepts/rejects quote, or provider updates status
  updateStatus: protectedProcedure
    .input(updateOrderStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const [order] = await db
        .select()
        .from(schema.order)
        .where(eq(schema.order.id, input.orderId))
        .limit(1)

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود" })
      }

      // Authorization: only client or provider of this order can update
      const isClient = order.clientId === ctx.user.id
      const isProvider = order.providerId === ctx.user.id
      const isAdmin = ctx.user.role === "admin"

      if (!isClient && !isProvider && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح" })
      }

      // Clients can only accept/reject quotes or cancel
      if (isClient && !["accepted", "cancelled"].includes(input.status)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "إجراء غير مسموح",
        })
      }

      const [updated] = await db
        .update(schema.order)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(schema.order.id, input.orderId))
        .returning()

      return updated
    }),

  // Client's orders
  getMyOrders: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select({
        id: schema.order.id,
        amount: schema.order.amount,
        status: schema.order.status,
        details: schema.order.details,
        createdAt: schema.order.createdAt,
        serviceTitle: schema.service.title,
        providerName: schema.user.name,
      })
      .from(schema.order)
      .leftJoin(schema.service, eq(schema.order.serviceId, schema.service.id))
      .leftJoin(schema.user, eq(schema.order.providerId, schema.user.id))
      .where(eq(schema.order.clientId, ctx.user.id))
      .orderBy(desc(schema.order.createdAt))
  }),

  // Provider's received orders
  getProviderOrders: providerProcedure.query(async ({ ctx }) => {
    return db
      .select({
        id: schema.order.id,
        amount: schema.order.amount,
        status: schema.order.status,
        details: schema.order.details,
        createdAt: schema.order.createdAt,
        serviceTitle: schema.service.title,
        clientName: schema.user.name,
      })
      .from(schema.order)
      .leftJoin(schema.service, eq(schema.order.serviceId, schema.service.id))
      .leftJoin(schema.user, eq(schema.order.clientId, schema.user.id))
      .where(eq(schema.order.providerId, ctx.user.id))
      .orderBy(desc(schema.order.createdAt))
  }),

  getById: protectedProcedure
    .input(updateOrderStatusSchema.pick({ orderId: true }))
    .query(async ({ ctx, input }) => {
      const [order] = await db
        .select({
          id: schema.order.id,
          amount: schema.order.amount,
          status: schema.order.status,
          details: schema.order.details,
          notes: schema.order.notes,
          createdAt: schema.order.createdAt,
          updatedAt: schema.order.updatedAt,
          serviceId: schema.service.id,
          serviceTitle: schema.service.title,
          clientId: schema.order.clientId,
          providerId: schema.order.providerId,
        })
        .from(schema.order)
        .leftJoin(schema.service, eq(schema.order.serviceId, schema.service.id))
        .where(eq(schema.order.id, input.orderId))
        .limit(1)

      if (!order) return null

      // Only involved parties can view
      if (
        order.clientId !== ctx.user.id &&
        order.providerId !== ctx.user.id &&
        ctx.user.role !== "admin"
      ) {
        throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح" })
      }

      return order
    }),
})
