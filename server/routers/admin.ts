import { router, adminProcedure } from "../trpc"
import { db, schema } from "../db"
import {
  adminUpdateUserSchema,
  adminUpdateSettingsSchema,
} from "../../shared/schemas"
import { eq, count, sql, desc } from "drizzle-orm"
import { z } from "zod"

export const adminRouter = router({
  // Dashboard stats
  stats: adminProcedure.query(async () => {
    const [usersCount] = await db.select({ total: count() }).from(schema.user)
    const [servicesCount] = await db
      .select({ total: count() })
      .from(schema.service)
    const [ordersCount] = await db.select({ total: count() }).from(schema.order)
    const [completedRevenue] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${schema.order.amount}), 0)`,
      })
      .from(schema.order)
      .where(eq(schema.order.status, "completed"))

    const [commissionSetting] = await db
      .select()
      .from(schema.setting)
      .where(eq(schema.setting.key, "commission_rate"))
      .limit(1)

    const commissionRate = commissionSetting
      ? parseFloat(commissionSetting.value)
      : 0.1
    const commission = (completedRevenue?.total ?? 0) * commissionRate

    return {
      totalUsers: usersCount.total,
      totalServices: servicesCount.total,
      totalOrders: ordersCount.total,
      totalRevenue: completedRevenue?.total ?? 0,
      totalCommission: commission,
      commissionRate,
    }
  }),

  // User management
  listUsers: adminProcedure
    .input(
      z.object({
        role: z.enum(["client", "provider", "admin"]).optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const { role, page, limit } = input
      const offset = (page - 1) * limit

      const conditions = role ? [eq(schema.user.role, role)] : []

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
        .offset(offset)

      const [{ total }] = await db
        .select({ total: count() })
        .from(schema.user)
        .where(conditions.length ? conditions[0] : undefined)

      return { users, total, pages: Math.ceil(total / limit) }
    }),

  toggleUserActive: adminProcedure
    .input(adminUpdateUserSchema)
    .mutation(async ({ input }) => {
      const updates: Record<string, unknown> = {}
      if (input.isActive !== undefined) updates.isActive = input.isActive
      if (input.role !== undefined) updates.role = input.role
      updates.updatedAt = new Date()

      const [updated] = await db
        .update(schema.user)
        .set(updates)
        .where(eq(schema.user.id, String(input.userId)))
        .returning()

      return updated
    }),

  // Financial
  financialReport: adminProcedure.query(async () => {
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
      .where(eq(schema.order.status, "completed"))
      .orderBy(desc(schema.order.createdAt))

    return orders
  }),

  // All orders (admin view)
  listOrders: adminProcedure
    .input(
      z.object({
        status: z
          .enum([
            "pending",
            "quoted",
            "accepted",
            "in_progress",
            "completed",
            "cancelled",
          ])
          .optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const { status, page, limit } = input
      const offset = (page - 1) * limit

      const conditions = status ? [eq(schema.order.status, status)] : []

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
        .offset(offset)

      const [{ total }] = await db
        .select({ total: count() })
        .from(schema.order)
        .where(conditions.length ? conditions[0] : undefined)

      return { orders, total, pages: Math.ceil(total / limit) }
    }),

  // All services (admin view)
  listServices: adminProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const { page, limit } = input
      const offset = (page - 1) * limit

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
        .leftJoin(
          schema.category,
          eq(schema.service.categoryId, schema.category.id)
        )
        .orderBy(desc(schema.service.createdAt))
        .limit(limit)
        .offset(offset)

      const [{ total }] = await db
        .select({ total: count() })
        .from(schema.service)

      return { services, total, pages: Math.ceil(total / limit) }
    }),

  toggleServiceActive: adminProcedure
    .input(z.object({ id: z.number().int().positive(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(schema.service)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(schema.service.id, input.id))
        .returning()
      return updated
    }),

  updateCommissionRate: adminProcedure
    .input(adminUpdateSettingsSchema)
    .mutation(async ({ input }) => {
      await db
        .update(schema.setting)
        .set({ value: String(input.commissionRate) })
        .where(eq(schema.setting.key, "commission_rate"))
      return { success: true }
    }),
})
