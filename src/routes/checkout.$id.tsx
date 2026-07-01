import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Calendar, Key, User, Smartphone, Wallet, Landmark, FileText, Lock } from "lucide-react";
import { formatPrice } from "../../shared/constants";

export const Route = createFileRoute("/checkout/$id")({
  component: CheckoutComponent,
});

type PaymentMethod = "card" | "jawwal_pay" | "paypal" | "bank_transfer";

function CheckoutComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const parsedOrderId = parseInt(id);
  const { data: session } = useSession();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");

  // Credit Card Form States
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");
  const [expiryDate, setExpiryDate] = useState("12/28");
  const [cvv, setCvv] = useState("123");
  const [cardHolder, setCardHolder] = useState("");

  // Wire/App Form States
  const [accountNumber, setAccountNumber] = useState("");
  const [details, setDetails] = useState("");

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
    } else {
      if (!accountNumber.trim()) {
        toast.error("الرجاء إدخال رقم الحساب أو الهاتف");
        return;
      }
      if (!details.trim()) {
        toast.error("الرجاء تعبئة متطلبات الطلب وملاحظاتك");
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
        });
        toast.success("تمت عملية الدفع بالبطاقة الافتراضية بنجاح!");
      } else {
        const methodLabels: Record<string, string> = {
          jawwal_pay: "جوال باي",
          paypal: "Palpay",
          bank_transfer: "تحويل بنكي",
        };
        const label = methodLabels[paymentMethod];
        const paymentProof = `الطريقة: ${label} - رقم تأكيد العميل: ${accountNumber}`;

        await updateStatusMutation.mutateAsync({
          orderId: parsedOrderId,
          status: "pending", // Keep order status pending as per user request
          paymentMethod,
          paymentProof,
          accountNumber,
          details,
          paymentStatus: "pending_verification",
        });
        toast.success("تم إرسال تفاصيل الدفع والطلب بنجاح! بانتظار تأكيد مزود الخدمة.");
      }
      navigate({ to: "/my-orders" });
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

  const getDynamicPlaceholder = () => {
    switch (paymentMethod) {
      case "jawwal_pay":
        return "أدخل رقم الهاتف لمحفظة جوال باي (مثال: 059xxxxxxx)";
      case "paypal":
        return "أدخل رقم الحساب أو البريد الإلكتروني الخاص بـ Palpay";
      case "bank_transfer":
        return "أدخل رقم الحساب البنكي أو رقم التحويل / رقم العملية";
      default:
        return "أدخل رقم الحساب أو الهاتف";
    }
  };

  const getDynamicLabel = () => {
    switch (paymentMethod) {
      case "jawwal_pay":
        return "رقم الهاتف لمحفظة جوال باي";
      case "paypal":
        return "رقم الحساب / البريد الإلكتروني لـ Palpay";
      case "bank_transfer":
        return "رقم الحساب البنكي / الحوالة";
      default:
        return "رقم الحساب / الهاتف";
    }
  };

  return (
    <div className="container mx-auto max-w-xl px-4 py-8 sm:px-6 text-right animate-in fade-in duration-300" dir="rtl">
      <Card className="border border-border shadow-lg bg-card rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-border bg-secondary/10 pb-6 pt-8">
          <CardTitle className="text-2xl font-black text-foreground">إتمام الدفع</CardTitle>
          <CardDescription className="text-sm mt-1 text-muted-foreground">الخطوة الأخيرة لبدء تنفيذ طلبك</CardDescription>
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
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground mb-3">اختر طريقة الدفع</h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Credit Card */}
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all cursor-pointer gap-2 hover:bg-secondary/20 ${
                  paymentMethod === "card"
                    ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <CreditCard className="size-6 shrink-0" />
                <span className="text-xs font-bold">بطاقة دفع</span>
              </button>

              {/* Jawwal Pay */}
              <button
                type="button"
                onClick={() => setPaymentMethod("jawwal_pay")}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all cursor-pointer gap-2 hover:bg-secondary/20 ${
                  paymentMethod === "jawwal_pay"
                    ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <Smartphone className="size-6 shrink-0" />
                <span className="text-xs font-bold">جوال باي</span>
              </button>

              {/* Palpay */}
              <button
                type="button"
                onClick={() => setPaymentMethod("paypal")}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all cursor-pointer gap-2 hover:bg-secondary/20 ${
                  paymentMethod === "paypal"
                    ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <Wallet className="size-6 shrink-0" />
                <span className="text-xs font-bold">Palpay</span>
              </button>

              {/* Bank Transfer */}
              <button
                type="button"
                onClick={() => setPaymentMethod("bank_transfer")}
                className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all cursor-pointer gap-2 hover:bg-secondary/20 ${
                  paymentMethod === "bank_transfer"
                    ? "border-primary bg-primary/5 text-primary shadow-sm ring-1 ring-primary"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <Landmark className="size-6 shrink-0" />
                <span className="text-xs font-bold">تحويل بنكي</span>
              </button>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handlePayment} className="space-y-5 border-t border-border/50 pt-5">
            {paymentMethod === "card" ? (
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
                    <label className="text-xs font-bold text-muted-foreground">رمز الأمان (CVV)</label>
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
                  <label className="text-xs font-bold text-muted-foreground">اسم حامل البطاقة</label>
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
              </>
            ) : (
              <>
                <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <FileText className="size-4 text-muted-foreground" />
                  معلومات التحويل وتفاصيل الطلب
                </h4>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">{getDynamicLabel()}</label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="pr-10 text-right bg-background font-semibold"
                      placeholder={getDynamicPlaceholder()}
                      required
                    />
                    <User className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground">متطلبات الطلب وملاحظاتك للمزود</label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-right text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                    placeholder="الموقع، وقت التنفيذ، تفاصيل إضافية للمزود..."
                    rows={4}
                    required
                  />
                </div>
              </>
            )}

            <Button type="submit" className="mt-8 w-full font-bold cursor-pointer flex items-center justify-center gap-2" size="lg" disabled={isPaying}>
              <Lock className="size-4" />
              <span>
                {isPaying
                  ? "جاري معالجة الطلب والدفع..."
                  : paymentMethod === "card"
                  ? `دفع ${order.amount ? formatPrice(order.amount) : "0 ₪"}`
                  : `إتمام الطلب وتأكيد التحويل (${order.amount ? formatPrice(order.amount) : "0 ₪"})`}
              </span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
