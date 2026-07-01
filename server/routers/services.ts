import { router, publicProcedure, providerProcedure } from "../trpc"
import { db, schema } from "../db"
import {
  createServiceSchema,
  updateServiceSchema,
  serviceFilterSchema,
} from "../../shared/schemas"
import { eq, and, like, gte, lte, desc, sql, count } from "drizzle-orm"
import { z } from "zod"

export const servicesRouter = router({
  list: publicProcedure.input(serviceFilterSchema).query(async ({ input }) => {
    const { search, categoryId, city, minPrice, maxPrice, page, limit } = input
    const offset = (page - 1) * limit

    const conditions = [eq(schema.service.isActive, true)]

    if (search) {
      conditions.push(like(schema.service.title, `%${search}%`))
    }
    if (categoryId) {
      conditions.push(eq(schema.service.categoryId, categoryId))
    }
    if (city) {
      conditions.push(eq(schema.service.city, city))
    }
    if (minPrice !== undefined) {
      conditions.push(gte(schema.service.price, minPrice))
    }
    if (maxPrice !== undefined) {
      conditions.push(lte(schema.service.price, maxPrice))
    }

    const where = and(...conditions)

    const [services, [{ total }]] = await Promise.all([
      db
        .select({
          id: schema.service.id,
          title: schema.service.title,
          description: schema.service.description,
          pricingType: schema.service.pricingType,
          price: schema.service.price,
          city: schema.service.city,
          createdAt: schema.service.createdAt,
          providerName: schema.user.name,
          providerId: schema.user.id,
          categoryName: schema.category.name,
          categorySlug: schema.category.slug,
        })
        .from(schema.service)
        .leftJoin(schema.user, eq(schema.service.providerId, schema.user.id))
        .leftJoin(
          schema.category,
          eq(schema.service.categoryId, schema.category.id)
        )
        .where(where)
        .orderBy(desc(schema.service.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(schema.service).where(where),
    ])

    // Get main images for these services
    const serviceIds = services.map((s) => s.id)
    const images =
      serviceIds.length > 0
        ? await db
            .select()
            .from(schema.serviceImage)
            .where(
              and(
                eq(schema.serviceImage.isMain, true),
                sql`${schema.serviceImage.serviceId} IN (${sql.join(
                  serviceIds.map((id) => sql`${id}`),
                  sql`, `
                )})`
              )
            )
        : []

    const imageMap = new Map(images.map((img) => [img.serviceId, img.url]))

    return {
      services: services.map((s) => ({
        ...s,
        mainImage: imageMap.get(s.id) ?? null,
      })),
      total,
      pages: Math.ceil(total / limit),
    }
  }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      const [svc] = await db
        .select({
          id: schema.service.id,
          title: schema.service.title,
          description: schema.service.description,
          pricingType: schema.service.pricingType,
          price: schema.service.price,
          city: schema.service.city,
          isActive: schema.service.isActive,
          createdAt: schema.service.createdAt,
          providerId: schema.user.id,
          providerName: schema.user.name,
          providerBio: schema.user.bio,
          providerImage: schema.user.image,
          providerPhone: schema.user.phone,
          categoryId: schema.category.id,
          categoryName: schema.category.name,
        })
        .from(schema.service)
        .leftJoin(schema.user, eq(schema.service.providerId, schema.user.id))
        .leftJoin(
          schema.category,
          eq(schema.service.categoryId, schema.category.id)
        )
        .where(eq(schema.service.id, input.id))
        .limit(1)

      if (!svc) return null

      const images = await db
        .select()
        .from(schema.serviceImage)
        .where(eq(schema.serviceImage.serviceId, input.id))
        .orderBy(schema.serviceImage.sortOrder)

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
        .where(eq(schema.review.serviceId, input.id))
        .orderBy(desc(schema.review.createdAt))

      const avgRating = reviews.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0

      return { ...svc, images, reviews, avgRating, reviewCount: reviews.length }
    }),

  getMyServices: providerProcedure.query(async ({ ctx }) => {
    const services = await db
      .select()
      .from(schema.service)
      .where(eq(schema.service.providerId, ctx.user.id))
      .orderBy(desc(schema.service.createdAt))

    const serviceIds = services.map((s) => s.id)
    const images =
      serviceIds.length > 0
        ? await db
            .select()
            .from(schema.serviceImage)
            .where(
              sql`${schema.serviceImage.serviceId} IN (${sql.join(
                serviceIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
            .orderBy(schema.serviceImage.sortOrder)
        : []

    const imagesByServiceId = new Map<number, { id: number; url: string }[]>()
    for (const img of images) {
      if (!imagesByServiceId.has(img.serviceId)) {
        imagesByServiceId.set(img.serviceId, [])
      }
      imagesByServiceId.get(img.serviceId)!.push({ id: img.id, url: img.url })
    }

    return services.map((s) => ({
      ...s,
      images: imagesByServiceId.get(s.id) ?? [],
    }))
  }),

  create: providerProcedure
    .input(createServiceSchema)
    .mutation(async ({ ctx, input }) => {
      const { images, ...serviceData } = input

      const svc = await db.transaction(async (tx) => {
        const [insertedSvc] = await tx
          .insert(schema.service)
          .values({
            ...serviceData,
            providerId: ctx.user.id,
          })
          .returning()

        if (images && images.length > 0) {
          await tx.insert(schema.serviceImage).values(
            images.map((url, index) => ({
              serviceId: insertedSvc.id,
              url,
              isMain: index === 0,
              sortOrder: index,
            }))
          )
        }

        return insertedSvc
      })

      return svc
    }),

  update: providerProcedure
    .input(updateServiceSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, images, ...data } = input

      // Verify ownership
      const [existing] = await db
        .select()
        .from(schema.service)
        .where(
          and(
            eq(schema.service.id, id),
            eq(schema.service.providerId, ctx.user.id)
          )
        )
        .limit(1)

      if (!existing) {
        throw new Error("الخدمة غير موجودة أو ليست ملكك")
      }

      const updated = await db.transaction(async (tx) => {
        const [updatedSvc] = await tx
          .update(schema.service)
          .set({ ...data, updatedAt: new Date() })
          .where(eq(schema.service.id, id))
          .returning()

        if (images !== undefined) {
          // Delete old images
          await tx
            .delete(schema.serviceImage)
            .where(eq(schema.serviceImage.serviceId, id))

          // Insert new ones if any
          if (images.length > 0) {
            await tx.insert(schema.serviceImage).values(
              images.map((url, index) => ({
                serviceId: id,
                url,
                isMain: index === 0,
                sortOrder: index,
              }))
            )
          }
        }

        return updatedSvc
      })

      return updated
    }),

  delete: providerProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await db
        .select()
        .from(schema.service)
        .where(
          and(
            eq(schema.service.id, input.id),
            eq(schema.service.providerId, ctx.user.id)
          )
        )
        .limit(1)

      if (!existing) {
        throw new Error("الخدمة غير موجودة أو ليست ملكك")
      }

      await db.delete(schema.service).where(eq(schema.service.id, input.id))
      return { success: true }
    }),
})
