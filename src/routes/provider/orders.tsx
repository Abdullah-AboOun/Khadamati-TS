import { createFileRoute, Link } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ClipboardList, FileText } from "lucide-react";
import { formatPrice, STATUS_LABELS } from "../../../shared/constants";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/provider/orders")({
  component: ProviderOrdersComponent,
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

function ProviderOrdersComponent() {
  const { data: orders, isLoading, refetch } = trpc.orders.getProviderOrders.useQuery();

  const [quoteOrderId, setQuoteOrderId] = useState<number | null>(null);
  const [quotedPrice, setQuotedPrice] = useState("");
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  // mutations
  const respondToQuoteMutation = trpc.orders.respondToQuote.useMutation();
  const updateStatusMutation = trpc.orders.updateStatus.useMutation();
  const cancelOrderMutation = trpc.orders.cancelOrder.useMutation();

  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: status as Parameters<typeof updateStatusMutation.mutateAsync>[0]["status"],
      });
      toast.success("تم تحديث حالة الطلب بنجاح");
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ في تحديث الطلب");
    }
  };

  const handleSendQuote = async () => {
    if (!quoteOrderId || !quotedPrice) return;
    const priceNum = parseFloat(quotedPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("الرجاء إدخال سعر صالح أكبر من صفر");
      return;
    }

    setIsSubmittingQuote(true);
    try {
      await respondToQuoteMutation.mutateAsync({
        orderId: quoteOrderId,
        quotedPrice: priceNum,
      });
      toast.success("تم إرسال التسعيرة للعميل بنجاح");
      setQuoteDialogOpen(false);
      setQuotedPrice("");
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء إرسال التسعيرة");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;
    setIsCancelling(true);
    try {
      await cancelOrderMutation.mutateAsync({ orderId: cancelOrderId });
      toast.success("تم إلغاء الطلب بنجاح");
      setCancelDialogOpen(false);
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء إلغاء الطلب");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-4 p-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">طلبات العملاء المستلمة</h1>
          <p className="mt-2 text-muted-foreground">
            أرسل تسعيرات لطلبات التسعير الجديدة وحدث حالة الطلبات الجاري تنفيذها
          </p>
        </div>

        {orders?.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <ClipboardList className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">لا توجد طلبات مستلمة بعد</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              ستظهر الطلبات هنا عندما يطلب أحد العملاء خدماتك.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders?.map((ord) => (
              <Card key={ord.id} className="border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground"># {ord.id}</span>
                      <Badge
                        className={`font-medium ${STATUS_COLOR_CLASSES[ord.status]}`}
                        variant="outline"
                      >
                        {STATUS_LABELS[ord.status]}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{ord.serviceTitle}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>
                        العميل:{" "}
                        <span className="font-semibold text-foreground">{ord.clientName}</span>
                      </span>
                      <span>•</span>
                      <span>تاريخ الطلب: {new Date(ord.createdAt).toLocaleDateString("ar")}</span>
                    </div>
                    {ord.details && (
                      <div className="mt-2 flex max-w-xl items-start gap-2 rounded-md bg-secondary/30 p-3 text-sm text-muted-foreground">
                        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <p>{ord.details}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-start justify-between gap-3 sm:items-end">
                    <div className="text-right">
                      <span className="block text-xs text-muted-foreground">
                        القيمة المتفق عليها
                      </span>
                      <span className="text-xl font-extrabold text-primary">
                        {ord.amount ? formatPrice(ord.amount) : "قيد التسعير"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-0">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/orders/$id" params={{ id: String(ord.id) }}>
                          عرض التفاصيل
                        </Link>
                      </Button>
                      {/* Quote pricing response button */}
                      {ord.status === "pending" && !ord.amount && (
                        <Dialog
                          open={quoteDialogOpen && quoteOrderId === ord.id}
                          onOpenChange={(open) => {
                            setQuoteDialogOpen(open);
                            if (open) setQuoteOrderId(ord.id);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" className="font-semibold">
                              تقديم عرض سعر
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="text-right" dir="rtl">
                            <DialogHeader className="text-right">
                              <DialogTitle>تقديم عرض سعر للعميل</DialogTitle>
                              <DialogDescription>
                                حدد التكلفة الإجمالية للخدمة بناءً على التفاصيل المطلوبة من العميل.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium">السعر المقترح (شيكل)</label>
                                <Input
                                  type="number"
                                  placeholder="0.00"
                                  value={quotedPrice}
                                  onChange={(e) => setQuotedPrice(e.target.value)}
                                  className="text-right"
                                  required
                                />
                              </div>
                              <Button
                                onClick={handleSendQuote}
                                className="w-full font-semibold"
                                disabled={isSubmittingQuote}
                              >
                                {isSubmittingQuote ? "جاري الإرسال..." : "إرسال عرض السعر"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                       {/* Provider accepts a pending order that has an amount (paid via wire transfer) */}
                      {ord.status === "pending" && ord.amount && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(ord.id, "accepted")}
                          className="bg-emerald-600 font-semibold hover:bg-emerald-700 text-white cursor-pointer"
                        >
                          تأكيد الدفع وقبول الطلب
                        </Button>
                      )}

                      {/* State transitions managed by provider */}
                      {ord.status === "accepted" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(ord.id, "in_progress")}
                          className="bg-orange-600 font-semibold hover:bg-orange-700"
                        >
                          البدء في التنفيذ
                        </Button>
                      )}

                      {ord.status === "in_progress" && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(ord.id, "completed")}
                          className="bg-emerald-600 font-semibold hover:bg-emerald-700"
                        >
                          إكمال التنفيذ وتسليم العمل
                        </Button>
                      )}

                      {/* Cancel order action for provider */}
                      {["pending", "quoted"].includes(ord.status) && (
                        <Dialog
                          open={cancelDialogOpen && cancelOrderId === ord.id}
                          onOpenChange={(open) => {
                            setCancelDialogOpen(open);
                            if (open) setCancelOrderId(ord.id);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="font-semibold cursor-pointer"
                            >
                              إلغاء الطلب
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="text-right" dir="rtl">
                            <DialogHeader className="text-right">
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
                                disabled={isCancelling}
                                className="cursor-pointer"
                              >
                                {isCancelling ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
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
  );
}
