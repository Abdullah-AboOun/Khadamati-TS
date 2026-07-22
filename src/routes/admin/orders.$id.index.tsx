import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatPrice, STATUS_LABELS } from "../../../shared/constants";
import {
  ArrowRight,
  Printer,
  Calendar,
  User,
  Phone,
  Briefcase,
  TrendingUp,
  Clock,
  AlertCircle,
  Wallet,
  Smartphone,
} from "lucide-react";

export const Route = createFileRoute("/admin/orders/$id/")({
  component: AdminOrderDetailComponent,
});

const STATUS_COLOR_CLASSES: Record<string, string> = {
  pending: "bg-primary/10 text-primary border-primary/20",
  quoted: "bg-primary/10 text-primary border-primary/20",
  accepted: "bg-primary/10 text-primary border-primary/20",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border-red-200",
};

function AdminOrderDetailComponent() {
  const { id } = useParams({ from: "/admin/orders/$id/" });
  const orderId = parseInt(id);

  const { data: order, isLoading, refetch } = trpc.orders.getById.useQuery({ orderId });
  const { data: stats } = trpc.admin.stats.useQuery();

  // Mutations
  const updateStatusMutation = trpc.orders.updateStatus.useMutation();

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: newStatus as Parameters<typeof updateStatusMutation.mutateAsync>[0]["status"],
      });
      toast.success("تم تحديث حالة الطلب بنجاح");
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء تحديث حالة الطلب");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-4 p-6" dir="rtl">
        <Skeleton className="h-10 w-1/4" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-64 md:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-6 text-center" dir="rtl">
        <AlertCircle className="mx-auto size-12 text-destructive" />
        <h2 className="text-xl font-bold mt-2">الطلب غير موجود</h2>
        <p className="text-muted-foreground mt-1">
          عذراً، لم نتمكن من العثور على الطلب المطلوب أو لا تملك صلاحية عرضه.
        </p>
        <Button asChild className="mt-4 cursor-pointer">
          <Link to="/admin/orders">العودة للطلبات</Link>
        </Button>
      </div>
    );
  }

  // Calculate pricing split
  const amount = order.amount ?? 0;
  const commissionRate = stats?.commissionRate ?? 0.15;
  const adminCommission = amount * commissionRate;
  const providerEarnings = amount - adminCommission;

  // Determine valid chronological transitions based on state machine
  const currentStatus = order.status;
  const allowedTransitions: { value: string; label: string }[] = [];

  if (currentStatus === "pending") {
    // If quote-based service, provider can submit quote. If fixed price, client can accept.
    allowedTransitions.push({ value: "quoted", label: "تقديم عرض سعر" });
    allowedTransitions.push({ value: "accepted", label: "قبول الطلب والبدء" });
    allowedTransitions.push({ value: "cancelled", label: "إلغاء الطلب" });
  } else if (currentStatus === "quoted") {
    allowedTransitions.push({ value: "accepted", label: "قبول العرض" });
    allowedTransitions.push({ value: "cancelled", label: "إلغاء الطلب" });
  } else if (currentStatus === "accepted") {
    allowedTransitions.push({ value: "in_progress", label: "بدء العمل" });
    allowedTransitions.push({ value: "cancelled", label: "إلغاء الطلب" });
  } else if (currentStatus === "in_progress") {
    allowedTransitions.push({ value: "completed", label: "إكمال الطلب" });
    allowedTransitions.push({ value: "cancelled", label: "إلغاء الطلب" });
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8 sm:px-6 text-right" dir="rtl">
      {/* Top navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="cursor-pointer">
          <Link to="/admin/orders" className="flex items-center gap-1.5">
            <ArrowRight className="size-4" />
            <span>العودة للطلبات</span>
          </Link>
        </Button>
      </div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">تفاصيل الطلب #{order.id}</h1>
            <Badge className={`${STATUS_COLOR_CLASSES[order.status]}`} variant="outline">
              {STATUS_LABELS[order.status]}
            </Badge>
          </div>
          <p className="mt-2 text-muted-foreground flex items-center gap-1.5">
            <Calendar className="size-4" />
            <span>تاريخ الطلب: {new Date(order.createdAt).toLocaleString("ar")}</span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button variant="outline" asChild className="cursor-pointer">
            <a href={`/admin/orders/${order.id}/print`} target="_blank" rel="noreferrer">
              <Printer className="ml-1.5 size-4" />
              طباعة الفاتورة
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Details card */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border border-border shadow-xs bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="size-5 text-primary" />
                <span>الخدمة المطلوبة</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{order.serviceTitle}</h3>
                <span className="text-sm text-muted-foreground mt-1 block">
                  التصنيف: {order.categoryName}
                </span>
              </div>

              {order.details && (
                <div className="bg-muted/40 p-4 rounded-xl border border-border mt-4">
                  <span className="text-xs font-bold text-muted-foreground block mb-1">
                    تفاصيل الطلب من العميل:
                  </span>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{order.details}</p>
                </div>
              )}

              {order.paymentMethod === "jawwal_pay" || order.gatewayTxId ? (
                <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border border-emerald-500/30 p-4 rounded-xl mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Smartphone className="size-4 text-emerald-600" />
                      مدفوع عبر بوابة جوال باي Merchant API (محرَّك آلياً)
                    </span>
                    <Badge className="bg-emerald-600 text-white font-mono text-[11px]">
                      {order.paymentStatus === "completed" ? "مكتمل آلياً ⚡" : order.paymentStatus}
                    </Badge>
                  </div>
                  {order.gatewayTxId && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs text-muted-foreground font-semibold">رقم عملية البوابة (Gateway Tx ID):</span>
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
                <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-xl mt-4">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5">
                    <Wallet className="size-4" />
                    معلومات وإثبات الدفع:
                  </span>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {order.paymentProof}
                  </p>
                </div>
              ) : null}

              {order.notes && (
                <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl mt-4">
                  <span className="text-xs font-bold text-primary dark:text-primary block mb-1">
                    ملاحظات إضافية:
                  </span>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client & Provider info cards */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Client card */}
            <Card className="border border-border shadow-xs bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="size-4.5 text-primary" />
                  <span>بيانات العميل</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-sm text-muted-foreground">الاسم</span>
                  <span className="text-sm font-bold">{order.clientName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-sm text-muted-foreground">رقم الهاتف</span>
                  <span className="text-sm font-mono flex items-center gap-1">
                    <Phone className="size-3 text-muted-foreground" />
                    {order.clientPhone || "-"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Provider card */}
            <Card className="border border-border shadow-xs bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="size-4.5 text-indigo-600" />
                  <span>بيانات مزود الخدمة</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-sm text-muted-foreground">الاسم</span>
                  <span className="text-sm font-bold">{order.providerName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-sm text-muted-foreground">رقم الهاتف</span>
                  <span className="text-sm font-mono flex items-center gap-1">
                    <Phone className="size-3 text-muted-foreground" />
                    {order.providerPhone || "-"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Side Panel: Order Actions and Finances */}
        <div className="space-y-6">
          {/* Order Actions */}
          <Card className="border border-border shadow-xs bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="size-5 text-primary" />
                <span>حالة الطلب</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">
                  تعديل حالة الطلب (حسب تدفق العمل):
                </span>
                {allowedTransitions.length > 0 ? (
                  <Select value={order.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full text-right bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={order.status}>
                        {STATUS_LABELS[order.status]} (الحالية)
                      </SelectItem>
                      {allowedTransitions.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground border border-border">
                    لقد وصل هذا الطلب إلى حالة نهائية ({STATUS_LABELS[order.status]}) ولا يمكن تغيير
                    حالته.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Breakdown */}
          <Card className="border border-border shadow-xs bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="size-5 text-primary" />
                <span>البيانات المالية</span>
              </CardTitle>
              <CardDescription>تقسيم أرباح الخدمة وعمولة المنصة</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                <span className="text-sm text-muted-foreground">قيمة الخدمة الإجمالية</span>
                <span className="text-base font-bold">
                  {order.amount ? formatPrice(order.amount) : "قيد التسعير"}
                </span>
              </div>
              {order.amount && (
                <>
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      عمولة المنصة ({(commissionRate * 100).toFixed(0)}%)
                    </span>
                    <span className="text-sm font-semibold text-red-600">
                      - {formatPrice(adminCommission)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm font-bold text-foreground">صافي ربح المزود</span>
                    <span className="text-lg font-black text-emerald-600">
                      {formatPrice(providerEarnings)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
