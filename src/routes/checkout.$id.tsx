import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Calendar, Key, User, Lock, Zap, Check } from "lucide-react";
import { formatPrice } from "../../shared/constants";
import { JawwalPayModal } from "@/components/jawwal-pay-modal";
import { JawwalPayLogo } from "@/components/jawwal-pay-logo";

export const Route = createFileRoute("/checkout/$id")({
  component: CheckoutComponent,
});

type PaymentMethod = "jawwal_pay_api" | "card";

function CheckoutComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const parsedOrderId = parseInt(id);
  const { data: session } = useSession();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("jawwal_pay_api");
  const [jawwalPayModalOpen, setJawwalPayModalOpen] = useState(false);

  // Credit Card Form States
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");
  const [expiryDate, setExpiryDate] = useState("12/28");
  const [cvv, setCvv] = useState("123");
  const [cardHolder, setCardHolder] = useState("");

  const [isPaying, setIsPaying] = useState(false);

  // tRPC query to fetch order details
  const { data: order, isLoading } = trpc.orders.getById.useQuery({
    orderId: parsedOrderId,
  });

  // tRPC mutation to accept status/payment
  const updateStatusMutation = trpc.orders.updateStatus.useMutation();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === "card") {
      if (!cardNumber || !expiryDate || !cvv || !cardHolder) {
        toast.error("الرجاء تعبئة جميع معلومات البطاقة");
        return;
      }
    }

    setIsPaying(true);

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      if (paymentMethod === "card") {
        await updateStatusMutation.mutateAsync({
          orderId: parsedOrderId,
          status: "accepted", // Client accepts and pays order directly
          paymentStatus: "completed",
          paymentMethod: "card",
        });
        toast.success("تمت عملية الدفع بالبطاقة بنجاح!");
        navigate({ to: `/orders/${parsedOrderId}` });
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء إتمام الدفع");
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-xl space-y-6 p-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-16 text-center">
        <h2 className="text-xl font-bold text-destructive">الطلب غير موجود</h2>
        <Button onClick={() => navigate({ to: "/" })} className="mt-4 cursor-pointer">
          العودة للرئيسية
        </Button>
      </div>
    );
  }

  return (
    <div
      className="container mx-auto max-w-xl px-4 py-8 sm:px-6 text-right animate-in fade-in duration-300"
      dir="rtl"
    >
      <Card className="border border-border shadow-lg bg-card rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border bg-secondary/10 pb-6 pt-8">
          <CardTitle className="text-2xl font-black text-foreground">إتمام الدفع</CardTitle>
          <CardDescription className="text-sm mt-1 text-muted-foreground">
            الخطوة الأخيرة لبدء تنفيذ طلبك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Order Summary */}
          <div className="space-y-3 rounded-xl bg-secondary/20 p-4 border border-border/40">
            <h4 className="text-xs font-bold text-muted-foreground">ملخص الطلب</h4>
            <div className="flex items-center justify-between border-t border-border/40 pt-3 text-sm">
              <span className="font-semibold text-foreground">{order.serviceTitle}</span>
              <span className="font-black text-primary text-base">
                {order.amount ? formatPrice(order.amount) : "0 ₪"}
              </span>
            </div>
          </div>

          {/* Payment Method Selector Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground">اختر طريقة الدفع</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Jawwal Pay Merchant API */}
              <button
                type="button"
                onClick={() => setPaymentMethod("jawwal_pay_api")}
                className={`p-3.5 sm:p-4 border rounded-2xl transition-all cursor-pointer text-right flex items-center justify-between gap-3 ${
                  paymentMethod === "jawwal_pay_api"
                    ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30 shadow-md"
                    : "border-border bg-card hover:bg-secondary/20"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <JawwalPayLogo className="size-11 shrink-0 aspect-square" />
                  <div className="flex flex-col text-right min-w-0">
                    <span className="font-extrabold text-sm text-foreground leading-tight">
                      جوال باي
                    </span>
                    <span className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                      Jawwal Pay
                    </span>
                  </div>
                </div>
                <div
                  className={`size-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    paymentMethod === "jawwal_pay_api"
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {paymentMethod === "jawwal_pay_api" && <Check className="size-3.5 stroke-[3]" />}
                </div>
              </button>

              {/* Credit Card */}
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`p-3.5 sm:p-4 border rounded-2xl transition-all cursor-pointer text-right flex items-center justify-between gap-3 ${
                  paymentMethod === "card"
                    ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-md"
                    : "border-border bg-card hover:bg-secondary/20"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 aspect-square shadow-xs">
                    <CreditCard className="size-6" />
                  </div>
                  <div className="flex flex-col text-right min-w-0">
                    <span className="font-extrabold text-sm text-foreground leading-tight">
                      بطاقة دفع
                    </span>
                    <span className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                      Credit Card
                    </span>
                  </div>
                </div>
                <div
                  className={`size-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    paymentMethod === "card"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {paymentMethod === "card" && <Check className="size-3.5 stroke-[3]" />}
                </div>
              </button>
            </div>
          </div>

          {/* Payment Form / Interactive Modal Launcher */}
          <form onSubmit={handlePayment} className="space-y-5 border-t border-border/50 pt-5">
            {paymentMethod === "jawwal_pay_api" ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <Zap className="size-4 text-emerald-600" />
                  <span>دفع إلكتروني مباشر عبر Jawwal Pay</span>
                </div>
                <Button
                  type="button"
                  onClick={() => setJawwalPayModalOpen(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer gap-2.5 h-12 rounded-xl text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center"
                  size="lg"
                >
                  <JawwalPayLogo className="size-6" />
                  <span>فتح نافذة الدفع (بوابة جوال باي)</span>
                </Button>
              </div>
            ) : (
              <>
                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <CreditCard className="size-4 text-muted-foreground" />
                  معلومات بطاقة الدفع (محاكاة)
                </h4>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">رقم البطاقة</label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="pr-10 text-right bg-background"
                      required
                    />
                    <CreditCard className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">تاريخ الانتهاء</label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="pr-10 text-right bg-background"
                        placeholder="MM/YY"
                        required
                      />
                      <Calendar className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">
                      رمز الأمان (CVV)
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="pr-10 text-right bg-background"
                        placeholder="123"
                        maxLength={4}
                        required
                      />
                      <Key className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">
                    اسم حامل البطاقة
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="pr-10 text-right bg-background"
                      placeholder={session?.user?.name || "اسمك الكامل"}
                      required
                    />
                    <User className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="mt-8 w-full font-bold cursor-pointer flex items-center justify-center gap-2"
                  size="lg"
                  disabled={isPaying}
                >
                  <Lock className="size-4" />
                  <span>
                    {isPaying
                      ? "جاري معالجة الطلب والدفع..."
                      : `دفع ${order.amount ? formatPrice(order.amount) : "0 ₪"}`}
                  </span>
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Jawwal Pay Merchant API Interactive Modal */}
      <JawwalPayModal
        open={jawwalPayModalOpen}
        onOpenChange={setJawwalPayModalOpen}
        orderId={parsedOrderId}
        amount={order.amount ?? 0}
        serviceTitle={order.serviceTitle}
        defaultPhone={(session?.user as { phone?: string })?.phone || "0599000000"}
        onSuccess={() => {
          navigate({ to: `/orders/${parsedOrderId}` });
        }}
      />
    </div>
  );
}
