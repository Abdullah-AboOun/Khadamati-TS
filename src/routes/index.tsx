import { createFileRoute, Link } from "@tanstack/react-router"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Zap,
  Droplets,
  Sparkles,
  Hammer,
  Snowflake,
  Palette,
  Code,
  Video,
  PenTool,
  Megaphone,
  MapPin,
} from "lucide-react"
import { formatPrice } from "../../shared/constants"

export const Route = createFileRoute("/")({
  component: HomeComponent,
})

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Droplets,
  SprayCan: Sparkles,
  Hammer,
  Snowflake,
  Palette,
  Code,
  Video,
  PenTool,
  Megaphone,
}

function HomeComponent() {
  // Fetch categories
  const { data: categories, isLoading: catsLoading } =
    trpc.categories.list.useQuery()

  // Fetch latest 6 services
  const { data: servicesData, isLoading: servicesLoading } =
    trpc.services.list.useQuery({
      limit: 6,
    })

  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-background py-20 dark:from-blue-950/10 dark:via-indigo-950/10">
        <div className="container mx-auto px-4 text-center sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            منصة الخدمات المحلية والمستقلة
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            اعثر على أفضل مزودي الخدمات المحترفين في مدينتك، أو اعرض خدماتك
            للعملاء بكل سهولة وأمان.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button asChild size="lg" className="px-8 font-medium">
              <Link to="/services">تصفح الخدمات</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="px-8 font-medium"
            >
              <Link to="/register">ابدأ كمزود خدمة</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            تصفح حسب التصنيف
          </h2>
          <p className="mt-2 text-muted-foreground">
            اختر تصنيف الخدمة التي تحتاج إليها للبدء
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {catsLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))
            : categories?.map((cat) => {
                const IconComponent = cat.icon ? ICON_MAP[cat.icon] || Zap : Zap
                return (
                  <Link
                    key={cat.id}
                    to="/services"
                    search={{ categoryId: cat.id }}
                    className="group flex flex-col items-center justify-center rounded-xl border border-border bg-card p-6 text-center shadow-sm transition-all duration-200 hover:border-primary hover:shadow-md"
                  >
                    <div className="rounded-full bg-primary/10 p-3 text-primary transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                      <IconComponent className="size-6" />
                    </div>
                    <span className="mt-3 text-sm font-semibold">
                      {cat.name}
                    </span>
                  </Link>
                )
              })}
        </div>
      </section>

      {/* Latest Services Grid */}
      <section className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              أحدث الخدمات المضافة
            </h2>
            <p className="mt-2 text-muted-foreground">
              خدمات جديدة من مزودي الخدمات في منطقتك
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/services">عرض الكل ←</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {servicesLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-xl" />
              ))
            : servicesData?.services.map((svc) => (
                <Card
                  key={svc.id}
                  className="overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <div className="relative aspect-video w-full bg-muted">
                    {svc.mainImage ? (
                      <img
                        src={svc.mainImage}
                        alt={svc.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-secondary/30 text-muted-foreground">
                        لا توجد صورة
                      </div>
                    )}
                    <span className="absolute top-2 right-2 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur-sm">
                      {svc.categoryName}
                    </span>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" />
                      <span>{svc.city}</span>
                    </div>
                    <h3 className="mt-3 line-clamp-1 text-lg font-bold transition-colors hover:text-primary">
                      <Link to="/services/$id" params={{ id: String(svc.id) }}>
                        {svc.title}
                      </Link>
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {svc.description}
                    </p>
                    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                      <div>
                        <span className="block text-xs text-muted-foreground">
                          مزود الخدمة
                        </span>
                        <span className="text-sm font-semibold">
                          {svc.providerName}
                        </span>
                      </div>
                      <div className="text-left">
                        <span className="block text-xs text-muted-foreground">
                          السعر
                        </span>
                        <span className="text-lg font-extrabold text-primary">
                          {svc.pricingType === "fixed" && svc.price
                            ? formatPrice(svc.price)
                            : "طلب تسعير"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </section>
    </div>
  )
}
