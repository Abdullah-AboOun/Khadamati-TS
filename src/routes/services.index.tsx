import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getServicesFn } from "@/server/functions/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { formatPrice, CITIES, DEFAULT_CATEGORIES } from "../../shared/constants";
import { z } from "zod";

const serviceSearchSchema = z.object({
  search: z.string().optional(),
  categoryId: z.coerce.number().optional(),
  city: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
});

export const Route = createFileRoute("/services/")({
  validateSearch: (search) => serviceSearchSchema.parse(search),
  component: ServicesBrowseComponent,
});

function ServicesBrowseComponent() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  const categories = DEFAULT_CATEGORIES;
  const { data: servicesData, isLoading } = useQuery({
    queryKey: ["services", searchParams],
    queryFn: () =>
      getServicesFn({
        data: {
          search: searchParams.search,
          categoryId: searchParams.categoryId,
          city: searchParams.city,
          minPrice: searchParams.minPrice,
          maxPrice: searchParams.maxPrice,
          page: 1,
          limit: 50,
        },
      }),
  });

  const updateSearch = (updates: Partial<z.infer<typeof serviceSearchSchema>>) => {
    navigate({
      search: { ...searchParams, ...updates },
    } as unknown as Parameters<typeof navigate>[0]);
  };

  const clearFilters = () => {
    navigate({
      search: {} as unknown as Parameters<typeof navigate>[0]["search"],
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">استكشاف الخدمات</h1>
          <p className="mt-2 text-muted-foreground">
            تصفح الخدمات المتاحة وتواصل مع أفضل المحترفين في منطقتك
          </p>
        </div>

        {/* Filters and Search Panel */}
        <Card className="border border-border bg-card p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {/* Search Input */}
            <div className="relative">
              <Input
                type="text"
                placeholder="بحث عن خدمات..."
                value={searchParams.search || ""}
                onChange={(e) => updateSearch({ search: e.target.value || undefined })}
                className="pr-10 text-right"
              />
              <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Category Select */}
            <Select
              value={searchParams.categoryId?.toString() || "all"}
              onValueChange={(val) =>
                updateSearch({
                  categoryId: val === "all" ? undefined : parseInt(val),
                })
              }
            >
              <SelectTrigger className="flex w-full justify-between text-right">
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-right">
                  جميع التصنيفات
                </SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()} className="text-right">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* City Select */}
            <Select
              value={searchParams.city || "all"}
              onValueChange={(val) => updateSearch({ city: val === "all" ? undefined : val })}
            >
              <SelectTrigger className="flex w-full justify-between text-right">
                <SelectValue placeholder="المدينة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-right">
                  جميع المدن
                </SelectItem>
                {CITIES.map((city) => (
                  <SelectItem key={city} value={city} className="text-right">
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Button */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters} className="w-full font-medium">
                <Trash2 className="ml-2 size-4" />
                إعادة ضبط
              </Button>
            </div>
          </div>
        </Card>

        {/* Services Listings Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        ) : servicesData?.services.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <SlidersHorizontal className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">لم نجد أي خدمات مطابقة</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              جرّب تعديل معايير البحث أو اختيار تصنيف آخر.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {servicesData?.services.map((svc) => (
              <Card
                key={svc.id}
                className="relative overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md group pt-0"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted rounded-t-xl">
                  {svc.mainImage ? (
                    <img
                      src={svc.mainImage}
                      alt={svc.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-secondary/30 text-muted-foreground">
                      لا توجد صورة
                    </div>
                  )}
                  <span className="absolute top-2 right-2 rounded-full bg-primary/95 px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur-sm">
                    {svc.categoryName}
                  </span>
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" />
                    <span>{svc.city}</span>
                  </div>
                  <h3 className="mt-3 line-clamp-1 text-lg font-bold transition-colors group-hover:text-primary">
                    <Link
                      to="/services/$id"
                      params={{ id: String(svc.id) }}
                      className="after:absolute after:inset-0 after:z-10 cursor-pointer"
                    >
                      {svc.title}
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {svc.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <span className="block text-xs text-muted-foreground">مزود الخدمة</span>
                      <span className="text-sm font-semibold">{svc.providerName}</span>
                    </div>
                    <div className="text-left">
                      <span className="block text-xs text-muted-foreground">السعر</span>
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
        )}
      </div>
    </div>
  );
}
