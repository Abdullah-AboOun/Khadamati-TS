import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { trpc } from "@/lib/trpc"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Star, MessageSquare, ArrowRight } from "lucide-react"
import { formatPrice } from "../../shared/constants"
import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export const Route = createFileRoute("/services/$id")({
  component: ServiceDetailComponent,
})

function ServiceDetailComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data: session } = useSession()
  const parsedId = parseInt(id)

  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [quoteDesc, setQuoteDesc] = useState("")
  const [isOrdering, setIsOrdering] = useState(false)
  const [isQuoting, setIsQuoting] = useState(false)
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false)

  // tRPC query
  const { data: service, isLoading } = trpc.services.getById.useQuery({
    id: parsedId,
  })

  // tRPC mutations
  const createOrderMutation = trpc.orders.create.useMutation()
  const requestQuoteMutation = trpc.orders.requestQuote.useMutation()

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-8">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">
            <Skeleton className="h-96 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-destructive">
          الخدمة غير موجودة
        </h2>
        <Button asChild className="mt-4">
          <Link to="/services">العودة للخدمات</Link>
        </Button>
      </div>
    )
  }

  const handleOrder = async () => {
    if (!session?.user) {
      toast.error("الرجاء تسجيل الدخول أولاً للطلب")
      navigate({ to: "/login" })
      return
    }

    setIsOrdering(true)
    try {
      const order = await createOrderMutation.mutateAsync({
        serviceId: parsedId,
      })
      toast.success("تم إنشاء الطلب بنجاح! جاري تحويلك للدفع...")
      navigate({ to: `/checkout/${order.id}` })
    } catch (err) {
      const error = err as Error
      toast.error(error.message || "حدث خطأ أثناء تقديم الطلب")
    } finally {
      setIsOrdering(false)
    }
  }

  const handleRequestQuote = async () => {
    if (!session?.user) {
      toast.error("الرجاء تسجيل الدخول أولاً للطلب")
      navigate({ to: "/login" })
      return
    }
    if (!quoteDesc.trim()) {
      toast.error("الرجاء تعبئة وصف الطلب")
      return
    }

    setIsQuoting(true)
    try {
      await requestQuoteMutation.mutateAsync({
        serviceId: parsedId,
        description: quoteDesc,
      })
      toast.success("تم إرسال طلب التسعير لمزود الخدمة بنجاح!")
      setQuoteDialogOpen(false)
      navigate({ to: "/my-orders" })
    } catch (err) {
      const error = err as Error
      toast.error(error.message || "حدث خطأ أثناء إرسال الطلب")
    } finally {
      setIsQuoting(false)
    }
  }

  const currentMainImage = activeImage || service.images?.[0]?.url || ""

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" className="mb-6">
        <Link to="/services">
          <ArrowRight className="ml-2 size-4" />
          العودة للخدمات
        </Link>
      </Button>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Details and Gallery */}
        <div className="space-y-8 md:col-span-2">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {service.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
                {service.categoryName}
              </span>
              <div className="flex items-center gap-1">
                <MapPin className="size-4" />
                <span>{service.city}</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-foreground">
                  {service.avgRating.toFixed(1)}
                </span>
                <span>({service.reviewCount} تقييم)</span>
              </div>
            </div>
          </div>

          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
              {currentMainImage ? (
                <img
                  src={currentMainImage}
                  alt={service.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  لا توجد صور
                </div>
              )}
            </div>
            {service.images && service.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {service.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(img.url)}
                    className={`size-20 overflow-hidden rounded-md border-2 bg-muted transition-all ${
                      currentMainImage === img.url
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold">تفاصيل الخدمة</h2>
            <p className="leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {service.description}
            </p>
          </div>

          {/* Reviews Section */}
          <div className="space-y-6 border-t border-border pt-6">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <MessageSquare className="size-5 text-muted-foreground" />
              التقييمات والمراجعات ({service.reviewCount})
            </h2>

            {service.reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                لا توجد تقييمات لهذه الخدمة بعد.
              </p>
            ) : (
              <div className="space-y-4">
                {service.reviews.map((rev) => (
                  <Card
                    key={rev.id}
                    className="border border-border bg-card p-4 shadow-none"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={rev.clientImage || ""}
                          alt={rev.clientName || undefined}
                        />
                        <AvatarFallback className="bg-primary/10 font-bold text-primary">
                          {(rev.clientName || "؟").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold">
                            {rev.clientName}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {new Date(rev.createdAt).toLocaleDateString("ar")}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-3.5 ${
                                i < rev.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {rev.comment}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Panel / Provider Info */}
        <div className="space-y-6">
          <Card className="sticky top-24 border border-border p-6 shadow-md">
            <div className="space-y-4">
              <div>
                <span className="block text-sm text-muted-foreground">
                  السعر المطلوب
                </span>
                <span className="text-3xl font-black text-primary">
                  {service.pricingType === "fixed" && service.price
                    ? formatPrice(service.price)
                    : "طلب تسعير"}
                </span>
              </div>

              {/* Action Button */}
              {service.pricingType === "fixed" ? (
                <Button
                  onClick={handleOrder}
                  className="w-full font-bold"
                  size="lg"
                  disabled={isOrdering}
                >
                  {isOrdering ? "جاري إعداد الطلب..." : "اطلب الخدمة الآن"}
                </Button>
              ) : (
                <Dialog
                  open={quoteDialogOpen}
                  onOpenChange={setQuoteDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="w-full font-bold" size="lg">
                      اطلب تسعيرة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="text-right" dir="rtl">
                    <DialogHeader className="text-right">
                      <DialogTitle>طلب تسعير للخدمة</DialogTitle>
                      <DialogDescription>
                        يرجى كتابة تفاصيل العمل الذي ترغب في إنجازه وسيتواصل معك
                        مزود الخدمة بالسعر المناسب.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          تفاصيل العمل المطلوب
                        </label>
                        <textarea
                          placeholder="مثال: تركيب إضاءة لثلاث غرف وصالة مع فحص المفاتيح الكهربائية..."
                          value={quoteDesc}
                          onChange={(e) => setQuoteDesc(e.target.value)}
                          className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-right text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                          rows={4}
                        />
                      </div>
                      <Button
                        onClick={handleRequestQuote}
                        className="w-full font-semibold"
                        disabled={isQuoting}
                      >
                        {isQuoting ? "جاري الإرسال..." : "إرسال طلب التسعيرة"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* Provider Profile snippet */}
              <div className="mt-6 border-t border-border pt-4">
                <span className="mb-3 block text-xs text-muted-foreground">
                  حول مزود الخدمة
                </span>
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage
                      src={service.providerImage || ""}
                      alt={service.providerName || undefined}
                    />
                    <AvatarFallback className="bg-primary/10 font-bold text-primary">
                      {(service.providerName || "؟").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-bold">
                      {service.providerName || "مجهول"}
                    </h4>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {service.providerBio ||
                        "لا توجد نبذة شخصية لمزود الخدمة."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
