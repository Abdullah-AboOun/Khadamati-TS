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

export type TRPCContext = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
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
