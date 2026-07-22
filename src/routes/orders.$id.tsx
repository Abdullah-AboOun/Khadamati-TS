import { createFileRoute, Link } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { useSession, type AuthUser } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  User,
  Phone,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Play,
  Check,
  Star,
  ArrowRight,
  Shield,
  MessageSquare,
  Wallet,
  Smartphone,
} from "lucide-react";
import { formatPrice, STATUS_LABELS } from "../../shared/constants";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/orders/$id")({
  component: OrderDetailComponent,
});

const STATUS_COLOR_CLASSES: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200",
  quoted: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200",
  accepted: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 border-green-200",
  in_progress:
    "bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border-red-200",
};

function OrderDetailComponent() {
  const { id } = Route.useParams();
  const parsedOrderId = parseInt(id);
  const { data: session } = useSession();
  const user = session?.user as AuthUser | null | undefined;

  const [quotePrice, setQuotePrice] = useState("");
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // tRPC query to fetch order details
  const {
    data: order,
    isLoading,
    refetch,
  } = trpc.orders.getById.useQuery({
    orderId: parsedOrderId,
  });

  // tRPC mutations
  const updateStatusMutation = trpc.orders.updateStatus.useMutation();
  const respondToQuoteMutation = trpc.orders.respondToQuote.useMutation();
  const cancelOrderMutation = trpc.orders.cancelOrder.useMutation();
  const createReviewMutation = trpc.reviews.create.useMutation();

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-8" dir="rtl">
        <Skeleton className="h-10 w-1/4" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center" dir="rtl">
        <h2 className="text-2xl font-bold">الرجاء تسجيل الدخول أولاً</h2>
        <p className="mt-2 text-muted-foreground">يجب تسجيل الدخول لعرض تفاصيل الطلبات.</p>
        <Button asChild className="mt-4">
          <Link to="/login">تسجيل الدخول</Link>
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center" dir="rtl">
        <h2 className="text-2xl font-bold text-destructive">الطلب غير موجود</h2>
        <p className="mt-2 text-muted-foreground">
          الطلب الذي تبحث عنه غير موجود أو ليس لديك صلاحية للوصول إليه.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/">العودة للرئيسية</Link>
        </Button>
      </div>
    );
  }

  const isClient = order.clientId === user?.id;
  const isProvider = order.providerId === user?.id;

  const handleUpdateStatus = async (status: typeof order.status) => {
    setIsUpdatingStatus(true);
    try {
      await updateStatusMutation.mutateAsync({
        orderId: parsedOrderId,
        status,
      });
      toast.success("تم تحديث حالة الطلب بنجاح");
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء تحديث حالة الطلب");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsUpdatingStatus(true);
    try {
      if (isProvider) {
        await cancelOrderMutation.mutateAsync({ orderId: parsedOrderId });
      } else {
        await updateStatusMutation.mutateAsync({
          orderId: parsedOrderId,
          status: "cancelled",
        });
      }
      toast.success("تم إلغاء الطلب بنجاح");
      setCancelDialogOpen(false);
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء إلغاء الطلب");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSubmitQuote = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const price = parseFloat(quotePrice);
    if (isNaN(price) || price <= 0) {
      toast.error("الرجاء إدخال سعر صحيح أكبر من صفر");
      return;
    }

    setIsSubmittingQuote(true);
    try {
      await respondToQuoteMutation.mutateAsync({
        orderId: parsedOrderId,
        quotedPrice: price,
      });
      toast.success("تم تقديم عرض السعر بنجاح");
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء تقديم السعر");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleLeaveReview = async () => {
    setIsSubmittingReview(true);
    try {
      await createReviewMutation.mutateAsync({
        orderId: parsedOrderId,
        rating,
        comment: comment || undefined,
      });
      toast.success("شكراً لك! تم إضافة تقييمك بنجاح");
      setReviewDialogOpen(false);
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء تقديم التقييم");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6" dir="rtl">
      {/* Header and Back Link */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to={isProvider ? "/provider/dashboard" : "/my-orders"}
              search={isProvider ? { tab: "orders" } : undefined}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowRight className="size-4" />
              <span>{isProvider ? "طلبات العملاء" : "طلباتي"}</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">تفاصيل الطلب #{order.id}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={`px-3 py-1 text-sm font-medium ${STATUS_COLOR_CLASSES[order.status]}`}
            variant="outline"
          >
            {STATUS_LABELS[order.status]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content Info */}
        <div className="space-y-6 md:col-span-2">
          {/* Order Details Card */}
          <Card className="overflow-hidden border border-border shadow-sm">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="text-lg">تفاصيل الخدمة المطلوبة</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <span className="text-xs text-muted-foreground block">الخدمة</span>
                <Link
                  to="/services/$id"
                  params={{ id: String(order.serviceId) }}
                  className="text-xl font-bold text-primary hover:underline"
                >
                  {order.serviceTitle}
                </Link>
              </div>

              {order.categoryName && (
                <div>
                  <span className="text-xs text-muted-foreground block">التصنيف</span>
                  <span className="text-sm font-semibold">{order.categoryName}</span>
                </div>
              )}

              {order.details && (
                <div className="rounded-lg bg-muted/40 p-4">
                  <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2">
                    <FileText className="size-4" />
                    تفاصيل الطلب (من العميل):
                  </span>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{order.details}</p>
                </div>
              )}

              {order.paymentMethod === "jawwal_pay" || order.gatewayTxId ? (
                <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-500/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Smartphone className="size-4 text-emerald-600" />
                      مدفوع عبر بوابة جوال باي Merchant API (آلي ومباشر)
                    </span>
                    <Badge className="bg-emerald-600 text-white font-mono text-[11px]">
                      {order.paymentStatus === "completed" ? "دفع مؤكَّد ⚡" : order.paymentStatus}
                    </Badge>
                  </div>
                  {order.gatewayTxId && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-muted-foreground font-semibold">رقم العملية (Gateway Tx ID):</span>
                      <span className="font-mono font-black text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {order.gatewayTxId}
                      </span>
                    </div>
                  )}
                  {order.paymentProof && (
                    <p className="text-xs text-muted-foreground pt-1 border-t border-emerald-500/20">
                      {order.paymentProof}
                    </p>
                  )}
                </div>
              ) : order.paymentProof ? (
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-4">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                    <Wallet className="size-4" />
                    معلومات وإثبات الدفع:
                  </span>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {order.paymentProof}
                  </p>
                </div>
              ) : null}

              {order.notes && (
                <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-4">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                    <Shield className="size-4" />
                    ملاحظات إضافية:
                  </span>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time & History Card */}
          <Card className="border border-border shadow-sm">
            <CardContent className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                    <Calendar className="size-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">تاريخ الطلب</span>
                    <span className="text-sm font-semibold">
                      {new Date(order.createdAt).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">آخر تحديث</span>
                    <span className="text-sm font-semibold">
                      {new Date(order.updatedAt).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Details if completed & reviewed */}
          {order.status === "completed" && order.reviewId && (
            <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-5" />
                  تقييم العميل للخدمة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-5 ${
                        i < (order.reviewRating ?? 0)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted"
                      }`}
                    />
                  ))}
                  <span className="text-sm font-bold mr-2">{order.reviewRating} من 5</span>
                </div>
                {order.reviewComment && (
                  <p className="text-sm text-foreground italic leading-relaxed">
                    "{order.reviewComment}"
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info & Action Cards */}
        <div className="space-y-6">
          {/* Amount Card */}
          <Card className="border border-border shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-border">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                التكلفة الإجمالية
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {order.amount ? (
                <div className="text-3xl font-extrabold text-primary">
                  {formatPrice(order.amount)}
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    بانتظار التسعير
                  </span>
                  <p className="text-xs text-muted-foreground">
                    لم يقم مزود الخدمة بتقديم عرض سعر للطلب بعد.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client & Provider Contact Card */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">أطراف الطلب</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Provider Info */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground block border-b pb-1">
                  مزود الخدمة
                </span>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-secondary p-2 text-secondary-foreground">
                    <User className="size-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold block">{order.providerName}</span>
                    {order.providerPhone && (
                      <span
                        className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"
                        dir="ltr"
                      >
                        <Phone className="size-3" />
                        {order.providerPhone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Client Info */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground block border-b pb-1">
                  العميل
                </span>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-secondary p-2 text-secondary-foreground">
                    <User className="size-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold block">{order.clientName}</span>
                    {order.clientPhone && (
                      <span
                        className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"
                        dir="ltr"
                      >
                        <Phone className="size-3" />
                        {order.clientPhone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">إجراءات الطلب</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {/* PROVIDER ACTIONS */}
              {isProvider && (
                <div className="flex flex-col gap-3">
                  {/* Status pending and has amount (accept order) */}
                  {order.status === "pending" && order.amount && (
                    <Button
                      onClick={() => handleUpdateStatus("accepted")}
                      disabled={isUpdatingStatus}
                      className="w-full font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    >
                      <Check className="size-4" />
                      قبول الطلب
                    </Button>
                  )}

                  {/* Status accepted -> in_progress */}
                  {order.status === "accepted" && (
                    <Button
                      onClick={() => handleUpdateStatus("in_progress")}
                      disabled={isUpdatingStatus}
                      className="w-full font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="size-4" />
                      البدء بالعمل (قيد التنفيذ)
                    </Button>
                  )}

                  {/* Status in_progress -> completed */}
                  {order.status === "in_progress" && (
                    <Button
                      onClick={() => handleUpdateStatus("completed")}
                      disabled={isUpdatingStatus}
                      className="w-full font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    >
                      <Check className="size-4" />
                      إكمال العمل (مكتمل)
                    </Button>
                  )}

                  {/* Quote needed */}
                  {order.status === "pending" && !order.amount && (
                    <form onSubmit={handleSubmitQuote} className="space-y-3 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-semibold" htmlFor="quote-price">
                          تقديم عرض سعر:
                        </label>
                        <div className="relative">
                          <Input
                            id="quote-price"
                            type="number"
                            placeholder="مثال: 150"
                            value={quotePrice}
                            onChange={(e) => setQuotePrice(e.target.value)}
                            disabled={isSubmittingQuote}
                            className="pl-8 text-right"
                          />
                          <span className="absolute left-3 top-2 text-sm text-muted-foreground">
                            ₪
                          </span>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={isSubmittingQuote}
                        className="w-full font-semibold cursor-pointer"
                      >
                        إرسال السعر للعميل
                      </Button>
                    </form>
                  )}

                  {/* Provider cancel action (only pending or quoted) */}
                  {["pending", "quoted"].includes(order.status) && (
                    <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          disabled={isUpdatingStatus}
                          className="w-full font-bold flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <XCircle className="size-4" />
                          إلغاء الطلب
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="text-right" dir="rtl">
                        <DialogHeader>
                          <DialogTitle>هل أنت متأكد من إلغاء الطلب؟</DialogTitle>
                          <DialogDescription>
                            سيتم إلغاء الطلب نهائياً ولا يمكن التراجع عن هذا الإجراء.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 flex justify-end gap-3">
                          <Button
                            variant="ghost"
                            onClick={() => setCancelDialogOpen(false)}
                            className="cursor-pointer"
                          >
                            تراجع
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleCancelOrder}
                            disabled={isUpdatingStatus}
                            className="cursor-pointer"
                          >
                            تأكيد الإلغاء
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* No actions message */}
                  {!["accepted", "in_progress", "pending", "quoted"].includes(order.status) && (
                    <p className="text-sm text-muted-foreground text-center">
                      لا توجد إجراءات متاحة لهذا الطلب.
                    </p>
                  )}
                </div>
              )}

              {/* CLIENT ACTIONS */}
              {isClient && (
                <div className="flex flex-col gap-3">
                  {/* Quote is submitted, client needs to accept/reject */}
                  {order.status === "quoted" && (
                    <div className="space-y-3">
                      <Button
                        asChild
                        className="w-full font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        <Link to="/checkout/$id" params={{ id: String(order.id) }}>
                          قبول العرض والدفع
                        </Link>
                      </Button>

                      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            disabled={isUpdatingStatus}
                            className="w-full font-semibold border-destructive text-destructive hover:bg-destructive/10 cursor-pointer"
                          >
                            رفض وإلغاء الطلب
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="text-right" dir="rtl">
                          <DialogHeader>
                            <DialogTitle>هل أنت متأكد من رفض وإلغاء الطلب؟</DialogTitle>
                            <DialogDescription>
                              سيتم رفض عرض السعر المقدم وإلغاء الطلب بالكامل.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4 flex justify-end gap-3">
                            <Button
                              variant="ghost"
                              onClick={() => setCancelDialogOpen(false)}
                              className="cursor-pointer"
                            >
                              تراجع
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleCancelOrder}
                              disabled={isUpdatingStatus}
                              className="cursor-pointer"
                            >
                              تأكيد الرفض والإلغاء
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}

                  {/* Client cancel pending (no quote submitted yet) */}
                  {order.status === "pending" && (
                    <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          disabled={isUpdatingStatus}
                          className="w-full font-bold flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <XCircle className="size-4" />
                          إلغاء الطلب
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="text-right" dir="rtl">
                        <DialogHeader>
                          <DialogTitle>هل أنت متأكد من إلغاء الطلب؟</DialogTitle>
                          <DialogDescription>
                            سيتم إلغاء الطلب نهائياً ولا يمكن التراجع عن هذا الإجراء.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 flex justify-end gap-3">
                          <Button
                            variant="ghost"
                            onClick={() => setCancelDialogOpen(false)}
                            className="cursor-pointer"
                          >
                            تراجع
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleCancelOrder}
                            disabled={isUpdatingStatus}
                            className="cursor-pointer"
                          >
                            تأكيد الإلغاء
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Client leave review (completed but not yet reviewed) */}
                  {order.status === "completed" && !order.reviewId && (
                    <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full font-bold flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white cursor-pointer">
                          <MessageSquare className="size-4" />
                          إضافة تقييم للخدمة
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="text-right" dir="rtl">
                        <DialogHeader>
                          <DialogTitle>تقييم الخدمة</DialogTitle>
                          <DialogDescription>
                            شاركنا تجربتك ورأيك بالخدمة المقدمة لمساعدة الآخرين.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold">التقييم:</label>
                            <div className="flex items-center gap-1.5 justify-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setRating(i + 1)}
                                  className="transition-transform active:scale-95 hover:scale-110 cursor-pointer"
                                >
                                  <Star
                                    className={`size-8 ${
                                      i < rating
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-muted-foreground/30"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-sm font-semibold" htmlFor="review-comment">
                              التعليق:
                            </label>
                            <textarea
                              id="review-comment"
                              placeholder="اكتب تجربتك مع مزود الخدمة هنا..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              disabled={isSubmittingReview}
                              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-right min-h-[100px]"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <Button
                            variant="ghost"
                            onClick={() => setReviewDialogOpen(false)}
                            className="cursor-pointer"
                          >
                            تراجع
                          </Button>
                          <Button
                            onClick={handleLeaveReview}
                            disabled={isSubmittingReview}
                            className="bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                          >
                            تقديم التقييم
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* No actions message */}
                  {!["pending", "quoted", "completed"].includes(order.status) && (
                    <p className="text-sm text-muted-foreground text-center">
                      لا توجد إجراءات متاحة لهذا الطلب.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
