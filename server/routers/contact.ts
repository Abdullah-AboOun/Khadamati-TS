import { router, publicProcedure } from "../trpc";
import { db, schema } from "../db";
import { contactFormSchema } from "../../shared/schemas";

export const contactRouter = router({
  submit: publicProcedure.input(contactFormSchema).mutation(async ({ input }) => {
    const [message] = await db
      .insert(schema.contactMessage)
      .values({
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
      })
      .returning();

    return message;
  }),
});
