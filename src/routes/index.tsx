import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search,
  Users,
  Star,
  ShieldCheck,
  ZapIcon,
  CreditCard,
  MessageSquare,
  Clock,
  Compass,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import { formatPrice, CITIES } from "../../shared/constants";
import { useState } from "react";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

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
};

function HomeComponent() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [searchCity, setSearchCity] = useState("all");

  // Fetch live stats
  const { data: stats, isLoading: statsLoading } = trpc.stats.publicStats.useQuery();

  // Fetch categories
  const { data: categories, isLoading: catsLoading } = trpc.categories.list.useQuery();

  // Fetch latest 6 services
  const { data: servicesData, isLoading: servicesLoading } = trpc.services.list.useQuery({
    limit: 6,
  });

  const handleSearch = (e: React.SyntheticEvent) => {
    e.preventDefault();
    navigate({
      to: "/services",
      search: {
        search: searchText || undefined,
        city: searchCity === "all" ? undefined : searchCity,
      },
    });
  };

  return (
    <div className="flex flex-col gap-16 pb-20 bg-background text-foreground" dir="rtl">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background py-24 text-foreground border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content Column */}
            <div className="text-right space-y-6 lg:col-span-7">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl leading-tight">
                اعثر على أفضل الخبراء المحليين لخدمتك
              </h1>
              <p className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
                اطلب خدمات الصيانة المنزلية، التقنية، والتطوير بكل سهولة وأمان في مدينتك.
              </p>

              {/* Search Box Inline */}
              <form
                onSubmit={handleSearch}
                className="mt-8 max-w-2xl rounded-xl bg-card p-1.5 border border-border shadow-md flex flex-col sm:flex-row items-center gap-2"
              >
                <div className="relative flex-1 w-full">
                  <Search className="absolute right-3 top-3.5 size-4 text-muted-foreground" />
                  <Input
                    dir="rtl"
                    type="text"
                    placeholder="ما الخدمة التي تبحث عنها اليوم؟"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="h-10 w-full border-0 bg-transparent pr-9 pl-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-right text-sm"
                  />
                </div>

                <div className="w-full sm:w-28">
                  <Select value={searchCity} onValueChange={setSearchCity}>
                    <SelectTrigger className="h-9 w-full border-0 bg-secondary hover:bg-secondary/80 text-foreground text-right text-sm flex justify-between items-center cursor-pointer">
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                    <SelectContent className="border-border text-foreground text-right">
                      <SelectItem value="all" className="cursor-pointer text-right">
                        كل المدن
                      </SelectItem>
                      {CITIES.map((city) => (
                        <SelectItem key={city} value={city} className="cursor-pointer text-right">
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  className="h-9 bg-primary text-primary-foreground hover:bg-primary/95 font-bold px-6 shrink-0 cursor-pointer"
                >
                  بحث
                </Button>
              </form>

              {/* Stats Bar Below Search */}
              <div className="mt-12 pt-8 border-t border-border grid grid-cols-3 gap-4 max-w-xl text-right">
                <div className="space-y-1">
                  {statsLoading ? (
                    <Skeleton className="h-7 w-12 bg-secondary" />
                  ) : (
                    <span className="block text-2xl sm:text-3xl font-extrabold text-foreground">
                      {stats?.totalProviders ?? 0}+
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground font-medium">مزود خدمة موثوق</span>
                </div>
                <div className="space-y-1">
                  {statsLoading ? (
                    <Skeleton className="h-7 w-12 bg-secondary" />
                  ) : (
                    <span className="block text-2xl sm:text-3xl font-extrabold text-foreground">
                      {stats?.totalCompletedOrders ?? 0}+
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground font-medium">طلب مكتمل</span>
                </div>
                <div className="space-y-1">
                  {statsLoading ? (
                    <Skeleton className="h-7 w-12 bg-secondary" />
                  ) : (
                    <span className="block text-2xl sm:text-3xl font-extrabold text-foreground flex items-center gap-1">
                      {stats?.avgRating ?? 0}
                      <Star className="size-4 fill-amber-400 text-amber-400" />
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground font-medium">متوسط التقييم</span>
                </div>
              </div>
            </div>

            {/* Right Column (Desktop-only Stats Widget) */}
            <div className="hidden lg:block lg:col-span-5 relative">
              <div className="pr-6 flex justify-end">
                <div
                  dir="rtl"
                  className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-md"
                >
                  <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                    نشاط منصة خدماتي
                  </h3>
                  <div className="space-y-3">
                    {/* Item 1 */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                          <TrendingUp className="size-4.5" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          الطلبات النشطة اليوم
                        </span>
                      </div>
                      {statsLoading ? (
                        <Skeleton className="h-5 w-12 bg-secondary" />
                      ) : (
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                          {stats?.todayOrdersCount ?? 0} طلبات
                        </span>
                      )}
                    </div>

                    {/* Item 2 */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                          <Users className="size-4.5" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          مزودين جدد هذا الأسبوع
                        </span>
                      </div>
                      {statsLoading ? (
                        <Skeleton className="h-5 w-12 bg-secondary" />
                      ) : (
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                          {stats?.recentProvidersCount ?? 0} مزودين
                        </span>
                      )}
                    </div>

                    {/* Item 3 */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                          <Star className="size-4.5 fill-current" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">
                          مستوى رضا العملاء
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20 px-2.5 py-1 rounded-full">
                        98.9% إيجابي
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">تصفح حسب التصنيف</h2>
          <p className="text-sm text-muted-foreground">اختر تصنيف الخدمة التي تحتاج إليها للبدء</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {catsLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))
            : categories?.map((cat) => {
                const IconComponent = cat.icon ? ICON_MAP[cat.icon] || Zap : Zap;
                return (
                  <Link
                    key={cat.id}
                    to="/services"
                    search={{ categoryId: cat.id }}
                    className="group flex flex-col items-center justify-center rounded-xl border border-border bg-card p-6 text-center shadow-xs transition-all duration-200 hover:border-primary hover:shadow-sm cursor-pointer"
                  >
                    <div className="rounded-full bg-primary/10 p-3 text-primary transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                      <IconComponent className="size-5" />
                    </div>
                    <span className="mt-3 text-sm font-semibold">{cat.name}</span>
                  </Link>
                );
              })}
        </div>
      </section>

      {/* Latest Services Grid */}
      <section className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">أحدث الخدمات المضافة</h2>
            <p className="text-sm text-muted-foreground">خدمات جديدة من مزودي الخدمات في منطقتك</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="cursor-pointer">
            <Link to="/services" className="flex items-center gap-1">
              <span>عرض الكل</span>
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </div>

        {servicesLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        ) : !servicesData?.services || servicesData.services.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground w-full">
            لا توجد خدمات مضافة حالياً. كن أول من يضيف خدمة!
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {servicesData.services.map((svc) => (
              <Card
                key={svc.id}
                className="relative overflow-hidden border border-border bg-card shadow-xs transition-all duration-200 hover:shadow-sm group pt-0"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-muted rounded-t-xl">
                  {svc.mainImage ? (
                    <img
                      src={svc.mainImage}
                      alt={svc.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-secondary/30 text-muted-foreground text-sm">
                      لا توجد صورة
                    </div>
                  )}
                  <span className="absolute top-2 right-2 rounded-full bg-primary/95 px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur-sm shadow-xs">
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
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
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
      </section>

      {/* "Why Us" Section */}
      <section className="container mx-auto px-4 sm:px-6">
        <div className="text-center space-y-1 mb-12">
          <h2 className="text-2xl font-bold tracking-tight">لماذا منصة خدماتي؟</h2>
          <p className="text-sm text-muted-foreground">
            بيئة عمل آمنة ومريحة لطلب وتقديم الخدمات المحلية
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Item 1 */}
          <Card className="flex flex-row items-start gap-4 p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs hover:-translate-y-1 hover:shadow-md hover:border-emerald-500/30 dark:hover:border-emerald-400/25 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400 transition-all duration-300 group-hover/card:bg-emerald-500 group-hover/card:text-white dark:group-hover/card:bg-emerald-400 dark:group-hover/card:text-emerald-950">
              <ShieldCheck className="size-6 transition-transform duration-300 group-hover/card:scale-110" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0 text-right">
              <h3 className="font-bold text-base text-foreground transition-colors group-hover/card:text-emerald-600 dark:group-hover/card:text-emerald-400">مزودون موثّقون</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                نتحقق من هوية وخبرة جميع مزودي الخدمات المسجلين لضمان الجودة والأمان.
              </p>
            </div>
          </Card>

          {/* Item 2 */}
          <Card className="flex flex-row items-start gap-4 p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs hover:-translate-y-1 hover:shadow-md hover:border-amber-500/30 dark:hover:border-amber-400/25 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 transition-all duration-300 group-hover/card:bg-amber-500 group-hover/card:text-white dark:group-hover/card:bg-amber-400 dark:group-hover/card:text-amber-950">
              <ZapIcon className="size-6 transition-transform duration-300 group-hover/card:scale-110" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0 text-right">
              <h3 className="font-bold text-base text-foreground transition-colors group-hover/card:text-amber-600 dark:group-hover/card:text-amber-400">استجابة فورية</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                تواصل مباشر وسريع مع مقدمي الخدمة واستلم عروض الأسعار خلال دقائق معدودة.
              </p>
            </div>
          </Card>

          {/* Item 3 */}
          <Card className="flex flex-row items-start gap-4 p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs hover:-translate-y-1 hover:shadow-md hover:border-blue-500/30 dark:hover:border-blue-400/25 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 transition-all duration-300 group-hover/card:bg-blue-500 group-hover/card:text-white dark:group-hover/card:bg-blue-400 dark:group-hover/card:text-blue-950">
              <CreditCard className="size-6 transition-transform duration-300 group-hover/card:scale-110" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0 text-right">
              <h3 className="font-bold text-base text-foreground transition-colors group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400">دفع آمن</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                نحفظ حقوقك المالية؛ حيث لا يتم تحويل الأموال للمزود إلا بعد إتمام الخدمة وتأكيدك.
              </p>
            </div>
          </Card>

          {/* Item 4 */}
          <Card className="flex flex-row items-start gap-4 p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs hover:-translate-y-1 hover:shadow-md hover:border-purple-500/30 dark:hover:border-purple-400/25 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400 transition-all duration-300 group-hover/card:bg-purple-500 group-hover/card:text-white dark:group-hover/card:bg-purple-400 dark:group-hover/card:text-purple-950">
              <MessageSquare className="size-6 transition-transform duration-300 group-hover/card:scale-110" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0 text-right">
              <h3 className="font-bold text-base text-foreground transition-colors group-hover/card:text-purple-600 dark:group-hover/card:text-purple-400">تقييمات حقيقية</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                اعتمد على آراء وتقييمات العملاء السابقين لاتخاذ القرار الصحيح في اختيار المزود.
              </p>
            </div>
          </Card>

          {/* Item 5 */}
          <Card className="flex flex-row items-start gap-4 p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs hover:-translate-y-1 hover:shadow-md hover:border-rose-500/30 dark:hover:border-rose-400/25 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400 transition-all duration-300 group-hover/card:bg-rose-500 group-hover/card:text-white dark:group-hover/card:bg-rose-400 dark:group-hover/card:text-rose-950">
              <Clock className="size-6 transition-transform duration-300 group-hover/card:scale-110" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0 text-right">
              <h3 className="font-bold text-base text-foreground transition-colors group-hover/card:text-rose-600 dark:group-hover/card:text-rose-400">دعم ٢٤/٧</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                فريق دعم فني متكامل جاهز لمساعدتك وحل أي استفسارات أو مشاكل على مدار الساعة.
              </p>
            </div>
          </Card>

          {/* Item 6 */}
          <Card className="flex flex-row items-start gap-4 p-5 sm:p-6 rounded-xl border border-border bg-card shadow-xs hover:-translate-y-1 hover:shadow-md hover:border-teal-500/30 dark:hover:border-teal-400/25 transition-all duration-300">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center shrink-0 text-teal-600 dark:text-teal-400 transition-all duration-300 group-hover/card:bg-teal-500 group-hover/card:text-white dark:group-hover/card:bg-teal-400 dark:group-hover/card:text-teal-950">
              <Compass className="size-6 transition-transform duration-300 group-hover/card:scale-110" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0 text-right">
              <h3 className="font-bold text-base text-foreground transition-colors group-hover/card:text-teal-600 dark:group-hover/card:text-teal-400">قُرب جغرافي</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ابحث واعثر على الفنيين والخبراء الأقرب إليك جغرافياً لتوفير الوقت وتكاليف التنقل.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="container mx-auto px-4 sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center space-y-6 max-w-4xl mx-auto shadow-xs">
          <h2 className="text-2xl font-bold sm:text-3xl text-foreground">
            هل أنت خبير محترف؟ ابدأ بكسب دخل إضافي اليوم
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            انضم إلى آلاف المحترفين على منصة خدماتي، واعرض مهاراتك وخدماتك للعملاء في مدينتك بكل سهولة
            وحرية.
          </p>
          <div className="flex justify-center gap-3 flex-col sm:flex-row pt-2">
            <Button asChild className="font-bold px-8 cursor-pointer">
              <Link to="/register">سجل كمزود خدمة</Link>
            </Button>
            <Button asChild variant="outline" className="font-bold px-8 cursor-pointer">
              <Link to="/about">تعرف على المزيد</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
