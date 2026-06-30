import { router } from "./trpc"
import { servicesRouter } from "./routers/services"
import { ordersRouter } from "./routers/orders"
import { reviewsRouter } from "./routers/reviews"
import { categoriesRouter } from "./routers/categories"
import { adminRouter } from "./routers/admin"
import { statsRouter } from "./routers/stats"
import { contactRouter } from "./routers/contact"

export const appRouter = router({
  services: servicesRouter,
  orders: ordersRouter,
  reviews: reviewsRouter,
  categories: categoriesRouter,
  admin: adminRouter,
  stats: statsRouter,
  contact: contactRouter,
})

export type AppRouter = typeof appRouter
