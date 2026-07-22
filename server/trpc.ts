import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "hono";
import { auth } from "./auth";
import { db } from "./db";
import superjson from "superjson";

export async function createContext(c: Context) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  return {
    db,
    session: session?.session ?? null,
    user: session?.user ?? null,
    headers: c.req.raw.headers,
  };
}

import { ZodError } from "zod";

export type TRPCContext = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    let message = error.message;
    try {
      if (error.cause instanceof ZodError) {
        const issues = error.cause.issues || (error.cause as any).errors || [];
        if (issues.length > 0) {
          message = issues.map((e: any) => e.message).join("، ");
        }
      } else if (
        error.cause &&
        (error.cause.name === "ZodError" || "errors" in error.cause || "issues" in error.cause)
      ) {
        const causeErrors = (error.cause as any).issues || (error.cause as any).errors;
        if (Array.isArray(causeErrors) && causeErrors.length > 0) {
          message = causeErrors.map((e: any) => e.message).join("، ");
        }
      } else if (message.startsWith("[") && message.endsWith("]")) {
        try {
          const parsed = JSON.parse(message);
          if (
            Array.isArray(parsed) &&
            parsed.every((item) => item && typeof item === "object" && "message" in item)
          ) {
            message = parsed.map((e: any) => e.message).join("، ");
          }
        } catch {
          // Ignore
        }
      }
    } catch (err) {
      console.error("Error in errorFormatter:", err);
    }
    return {
      ...shape,
      message,
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware: must be logged in
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "يجب تسجيل الدخول" });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.user,
    },
  });
});

// Middleware: must be a provider
const isProvider = t.middleware(({ ctx, next }) => {
  if (!ctx.user || (ctx.user.role !== "provider" && ctx.user.role !== "admin")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "هذا الإجراء متاح لمزودي الخدمات فقط",
    });
  }
  return next({ ctx: { session: ctx.session!, user: ctx.user } });
});

// Middleware: must be admin
const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "هذا الإجراء متاح للمديرين فقط",
    });
  }
  return next({ ctx: { session: ctx.session!, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const providerProcedure = t.procedure.use(isAuthed).use(isProvider);
export const adminProcedure = t.procedure.use(isAuthed).use(isAdmin);
