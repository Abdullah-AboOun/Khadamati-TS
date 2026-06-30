# Khadamati (خدماتي)

**Khadamati** is a comprehensive and easy-to-use platform that connects clients with local and freelance service providers. The application features a fully responsive design tailored for Arabic (RTL) layouts, facilitating seamless service listing, booking, order tracking, billing, and reviews.

---

## 🚀 Key Features

### 🧑‍💻 Roles & User Experiences
- **Client**: Browse services by category, search listings, make bookings, proceed through checkout/billing, view order histories, and leave reviews.
- **Service Provider**: Post and manage service listings (CRUD), view incoming customer orders, update order status (accept/decline/quote), and view dashboard analytics.
- **Administrator**: Access a full administration panel to manage users, activate/deactivate listings, manage service categories, and inspect platform financial variables/reports.

### ⚡ Tech Stack & Tooling
- **Runtime**: [Bun](https://bun.sh) (for fast execution, package management, and script running).
- **Frontend**: React + Vite + Tailwind CSS v4 + [TanStack Router](https://tanstack.com/router) for type-safe routing.
- **Backend**: Hono server hosting [tRPC v11](https://trpc.io) for type-safe client-server communications.
- **Database**: SQLite (powered by the native `bun:sqlite` database driver) and Drizzle ORM for querying.
- **Authentication**: [BetterAuth](https://better-auth.com) for role-based sessions and route guards.
- **Image Processing**: Automatic image uploads processing and WebP conversion using the native Bun.Image API.

---

## 🛠️ Project Structure

```bash
├── server/               # Hono backend server, tRPC routers, database, and auth config
│   ├── db/               # SQLite schema definition and seeding script
│   ├── routers/          # tRPC endpoints (Categories, Services, Orders, Admin)
│   └── auth.ts           # BetterAuth configuration and adapters
├── src/                  # Client-side React app code
│   ├── components/       # Reusable layout and UI elements (shadcn/ui)
│   ├── routes/           # File-based routes (TanStack Router)
│   ├── lib/              # tRPC and Auth clients (trpc-client, auth-client)
│   └── main.tsx          # Application entry point
├── shared/               # Shared validation schemas (Zod) and constants
└── drizzle.config.ts     # Drizzle Kit configuration for DB pushes/migrations
```

---

## 🏁 Getting Started

### Prerequisites
Make sure you have [Bun](https://bun.sh) installed.

### 1. Install Dependencies
```bash
bun install
```

### 2. Push Database Schema
Initialize or update the SQLite database schemas:
```bash
bun run db:push
```

### 3. Seed Initial Data
Seed the application with default categories, initial system parameters, and an admin account:
```bash
bun run db:seed
```

### 4. Run the Development Servers
Start both the Vite client frontend proxy and the Hono backend dev server concurrently:
```bash
bun run dev
```
Open `http://localhost:5173` in your browser.

---

## 🏗️ Production Build

To run type checking, bundle assets, and build for production:
```bash
bun run build
```

To run the production server:
```bash
bun start
```

---

## 📝 License
Copyright © 2026. All rights reserved.
