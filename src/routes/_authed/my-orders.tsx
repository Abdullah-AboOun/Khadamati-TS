import { createFileRoute, Link } from "@tanstack/react-router"
import { trpc } from "@/lib/trpc"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Star, MessageSquarePlus, ClipboardList, Check, X } from "lucide-react"
import { formatPrice, STATUS_LABELS } from "../../../shared/constants"
import { useState } from "react"
import { toast } from "sonner"

export const Route = createFileRoute("/_authed/my-orders")({
  component: MyOrdersComponent,
})

const STATUS_COLOR_CLASSES: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200",
  quoted:
    "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200",
  accepted:
    "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 border-green-200",
  in_progress:
    "bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200",
  cancelled:
    "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border-red-200",
}

function MyOrdersComponent() {
  const {
    data: orders,
    isLoading,
    refetch,
  } = trpc.orders.getMyOrders.useQuery()

  const [reviewOrderId, setReviewOrderId] = useState<number | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // mutations
  const updateStatusMutation = trpc.orders.updateStatus.useMutation()
  const createReviewMutation = trpc.reviews.create.useMutation()

  const handleUpdateStatus = async (
    orderId: number,
    status: "accepted" | "cancelled"
  ) => {
    try {
      await updateStatusMutation.mutateAsync({ orderId, status })
      toast.success(
        status === "accepted"
          ? "تم قبول التسعيرة والطلب قيد المعالجة"
          : "تم رفض التسعيرة وإلغاء الطلب"
      )
      refetch()
    } catch (err) {
      const error = err as Error
      toast.error(error.message || "حدث خطأ في تحديث الطلب")
    }
  }

  const handleLeaveReview = async () => {
    if (!reviewOrderId) return
    setIsSubmittingReview(true)
    try {
      await createReviewMutation.mutateAsync({
        orderId: reviewOrderId,
        rating,
        comment: comment || undefined,
      })
      toast.success("شكراً لك! تم إضافة تقييمك بنجاح")
      setReviewDialogOpen(false)
      setComment("")
      setRating(5)
    } catch (err) {
      const error = err as Error
      toast.error(error.message || "حدث خطأ أثناء تقديم التقييم")
    } finally {
      setIsSubmittingReview(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-4 p-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">طلباتي</h1>
          <p className="mt-2 text-muted-foreground">
            تابع حالة طلباتك الحالية وتاريخ طلباتك السابقة
          </p>
        </div>

        {orders?.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <ClipboardList className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">لا توجد طلبات بعد</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              تصفح الخدمات المتنوعة وابدأ بطلبك الأول.
            </p>
            <Button asChild className="mt-4">
              <Link to="/services">تصفح الخدمات</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders?.map((ord) => (
              <Card
                key={ord.id}
                className="border border-border bg-card p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        # {ord.id}
                      </span>
                      <Badge
                        className={`font-medium ${STATUS_COLOR_CLASSES[ord.status]}`}
                        variant="outline"
                      >
                        {STATUS_LABELS[ord.status]}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                      {ord.serviceTitle}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        مزود الخدمة:{" "}
                        <span className="font-semibold text-foreground">
                          {ord.providerName}
                        </span>
                      </span>
                      <span>•</span>
                      <span>
                        تاريخ الطلب:{" "}
                        {new Date(ord.createdAt).toLocaleDateString("ar")}
                      </span>
                    </div>
                    {ord.details && (
                      <p className="mt-2 inline-block max-w-xl rounded-md bg-secondary/20 p-2 text-sm text-muted-foreground">
                        {ord.details}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-start justify-between gap-3 sm:items-end">
                    <div className="text-right">
                      <span className="block text-xs text-muted-foreground">
                        القيمة
                      </span>
                      <span className="text-xl font-extrabold text-primary">
                        {ord.amount ? formatPrice(ord.amount) : "قيد التسعير"}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2 sm:mt-0">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/orders/$id" params={{ id: String(ord.id) }}>
                          عرض التفاصيل
                        </Link>
                      </Button>
                      {/* Actions for quoted pricing state */}
                      {ord.status === "quoted" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 font-semibold hover:bg-green-700"
                            onClick={() =>
                              handleUpdateStatus(ord.id, "accepted")
                            }
                          >
                            <Check className="ml-1 size-4" />
                            قبول التسعيرة
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="font-semibold"
                            onClick={() =>
                              handleUpdateStatus(ord.id, "cancelled")
                            }
                          >
                            <X className="ml-1 size-4" />
                            رفض
                          </Button>
                        </>
                      )}

                      {/* Review Actions */}
                      {ord.status === "completed" && (
                        <Dialog
                          open={reviewDialogOpen && reviewOrderId === ord.id}
                          onOpenChange={(open) => {
                            setReviewDialogOpen(open)
                            if (open) setReviewOrderId(ord.id)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 font-semibold"
                            >
                              <MessageSquarePlus className="size-4" />
                              تقييم الخدمة
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="text-right" dir="rtl">
                            <DialogHeader className="text-right">
                              <DialogTitle>تقييم ومراجعة الخدمة</DialogTitle>
                              <DialogDescription>
                                رأيك يهمنا ويساعد الآخرين في اختيار الخدمات
                                المناسبة. يرجى ترك تقييمك من 1 إلى 5.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                              <div className="flex justify-center gap-2">
                                {Array.from({ length: 5 }).map((_, idx) => {
                                  const starVal = idx + 1
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => setRating(starVal)}
                                      type="button"
                                      className="transition-transform hover:scale-110"
                                    >
                                      <Star
                                        className={`size-8 ${
                                          starVal <= rating
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-muted-foreground/30"
                                        }`}
                                      />
                                    </button>
                                  )
                                })}
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-medium">
                                  تعليقك (اختياري)
                                </label>
                                <textarea
                                  placeholder="اكتب تجربتك مع مزود الخدمة..."
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-right text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                  rows={3}
                                />
                              </div>
                              <Button
                                onClick={handleLeaveReview}
                                className="w-full font-semibold"
                                disabled={isSubmittingReview}
                              >
                                {isSubmittingReview
                                  ? "جاري الإرسال..."
                                  : "إرسال التقييم"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
