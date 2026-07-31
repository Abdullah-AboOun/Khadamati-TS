import { createServerFn } from "@tanstack/react-start";
import { db, schema } from "../../../server/db";
import { contactFormSchema } from "../../../shared/schemas";

export const submitContactMessageFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => contactFormSchema.parse(input))
  .handler(async ({ data: input }) => {
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
  });
