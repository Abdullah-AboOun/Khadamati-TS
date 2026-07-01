import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Briefcase,
  MessageSquare,
  Calendar,
} from "lucide-react";
import { formatPrice } from "../../shared/constants";

export const Route = createFileRoute("/providers/$id")({
  component: ProviderProfileComponent,
});

function ProviderProfileComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  // Query provider profile details
  const { data: profileData, isLoading } = trpc.services.getProviderProfile.useQuery({
    providerId: id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-8 max-w-5xl" dir="rtl">
        <Skeleton className="h-10 w-1/4 rounded-md" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-96 md:col-span-1 rounded-xl" />
          <Skeleton className="h-96 md:col-span-2 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profileData || !profileData.provider) {
    return (
      <div className="container mx-auto p-16 text-center" dir="rtl">
        <h2 className="text-xl font-bold text-destructive">مزود الخدمة غير موجود</h2>
        <Button onClick={() => navigate({ to: "/" })} className="mt-4 cursor-pointer">
          العودة للرئيسية
        </Button>
      </div>
    );
  }

  const { provider, services, reviews, avgRating, reviewCount } = profileData;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6 text-right" dir="rtl">
      {/* Back button */}
      <div className="flex items-center justify-start">
        <Button variant="ghost" size="sm" asChild className="cursor-pointer">
          <Link to="/" className="flex items-center gap-1.5">
            <ArrowRight className="size-4" />
            <span>العودة للرئيسية</span>
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Sidebar: Provider Card */}
        <div className="md:col-span-4 space-y-6">
          <Card className="border border-border bg-card p-6 shadow-md rounded-xl text-center flex flex-col items-center">
            <Avatar className="size-28 border-4 border-primary/20 shadow-md">
              <AvatarImage src={provider.image || ""} alt={provider.name} />
              <AvatarFallback className="bg-primary/10 font-bold text-primary text-3xl">
                {provider.name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <h2 className="mt-4 text-xl font-extrabold text-foreground">{provider.name}</h2>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground justify-center">
              <MapPin className="size-4" />
              <span>{provider.city || "غير محدد"}</span>
            </div>

            {/* Rating summary */}
            <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10 px-4 py-2 text-sm">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-foreground">{avgRating.toFixed(1)}</span>
              <span className="text-muted-foreground">({reviewCount} تقييم)</span>
            </div>

            <p className="mt-6 text-sm text-muted-foreground leading-relaxed text-center px-2">
              {provider.bio || "لا توجد نبذة شخصية لمزود الخدمة."}
            </p>

            <div className="mt-6 w-full border-t border-border pt-4 space-y-3 text-right">
              {provider.phone && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Phone className="size-4" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">رقم الهاتف</span>
                    <a
                      href={`tel:${provider.phone}`}
                      className="text-sm font-bold hover:text-primary transition-colors"
                      dir="ltr"
                    >
                      {provider.phone}
                    </a>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Mail className="size-4" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">البريد الإلكتروني</span>
                  <span className="text-sm font-bold text-foreground truncate max-w-[180px] block">
                    {provider.email}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-8 space-y-6">
          {/* Services Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-border pb-2">
              <Briefcase className="size-5 text-primary" />
              <span>الخدمات المقدمة ({services.length})</span>
            </h3>

            {services.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                لا توجد خدمات نشطة معروضة حالياً.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {services.map((svc) => (
                  <Card
                    key={svc.id}
                    className="border border-border hover:shadow-md transition-all rounded-xl overflow-hidden bg-card flex flex-col justify-between"
                  >
                    <div className="p-5 space-y-3">
                      {svc.images && svc.images.length > 0 ? (
                        <div className="aspect-video w-full rounded-lg overflow-hidden border border-border/50">
                          <img
                            src={svc.images[0]}
                            alt={svc.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                          لا توجد صور
                        </div>
                      )}
                      <div>
                        <Link
                          to="/services/$id"
                          params={{ id: String(svc.id) }}
                          className="font-bold text-base hover:text-primary transition-colors"
                        >
                          {svc.title}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {svc.description}
                        </p>
                      </div>
                    </div>
                    <div className="border-t border-border/50 px-5 py-3 flex justify-between items-center bg-secondary/10">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-3" />
                        {svc.city}
                      </span>
                      <span className="text-sm font-black text-primary">
                        {svc.pricingType === "fixed" && svc.price
                          ? formatPrice(svc.price)
                          : "طلب تسعيرة"}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-border pb-2">
              <MessageSquare className="size-5 text-primary" />
              <span>تقييمات وآراء العملاء ({reviews.length})</span>
            </h3>

            {reviews.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground border border-dashed rounded-xl">
                لا توجد تقييمات أو تعليقات مضافة بعد.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <Card
                    key={rev.id}
                    className="border border-border p-5 shadow-xs rounded-xl bg-card space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={rev.clientImage || undefined}
                          alt={rev.clientName || "مستخدم"}
                        />
                        <AvatarFallback className="bg-primary/10 font-bold text-primary text-xs">
                          {(rev.clientName || "م").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold">{rev.clientName || "مستخدم مجهول"}</h4>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="size-3.5" />
                            {new Date(rev.createdAt).toLocaleDateString("ar")}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-3.5 ${
                                i < rev.rating ? "fill-amber-400 text-amber-400" : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-sm leading-relaxed text-muted-foreground bg-secondary/20 p-3 rounded-lg">
                        {rev.comment}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground pt-1 flex items-center gap-1.5 justify-start">
                      <span className="font-medium">على خدمة:</span>
                      <Link
                        to="/services/$id"
                        params={{ id: String(rev.serviceId) }}
                        className="font-semibold text-primary hover:underline"
                      >
                        {rev.serviceTitle}
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
