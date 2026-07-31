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
- **Framework**: [TanStack Start](https://tanstack.com/start) with TanStack Router, TanStack Query, and type-safe Server Functions.
- **Styling**: React + Vite + Tailwind CSS v4 + shadcn/ui components.
- **Database**: SQLite (powered by the native `bun:sqlite` database driver) and Drizzle ORM for querying.
- **Authentication**: [BetterAuth](https://better-auth.com) for role-based sessions, API routes, and server-side route guards.
- **Image Processing**: Automatic image uploads processing and WebP conversion using the native Bun.Image API.

---

## 🛠️ Project Structure

```bash
├── server/               # Database schemas, seeds, and auth adapter
│   ├── db/               # SQLite schema definition and seeding script
│   └── auth.ts           # BetterAuth configuration and adapters
├── src/                  # TanStack Start application code
│   ├── components/       # Reusable layout and UI elements (shadcn/ui)
│   ├── routes/           # File-based routes & API routes (TanStack Router)
│   ├── server/           # TanStack Server Functions & auth guards
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

### 4. Run the Development Server

Start the full-stack TanStack Start application:

```bash
bun run dev
```

Open `http://localhost:3000` in your browser.

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
