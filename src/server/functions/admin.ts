import { createServerFn } from "@tanstack/react-start";
import { db, schema } from "../../../server/db";
import { auth } from "../../../server/auth";
import { requireAdmin } from "../auth.server";
import {
  adminUpdateUserSchema,
  adminUpdateSettingsSchema,
  adminCreateUserSchema,
  adminEditUserSchema,
  adminCreateServiceSchema,
  adminEditServiceSchema,
} from "../../../shared/schemas";
import { eq, count, sql, desc, and, gte, lte, aliasedTable, or } from "drizzle-orm";
import { z } from "zod";

export const getAdminStatsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();

  const [[usersCount], [servicesCount], [ordersCount], [completedRevenue], [commissionSetting]] =
    await Promise.all([
      db.select({ total: count() }).from(schema.user),
      db.select({ total: count() }).from(schema.service).where(eq(schema.service.isDeleted, false)),
      db.select({ total: count() }).from(schema.order),
      db
        .select({
          total: sql<number>`COALESCE(SUM(${schema.order.amount}), 0)`,
        })
        .from(schema.order)
        .where(
          or(eq(schema.order.status, "completed"), eq(schema.order.paymentStatus, "completed")),
        ),
      db.select().from(schema.setting).where(eq(schema.setting.key, "commission_rate")).limit(1),
    ]);

  const commissionRate = commissionSetting ? parseFloat(commissionSetting.value) : 0.1;
  const commission = (completedRevenue?.total ?? 0) * commissionRate;

  return {
    totalUsers: usersCount.total,
    totalServices: servicesCount.total,
    totalOrders: ordersCount.total,
    totalRevenue: completedRevenue?.total ?? 0,
    totalCommission: commission,
    commissionRate,
  };
});

export const getAdminUsersFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        role: z.enum(["client", "provider", "admin"]).optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      })
      .parse(input),
  )
  .handler(async ({ data: input }) => {
    await requireAdmin();
    const { role, page, limit } = input;
    const offset = (page - 1) * limit;

    const conditions = role ? [eq(schema.user.role, role)] : [];

    const users = await db
      .select({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        role: schema.user.role,
        isActive: schema.user.isActive,
        city: schema.user.city,
        createdAt: schema.user.createdAt,
      })
      .from(schema.user)
      .where(conditions.length ? conditions[0] : undefined)
      .orderBy(desc(schema.user.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(schema.user)
      .where(conditions.length ? conditions[0] : undefined);

    return { users, total, pages: Math.ceil(total / limit) };
  });

export const toggleUserActiveFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => adminUpdateUserSchema.parse(input))
  .handler(async ({ data: input }) => {
    await requireAdmin();
    const updates: Record<string, unknown> = {};
    if (input.isActive !== undefined) updates.isActive = input.isActive;
    if (input.role !== undefined) updates.role = input.role;
    updates.updatedAt = new Date();

    const [updated] = await db
      .update(schema.user)
      .set(updates)
      .where(eq(schema.user.id, String(input.userId)))
      .returning();

    return updated;
  });

export const getFinancialReportFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        year: z.number().int().optional(),
        month: z.number().int().min(1).max(12).optional(),
      })
      .optional()
      .parse(input),
  )
  .handler(async ({ data: input }) => {
    await requireAdmin();

    const conditions = [
      or(eq(schema.order.status, "completed"), eq(schema.order.paymentStatus, "completed")),
    ];

    if (input?.year !== undefined && input?.month !== undefined) {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59, 999);
      conditions.push(gte(schema.order.createdAt, startDate), lte(schema.order.createdAt, endDate));
    }

    const orders = await db
      .select({
        id: schema.order.id,
        amount: schema.order.amount,
        status: schema.order.status,
        createdAt: schema.order.createdAt,
        serviceTitle: schema.service.title,
        clientName: schema.user.name,
      })
      .from(schema.order)
      .leftJoin(schema.service, eq(schema.order.serviceId, schema.service.id))
      .leftJoin(schema.user, eq(schema.order.clientId, schema.user.id))
      .where(and(...conditions))
      .orderBy(desc(schema.order.createdAt));

    return orders;
  });

export const getTopProvidersFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
      })
      .parse(input),
  )
  .handler(async ({ data: input }) => {
    await requireAdmin();

    const [commissionSetting] = await db
      .select()
      .from(schema.setting)
      .where(eq(schema.setting.key, "commission_rate"))
      .limit(1);

    const commissionRate = commissionSetting ? parseFloat(commissionSetting.value) : 0.1;

    const startDate = new Date(input.year, input.month - 1, 1);
    const endDate = new Date(input.year, input.month, 0, 23, 59, 59, 999);

    const providerUser = aliasedTable(schema.user, "provider_user");

    const report = await db
      .select({
        providerId: schema.order.providerId,
        providerName: providerUser.name,
        orderCount: count(schema.order.id),
        grossRevenue: sql<number>`COALESCE(SUM(${schema.order.amount}), 0)`,
      })
      .from(schema.order)
      .leftJoin(providerUser, eq(schema.order.providerId, providerUser.id))
      .where(
        and(
          eq(schema.order.status, "completed"),
          gte(schema.order.createdAt, startDate),
          lte(schema.order.createdAt, endDate),
        ),
      )
      .groupBy(schema.order.providerId, providerUser.name)
      .orderBy(desc(sql`SUM(${schema.order.amount})`))
      .limit(10);

    return report.map((item) => {
      const gross = item.grossRevenue || 0;
      const adminCut = gross * commissionRate;
      const net = gross - adminCut;
      return {
        providerId: item.providerId,
        providerName: item.providerName || "غير معروف",
        orderCount: item.orderCount,
        grossRevenue: gross,
        adminCut,
        netToProvider: net,
      };
    });
  });

export const getFinancialChartsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();

  const [commissionSetting] = await db
    .select()
    .from(schema.setting)
    .where(eq(schema.setting.key, "commission_rate"))
    .limit(1);

  const commissionRate = commissionSetting ? parseFloat(commissionSetting.value) : 0.1;

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1, 0, 0, 0, 0);

  const orders = await db
    .select({
      amount: schema.order.amount,
      status: schema.order.status,
      createdAt: schema.order.createdAt,
    })
    .from(schema.order)
    .where(gte(schema.order.createdAt, startDate));

  const monthsList = [];
  const monthNamesAr = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const label = `${monthNamesAr[m - 1]} ${y}`;
    monthsList.push({
      label,
      year: y,
      month: m,
      revenue: 0,
      adminCut: 0,
      providerNet: 0,
      completedCount: 0,
      cancelledCount: 0,
      totalCount: 0,
    });
  }

  for (const order of orders) {
    const orderDate = new Date(order.createdAt);
    const y = orderDate.getFullYear();
    const m = orderDate.getMonth() + 1;
    const monthBucket = monthsList.find((item) => item.year === y && item.month === m);
    if (monthBucket) {
      monthBucket.totalCount += 1;
      if (order.status === "completed") {
        monthBucket.completedCount += 1;
        monthBucket.revenue += order.amount || 0;
      } else if (order.status === "cancelled") {
        monthBucket.cancelledCount += 1;
      }
    }
  }

  const monthlyTrends = monthsList.map((item) => {
    const rev = Math.round(item.revenue * 100) / 100;
    const adminCut = Math.round(rev * commissionRate * 100) / 100;
    const providerNet = Math.round((rev - adminCut) * 100) / 100;
    return {
      ...item,
      revenue: rev,
      adminCut,
      providerNet,
    };
  });

  const topServices = await db
    .select({
      title: schema.service.title,
      revenue: sql<number>`COALESCE(SUM(${schema.order.amount}), 0)`,
      orderCount: count(schema.order.id),
    })
    .from(schema.order)
    .leftJoin(schema.service, eq(schema.order.serviceId, schema.service.id))
    .where(eq(schema.order.status, "completed"))
    .groupBy(schema.order.serviceId, schema.service.title)
    .orderBy(desc(sql`SUM(${schema.order.amount})`))
    .limit(6);

  const formattedTopServices = topServices.map((item) => ({
    title: item.title || "خدمة غير معروفة",
    revenue: Math.round((item.revenue || 0) * 100) / 100,
    orderCount: item.orderCount,
  }));

  const statusCounts = await db
    .select({
      status: schema.order.status,
      count: count(schema.order.id),
    })
    .from(schema.order)
    .groupBy(schema.order.status);

  const orderStatuses: Record<string, number> = {
    pending: 0,
    quoted: 0,
    accepted: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };

  for (const row of statusCounts) {
    if (row.status && row.status in orderStatuses) {
      orderStatuses[row.status] = row.count;
    }
  }

  return {
    monthlyTrends,
    topServices: formattedTopServices,
    orderStatuses,
    commissionRate,
  };
});

export const getAdminOrdersFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        status: z
          .enum(["pending", "quoted", "accepted", "in_progress", "completed", "cancelled"])
          .optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      })
      .parse(input),
  )
  .handler(async ({ data: input }) => {
    await requireAdmin();
    const { status, page, limit } = input;
    const offset = (page - 1) * limit;

    const conditions = status ? [eq(schema.order.status, status)] : [];

    const orders = await db
      .select({
        id: schema.order.id,
        amount: schema.order.amount,
        status: schema.order.status,
        createdAt: schema.order.createdAt,
        serviceTitle: schema.service.title,
        clientName: schema.user.name,
      })
      .from(schema.order)
      .leftJoin(schema.service, eq(schema.order.serviceId, schema.service.id))
      .leftJoin(schema.user, eq(schema.order.clientId, schema.user.id))
      .where(conditions.length ? conditions[0] : undefined)
      .orderBy(desc(schema.order.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(schema.order)
      .where(conditions.length ? conditions[0] : undefined);

    return { orders, total, pages: Math.ceil(total / limit) };
  });

export const getAdminServicesFn = createServerFn({ method: "GET" })
  .validator((input: unknown) =>
    z
      .object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      })
      .parse(input),
  )
  .handler(async ({ data: input }) => {
    await requireAdmin();
    const { page, limit } = input;
    const offset = (page - 1) * limit;

    const services = await db
      .select({
        id: schema.service.id,
        title: schema.service.title,
        pricingType: schema.service.pricingType,
        price: schema.service.price,
        city: schema.service.city,
        isActive: schema.service.isActive,
        createdAt: schema.service.createdAt,
        providerName: schema.user.name,
        categoryName: schema.category.name,
      })
      .from(schema.service)
      .leftJoin(schema.user, eq(schema.service.providerId, schema.user.id))
      .leftJoin(schema.category, eq(schema.service.categoryId, schema.category.id))
      .where(eq(schema.service.isDeleted, false))
      .orderBy(desc(schema.service.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(schema.service)
      .where(eq(schema.service.isDeleted, false));

    return { services, total, pages: Math.ceil(total / limit) };
  });

export const toggleServiceActiveFn = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ id: z.number().int().positive(), isActive: z.boolean() }).parse(input),
  )
  .handler(async ({ data: input }) => {
    await requireAdmin();
    const [updated] = await db
      .update(schema.service)
      .set({ isActive: input.isActive, updatedAt: new Date() })
      .where(eq(schema.service.id, input.id))
      .returning();
    return updated;
  });

export const updateCommissionRateFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => adminUpdateSettingsSchema.parse(input))
  .handler(async ({ data: input }) => {
    await requireAdmin();
    await db
      .update(schema.setting)
      .set({ value: String(input.commissionRate) })
      .where(eq(schema.setting.key, "commission_rate"));
    return { success: true };
  });

export const adminCreateUserFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => adminCreateUserSchema.parse(input))
  .handler(async ({ data: input }) => {
    await requireAdmin();
    const { email, password, name, role, phone, city } = input;

    const response = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!response || !response.user) {
      throw new Error("فشل إنشاء حساب المستخدم");
    }

    const [updated] = await db
      .update(schema.user)
      .set({
        role,
        phone,
        city,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, response.user.id))
      .returning();

    return updated;
  });

export const adminUpdateUserFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => adminEditUserSchema.parse(input))
  .handler(async ({ data: input }) => {
    await requireAdmin();
    const { id, name, email, role, phone, city, isActive } = input;

    const [updated] = await db
      .update(schema.user)
      .set({
        name,
        email,
        role,
        phone,
        city,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, id))
      .returning();

    return updated;
  });

export const adminDeleteUserFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ id: z.string() }).parse(input))
  .handler(async ({ data: input }) => {
    await requireAdmin();
    const userId = input.id;
    await db.transaction(async (tx) => {
      await tx.delete(schema.review).where(eq(schema.review.clientId, userId));

      const services = await tx
        .select({ id: schema.service.id })
        .from(schema.service)
        .where(eq(schema.service.providerId, userId));
      const serviceIds = services.map((s) => s.id);

      if (serviceIds.length > 0) {
        await tx.delete(schema.review).where(
          sql`${schema.review.serviceId} IN (${sql.join(
            serviceIds.map((sid) => sql`${sid}`),
            sql`, `,
          )})`,
        );

        await tx.delete(schema.serviceImage).where(
          sql`${schema.serviceImage.serviceId} IN (${sql.join(
            serviceIds.map((sid) => sql`${sid}`),
            sql`, `,
          )})`,
        );
      }

      await tx
        .delete(schema.order)
        .where(or(eq(schema.order.clientId, userId), eq(schema.order.providerId, userId)));

      await tx.delete(schema.service).where(eq(schema.service.providerId, userId));

      await tx.delete(schema.session).where(eq(schema.session.userId, userId));
      await tx.delete(schema.account).where(eq(schema.account.userId, userId));
      await tx.delete(schema.user).where(eq(schema.user.id, userId));
    });
    return { success: true };
  });

export const adminCreateServiceFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => adminCreateServiceSchema.parse(input))
  .handler(async ({ data: input }) => {
    await requireAdmin();
    const { images, ...serviceData } = input;
    const svc = await db.transaction(async (tx) => {
      const [insertedSvc] = await tx
        .insert(schema.service)
        .values({
          ...serviceData,
        })
        .returning();

      if (images && images.length > 0) {
        await tx.insert(schema.serviceImage).values(
          images.map((url, index) => ({
            serviceId: insertedSvc.id,
            url,
            isMain: index === 0,
            sortOrder: index,
          })),
        );
      }
      return insertedSvc;
    });
    return svc;
  });

export const adminUpdateServiceFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => adminEditServiceSchema.parse(input))
  .handler(async ({ data: input }) => {
    await requireAdmin();
    const { id, images, ...data } = input;
    const updated = await db.transaction(async (tx) => {
      const [updatedSvc] = await tx
        .update(schema.service)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.service.id, id))
        .returning();

      if (images !== undefined) {
        await tx.delete(schema.serviceImage).where(eq(schema.serviceImage.serviceId, id));

        if (images.length > 0) {
          await tx.insert(schema.serviceImage).values(
            images.map((url, index) => ({
              serviceId: id,
              url,
              isMain: index === 0,
              sortOrder: index,
            })),
          );
        }
      }
      return updatedSvc;
    });
    return updated;
  });

export const adminDeleteServiceFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data: input }) => {
    await requireAdmin();
    await db
      .update(schema.service)
      .set({ isDeleted: true, isActive: false, updatedAt: new Date() })
      .where(eq(schema.service.id, input.id));
    return { success: true };
  });
