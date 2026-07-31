import { createServerFn } from "@tanstack/react-start";
import { db, schema } from "../../../server/db";
import { requireAuth, requireProvider } from "../auth.server";
import {
  createOrderSchema,
  requestQuoteSchema,
  respondToQuoteSchema,
  updateOrderStatusSchema,
} from "../../../shared/schemas";
import { eq, and, desc, aliasedTable } from "drizzle-orm";
import { z } from "zod";

export const createOrderFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => createOrderSchema.parse(input))
  .handler(async ({ data: input }) => {
    const session = await requireAuth();

    const [service] = await db
      .select()
      .from(schema.service)
      .where(and(eq(schema.service.id, input.serviceId), eq(schema.service.isActive, true)))
      .limit(1);

    if (!service) {
      throw new Error("الخدمة غير متاح حالياً");
    }

    if (service.providerId === session.user.id) {
      throw new Error("لا يمكنك طلب خدمتك الخاصة");
    }

    const initialStatus = service.pricingType === "quote" ? "pending" : "accepted";
    const initialAmount = service.pricingType === "fixed" ? service.price : null;

    const [order] = await db
      .insert(schema.order)
      .values({
        serviceId: input.serviceId,
        clientId: session.user.id,
        providerId: service.providerId,
        status: initialStatus,
        amount: initialAmount,
        details: input.details,
        notes: input.notes,
      })
      .returning();

    return order;
  });

export const requestQuoteFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => requestQuoteSchema.parse(input))
  .handler(async ({ data: input }) => {
    const session = await requireAuth();

    const [service] = await db
      .select()
      .from(schema.service)
      .where(and(eq(schema.service.id, input.serviceId), eq(schema.service.isActive, true)))
      .limit(1);

    if (!service) {
      throw new Error("الخدمة غير متاح حالياً");
    }

    const [order] = await db
      .insert(schema.order)
      .values({
        serviceId: input.serviceId,
        clientId: session.user.id,
        providerId: service.providerId,
        status: "pending",
        amount: null,
        details: input.description,
      })
      .returning();

    return order;
  });

export const respondToQuoteFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => respondToQuoteSchema.parse(input))
  .handler(async ({ data: input }) => {
    const session = await requireProvider();

    const [order] = await db
      .select()
      .from(schema.order)
      .where(and(eq(schema.order.id, input.orderId), eq(schema.order.providerId, session.user.id)))
      .limit(1);

    if (!order) {
      throw new Error("الطلب غير موجود أو ليس ملكك");
    }

    const [updated] = await db
      .update(schema.order)
      .set({
        amount: input.quotedPrice,
        status: "quoted",
        updatedAt: new Date(),
      })
      .where(eq(schema.order.id, input.orderId))
      .returning();

    return updated;
  });

export const updateOrderStatusFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => updateOrderStatusSchema.parse(input))
  .handler(async ({ data: input }) => {
    const session = await requireAuth();

    const [order] = await db
      .select()
      .from(schema.order)
      .where(eq(schema.order.id, input.orderId))
      .limit(1);

    if (!order) {
      throw new Error("الطلب غير موجود");
    }

    const isClient = order.clientId === session.user.id;
    const isProvider = order.providerId === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isClient && !isProvider && !isAdmin) {
      throw new Error("غير مصرح لك بتحديث هذا الطلب");
    }

    const updateData: Partial<typeof schema.order.$inferInsert> = {
      status: input.status,
      updatedAt: new Date(),
    };

    if (input.paymentStatus) updateData.paymentStatus = input.paymentStatus;
    if (input.paymentMethod) updateData.paymentMethod = input.paymentMethod;
    if (input.paymentProof) updateData.paymentProof = input.paymentProof;
    if (input.accountNumber) updateData.accountNumber = input.accountNumber;
    if (input.gatewayTxId) updateData.gatewayTxId = input.gatewayTxId;
    if (input.details) updateData.details = input.details;

    const [updated] = await db
      .update(schema.order)
      .set(updateData)
      .where(eq(schema.order.id, input.orderId))
      .returning();

    return updated;
  });

export const getMyOrdersFn = createServerFn({ method: "GET" }).handler(async () => {
  const session = await requireAuth();

  const providerUser = aliasedTable(schema.user, "providerUser");
  const clientUser = aliasedTable(schema.user, "clientUser");

  const orders = await db
    .select({
      id: schema.order.id,
      status: schema.order.status,
      amount: schema.order.amount,
      paymentStatus: schema.order.paymentStatus,
      paymentMethod: schema.order.paymentMethod,
      paymentProof: schema.order.paymentProof,
      accountNumber: schema.order.accountNumber,
      gatewayTxId: schema.order.gatewayTxId,
      details: schema.order.details,
      notes: schema.order.notes,
      createdAt: schema.order.createdAt,
      updatedAt: schema.order.updatedAt,
      serviceId: schema.service.id,
      serviceTitle: schema.service.title,
      pricingType: schema.service.pricingType,
      providerId: providerUser.id,
      providerName: providerUser.name,
      clientId: clientUser.id,
      clientName: clientUser.name,
    })
    .from(schema.order)
    .leftJoin(schema.service, eq(schema.order.serviceId, schema.service.id))
    .leftJoin(providerUser, eq(schema.order.providerId, providerUser.id))
    .leftJoin(clientUser, eq(schema.order.clientId, clientUser.id))
    .where(eq(schema.order.clientId, session.user.id))
    .orderBy(desc(schema.order.createdAt));

  return orders;
});

export const getProviderOrdersFn = createServerFn({ method: "GET" }).handler(async () => {
  const session = await requireProvider();

  const providerUser = aliasedTable(schema.user, "providerUser");
  const clientUser = aliasedTable(schema.user, "clientUser");

  const orders = await db
    .select({
      id: schema.order.id,
      status: schema.order.status,
      amount: schema.order.amount,
      paymentStatus: schema.order.paymentStatus,
      paymentMethod: schema.order.paymentMethod,
      paymentProof: schema.order.paymentProof,
      accountNumber: schema.order.accountNumber,
      gatewayTxId: schema.order.gatewayTxId,
      details: schema.order.details,
      notes: schema.order.notes,
      createdAt: schema.order.createdAt,
      updatedAt: schema.order.updatedAt,
      serviceId: schema.service.id,
      serviceTitle: schema.service.title,
      pricingType: schema.service.pricingType,
      providerId: providerUser.id,
      providerName: providerUser.name,
      clientId: clientUser.id,
      clientName: clientUser.name,
    })
    .from(schema.order)
    .leftJoin(schema.service, eq(schema.order.serviceId, schema.service.id))
    .leftJoin(providerUser, eq(schema.order.providerId, providerUser.id))
    .leftJoin(clientUser, eq(schema.order.clientId, clientUser.id))
    .where(eq(schema.order.providerId, session.user.id))
    .orderBy(desc(schema.order.createdAt));

  return orders;
});

export const getOrderByIdFn = createServerFn({ method: "GET" })
  .validator((orderId: unknown) => z.number().int().positive().parse(orderId))
  .handler(async ({ data: orderId }) => {
    const session = await requireAuth();

    const providerUser = aliasedTable(schema.user, "providerUser");
    const clientUser = aliasedTable(schema.user, "clientUser");

    const [order] = await db
      .select({
        id: schema.order.id,
        status: schema.order.status,
        amount: schema.order.amount,
        paymentStatus: schema.order.paymentStatus,
        paymentMethod: schema.order.paymentMethod,
        paymentProof: schema.order.paymentProof,
        accountNumber: schema.order.accountNumber,
        gatewayTxId: schema.order.gatewayTxId,
        details: schema.order.details,
        notes: schema.order.notes,
        createdAt: schema.order.createdAt,
        updatedAt: schema.order.updatedAt,
        serviceId: schema.service.id,
        serviceTitle: schema.service.title,
        pricingType: schema.service.pricingType,
        categoryName: schema.category.name,
        providerId: providerUser.id,
        providerName: providerUser.name,
        providerImage: providerUser.image,
        providerPhone: providerUser.phone,
        clientId: clientUser.id,
        clientName: clientUser.name,
        clientImage: clientUser.image,
        clientPhone: clientUser.phone,
        reviewId: schema.review.id,
        reviewRating: schema.review.rating,
        reviewComment: schema.review.comment,
      })
      .from(schema.order)
      .leftJoin(schema.service, eq(schema.order.serviceId, schema.service.id))
      .leftJoin(schema.category, eq(schema.service.categoryId, schema.category.id))
      .leftJoin(providerUser, eq(schema.order.providerId, providerUser.id))
      .leftJoin(clientUser, eq(schema.order.clientId, clientUser.id))
      .leftJoin(schema.review, eq(schema.order.id, schema.review.orderId))
      .where(eq(schema.order.id, orderId))
      .limit(1);

    if (!order) return null;

    const isClient = order.clientId === session.user.id;
    const isProvider = order.providerId === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isClient && !isProvider && !isAdmin) {
      throw new Error("غير مصرح لك برؤية هذا الطلب");
    }

    return order;
  });

export const cancelOrderFn = createServerFn({ method: "POST" })
  .validator((orderId: unknown) => z.number().int().positive().parse(orderId))
  .handler(async ({ data: orderId }) => {
    const session = await requireAuth();

    const [order] = await db
      .select()
      .from(schema.order)
      .where(eq(schema.order.id, orderId))
      .limit(1);

    if (!order) throw new Error("الطلب غير موجود");

    const isClient = order.clientId === session.user.id;
    const isProvider = order.providerId === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isClient && !isProvider && !isAdmin) {
      throw new Error("غير مصرح لك بإلغاء هذا الطلب");
    }

    const [updated] = await db
      .update(schema.order)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(schema.order.id, orderId))
      .returning();

    return updated;
  });
