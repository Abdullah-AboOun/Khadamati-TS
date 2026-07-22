import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ─── Users (managed by BetterAuth) ───────────────────────
// BetterAuth creates: user, session, account, verification tables.
// We extend the user table with our custom fields via additionalFields.

// ─── Categories ──────────────────────────────────────────

export const category = sqliteTable("category", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  icon: text("icon"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Services ────────────────────────────────────────────

export const service = sqliteTable("service", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  providerId: text("provider_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => category.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description"),
  pricingType: text("pricing_type", { enum: ["fixed", "quote"] })
    .notNull()
    .default("fixed"),
  price: real("price"),
  city: text("city"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  isDeleted: integer("is_deleted", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Service Images ──────────────────────────────────────

export const serviceImage = sqliteTable("service_image", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  serviceId: integer("service_id")
    .notNull()
    .references(() => service.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  isMain: integer("is_main", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Orders ──────────────────────────────────────────────

export const order = sqliteTable("order", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clientId: text("client_id")
    .notNull()
    .references(() => user.id),
  providerId: text("provider_id")
    .notNull()
    .references(() => user.id),
  serviceId: integer("service_id")
    .notNull()
    .references(() => service.id),
  amount: real("amount"),
  status: text("status", {
    enum: ["pending", "quoted", "accepted", "in_progress", "completed", "cancelled"],
  })
    .notNull()
    .default("pending"),
  paymentStatus: text("payment_status").default("pending"),
  paymentMethod: text("payment_method"),
  paymentProof: text("payment_proof"),
  accountNumber: text("account_number"),
  gatewayTxId: text("gateway_tx_id"),
  notes: text("notes"),
  details: text("details"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Reviews ─────────────────────────────────────────────

export const review = sqliteTable("review", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id")
    .notNull()
    .unique()
    .references(() => order.id, { onDelete: "cascade" }),
  clientId: text("client_id")
    .notNull()
    .references(() => user.id),
  serviceId: integer("service_id")
    .notNull()
    .references(() => service.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Settings ────────────────────────────────────────────

export const setting = sqliteTable("setting", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

// ─── BetterAuth tables ──────────────────────────────────
// These must be defined so Drizzle can reference them.
// BetterAuth manages their lifecycle.

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  // Custom fields
  role: text("role", { enum: ["client", "provider", "admin"] })
    .notNull()
    .default("client"),
  phone: text("phone"),
  city: text("city"),
  bio: text("bio"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const contactMessage = sqliteTable("contact_message", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});
