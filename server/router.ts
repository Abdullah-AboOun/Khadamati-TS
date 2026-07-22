import { router } from "./trpc";
import { servicesRouter } from "./routers/services";
import { ordersRouter } from "./routers/orders";
import { reviewsRouter } from "./routers/reviews";
import { adminRouter } from "./routers/admin";
import { statsRouter } from "./routers/stats";
import { contactRouter } from "./routers/contact";
import { jawwalPayRouter } from "./routers/jawwalpay";

export const appRouter = router({
  services: servicesRouter,
  orders: ordersRouter,
  reviews: reviewsRouter,
  admin: adminRouter,
  stats: statsRouter,
  contact: contactRouter,
  jawwalPay: jawwalPayRouter,
});

export type AppRouter = typeof appRouter;
