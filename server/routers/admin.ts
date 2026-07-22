import { router, adminProcedure } from "../trpc";
import { db, schema } from "../db";
import { auth } from "../auth";
import {
  adminUpdateUserSchema,
  adminUpdateSettingsSchema,
  adminCreateUserSchema,
  adminEditUserSchema,
  adminCreateServiceSchema,
  adminEditServiceSchema,
} from "../../shared/schemas";
import { eq, count, sql, desc, and, gte, lte, aliasedTable, or } from "drizzle-orm";
import { z } from "zod";

export const adminRouter = router({
  // Dashboard stats
  stats: adminProcedure.query(async () => {
    const [usersCount] = await db.select({ total: count() }).from(schema.user);
    const [servicesCount] = await db
      .select({ total: count() })
      .from(schema.service)
      .where(eq(schema.service.isDeleted, false));
    const [ordersCount] = await db.select({ total: count() }).from(schema.order);
    const [completedRevenue] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${schema.order.amount}), 0)`,
      })
      .from(schema.order)
      .where(
        or(eq(schema.order.status, "completed"), eq(schema.order.paymentStatus, "completed")),
      );

    const [commissionSetting] = await db
      .select()
      .from(schema.setting)
      .where(eq(schema.setting.key, "commission_rate"))
      .limit(1);

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
  }),

  // User management
  listUsers: adminProcedure
    .input(
      z.object({
        role: z.enum(["client", "provider", "admin"]).optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
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
    }),

  toggleUserActive: adminProcedure.input(adminUpdateUserSchema).mutation(async ({ input }) => {
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
  }),

  // Financial
  financialReport: adminProcedure
    .input(
      z
        .object({
          year: z.number().int().optional(),
          month: z.number().int().min(1).max(12).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const conditions = [
        or(eq(schema.order.status, "completed"), eq(schema.order.paymentStatus, "completed")),
      ];

      if (input?.year !== undefined && input?.month !== undefined) {
        const startDate = new Date(input.year, input.month - 1, 1);
        const endDate = new Date(input.year, input.month, 0, 23, 59, 59, 999);
        conditions.push(
          gte(schema.order.createdAt, startDate),
          lte(schema.order.createdAt, endDate),
        );
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
    }),

  topProviders: adminProcedure
    .input(
      z.object({
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
      }),
    )
    .query(async ({ input }) => {
      // 1. Get commission rate
      const [commissionSetting] = await db
        .select()
        .from(schema.setting)
        .where(eq(schema.setting.key, "commission_rate"))
        .limit(1);

      const commissionRate = commissionSetting ? parseFloat(commissionSetting.value) : 0.1;

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59, 999);

      // 2. Group by provider
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
    }),

  financialCharts: adminProcedure.query(async () => {
    // 1. Get commission rate
    const [commissionSetting] = await db
      .select()
      .from(schema.setting)
      .where(eq(schema.setting.key, "commission_rate"))
      .limit(1);

    const commissionRate = commissionSetting ? parseFloat(commissionSetting.value) : 0.1;

    // 2. Fetch last 12 months trends
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
    const monthNamesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1; // 1-indexed
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

    // Round values and calculate splits
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

    // 3. Top 6 services by completed revenue
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

    const formattedTopServices = topServices.map(item => ({
      title: item.title || "خدمة غير معروفة",
      revenue: Math.round((item.revenue || 0) * 100) / 100,
      orderCount: item.orderCount,
    }));

    // 4. Order statuses breakdown
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
  }),

  // All orders (admin view)
  listOrders: adminProcedure
    .input(
      z.object({
        status: z
          .enum(["pending", "quoted", "accepted", "in_progress", "completed", "cancelled"])
          .optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
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
    }),

  // All services (admin view)
  listServices: adminProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      }),
    )
    .query(async ({ input }) => {
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
    }),

  toggleServiceActive: adminProcedure
    .input(z.object({ id: z.number().int().positive(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(schema.service)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(schema.service.id, input.id))
        .returning();
      return updated;
    }),

  updateCommissionRate: adminProcedure
    .input(adminUpdateSettingsSchema)
    .mutation(async ({ input }) => {
      await db
        .update(schema.setting)
        .set({ value: String(input.commissionRate) })
        .where(eq(schema.setting.key, "commission_rate"));
      return { success: true };
    }),

  createUser: adminProcedure.input(adminCreateUserSchema).mutation(async ({ input }) => {
    const { email, password, name, role, phone, city } = input;

    // Call Better Auth to create the user with password hashing
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

    // Update role and custom fields
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
  }),

  updateUser: adminProcedure.input(adminEditUserSchema).mutation(async ({ input }) => {
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
  }),

  deleteUser: adminProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const userId = input.id;
    await db.transaction(async (tx) => {
      // delete reviews where clientId = userId
      await tx.delete(schema.review).where(eq(schema.review.clientId, userId));

      // get services of provider
      const services = await tx
        .select({ id: schema.service.id })
        .from(schema.service)
        .where(eq(schema.service.providerId, userId));
      const serviceIds = services.map((s) => s.id);

      // delete reviews for services
      if (serviceIds.length > 0) {
        await tx.delete(schema.review).where(
          sql`${schema.review.serviceId} IN (${sql.join(
            serviceIds.map((sid) => sql`${sid}`),
            sql`, `,
          )})`,
        );

        // delete images
        await tx.delete(schema.serviceImage).where(
          sql`${schema.serviceImage.serviceId} IN (${sql.join(
            serviceIds.map((sid) => sql`${sid}`),
            sql`, `,
          )})`,
        );
      }

      // delete orders
      await tx
        .delete(schema.order)
        .where(or(eq(schema.order.clientId, userId), eq(schema.order.providerId, userId)));

      // delete services
      await tx.delete(schema.service).where(eq(schema.service.providerId, userId));

      // delete auth tables and user
      await tx.delete(schema.session).where(eq(schema.session.userId, userId));
      await tx.delete(schema.account).where(eq(schema.account.userId, userId));
      await tx.delete(schema.user).where(eq(schema.user.id, userId));
    });
    return { success: true };
  }),

  createService: adminProcedure.input(adminCreateServiceSchema).mutation(async ({ input }) => {
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
  }),

  updateService: adminProcedure.input(adminEditServiceSchema).mutation(async ({ input }) => {
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
  }),

  deleteService: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      await db
        .update(schema.service)
        .set({ isDeleted: true, isActive: false, updatedAt: new Date() })
        .where(eq(schema.service.id, input.id));
      return { success: true };
    }),
});
