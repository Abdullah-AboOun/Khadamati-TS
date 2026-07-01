import { router, publicProcedure, adminProcedure } from "../trpc";
import { db, schema } from "../db";
import { createCategorySchema, updateCategorySchema } from "../../shared/schemas";
import { eq } from "drizzle-orm";

export const categoriesRouter = router({
  list: publicProcedure.query(async () => {
    return db.select().from(schema.category).orderBy(schema.category.name);
  }),

  create: adminProcedure.input(createCategorySchema).mutation(async ({ input }) => {
    const [cat] = await db.insert(schema.category).values(input).returning();
    return cat;
  }),

  update: adminProcedure.input(updateCategorySchema).mutation(async ({ input }) => {
    const { id, ...data } = input;
    const [updated] = await db
      .update(schema.category)
      .set(data)
      .where(eq(schema.category.id, id))
      .returning();
    return updated;
  }),

  delete: adminProcedure
    .input(updateCategorySchema.pick({ id: true }))
    .mutation(async ({ input }) => {
      await db.delete(schema.category).where(eq(schema.category.id, input.id));
      return { success: true };
    }),
});
