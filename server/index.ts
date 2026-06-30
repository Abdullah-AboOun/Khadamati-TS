import { Hono } from "hono"
import { cors } from "hono/cors"
import { serveStatic } from "hono/bun"
import { trpcServer } from "@hono/trpc-server"
import { appRouter } from "./router"
import { createContext } from "./trpc"
import { auth } from "./auth"
import { uploadApp } from "./upload"
import { existsSync } from "fs"
import { resolve } from "path"

const app = new Hono()

// ─── Security headers ────────────────────────────────────
app.use("*", async (c, next) => {
  await next()
  c.header("X-Content-Type-Options", "nosniff")
  c.header("X-Frame-Options", "DENY")
  c.header("Referrer-Policy", "strict-origin-when-cross-origin")
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
})

// ─── CORS (dev only) ─────────────────────────────────────
app.use(
  "/api/*",
  cors({
    origin: process.env.APP_URL || "http://localhost:5173",
    credentials: true,
    allowMethods: ["GET", "POST"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
)

// ─── BetterAuth ──────────────────────────────────────────
app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw)
})

// ─── File uploads ────────────────────────────────────────
app.route("/api/upload", uploadApp)

// ─── tRPC ────────────────────────────────────────────────
app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, c) => createContext(c),
  })
)

// ─── Serve uploaded files ────────────────────────────────
app.use(
  "/uploads/*",
  serveStatic({
    root: "./",
    onNotFound: (path, c) => {
      c.header("X-Content-Type-Options", "nosniff")
    },
  })
)

// ─── Serve static frontend (production) ──────────────────
const distPath = resolve(process.cwd(), "dist")
if (existsSync(distPath)) {
  app.use(
    "/*",
    serveStatic({
      root: "./dist",
    })
  )

  // SPA fallback
  app.get("*", serveStatic({ root: "./dist", path: "index.html" }))
}

// ─── Start server ────────────────────────────────────────
const port = parseInt(process.env.PORT || "3000")

console.log(`🚀 Khadamati API running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
