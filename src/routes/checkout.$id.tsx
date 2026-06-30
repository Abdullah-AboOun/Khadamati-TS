import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { trpc } from "@/lib/trpc"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useState } from "react"
import { toast } from "sonner"
import { CreditCard, Calendar, Key, User } from "lucide-react"
import { formatPrice } from "../../shared/constants"

export const Route = createFileRoute("/checkout/$id")({
  component: CheckoutComponent,
})

function CheckoutComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const parsedOrderId = parseInt(id)
  const { data: session } = useSession()

  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111")
  const [expiryDate, setExpiryDate] = useState("12/28")
  const [cvv, setCvv] = useState("123")
  const [cardHolder, setCardHolder] = useState("")
  const [isPaying, setIsPaying] = useState(false)

  // tRPC query to fetch order details
  const { data: order, isLoading } = trpc.orders.getById.useQuery({
    orderId: parsedOrderId,
  })

  // tRPC mutation to accept status/payment
  const updateStatusMutation = trpc.orders.updateStatus.useMutation()

  const handlePayment = async (e: React.SubmitEvent) => {
    e.preventDefault()
    if (!cardNumber || !expiryDate || !cvv || !cardHolder) {
      toast.error("الرجاء تعبئة جميع معلومات البطاقة")
      return
    }

    setIsPaying(true)

    // Simulate network delay for payment
    await new Promise((resolve) => setTimeout(resolve, 1500))

    try {
      await updateStatusMutation.mutateAsync({
        orderId: parsedOrderId,
        status: "accepted", // mark order as accepted and paid
      })
      toast.success("تمت عملية الدفع الافتراضية بنجاح!")
      navigate({ to: "/my-orders" })
    } catch (err) {
      const error = err as Error
      toast.error(error.message || "حدث خطأ أثناء إتمام الدفع")
    } finally {
      setIsPaying(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-xl space-y-6 p-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto p-16 text-center">
        <h2 className="text-xl font-bold text-destructive">الطلب غير موجود</h2>
        <Button onClick={() => navigate({ to: "/" })} className="mt-4">
          العودة للرئيسية
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-8 sm:px-6">
      <Card className="border border-border shadow-lg">
        <CardHeader className="text-right">
          <CardTitle className="text-2xl font-bold">إتمام الدفع</CardTitle>
          <CardDescription>الخطوة الأخيرة لبدء تنفيذ طلبك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Summary */}
          <div className="space-y-2 rounded-xl bg-secondary/30 p-4">
            <h4 className="text-sm font-bold">ملخص الطلب</h4>
            <div className="flex items-center justify-between border-t border-border/50 pt-2 text-sm">
              <span className="text-muted-foreground">
                {order.serviceTitle}
              </span>
              <span className="font-bold text-primary">
                {order.amount ? formatPrice(order.amount) : "0 ₪"}
              </span>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handlePayment} className="space-y-4">
            <h4 className="flex items-center gap-2 border-b border-border pb-2 text-sm font-bold">
              <CreditCard className="size-4 text-muted-foreground" />
              معلومات بطاقة الدفع (محاكاة)
            </h4>

            <div className="space-y-2">
              <label className="text-sm font-medium">رقم البطاقة</label>
              <div className="relative">
                <Input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="pr-10 text-right"
                  required
                />
                <CreditCard className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">تاريخ الانتهاء</label>
                <div className="relative">
                  <Input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="pr-10 text-right"
                    placeholder="MM/YY"
                    required
                  />
                  <Calendar className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">رمز الأمان (CVV)</label>
                <div className="relative">
                  <Input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    className="pr-10 text-right"
                    placeholder="123"
                    maxLength={4}
                    required
                  />
                  <Key className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">اسم حامل البطاقة</label>
              <div className="relative">
                <Input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="pr-10 text-right"
                  placeholder={session?.user?.name || "اسمك الكامل"}
                  required
                />
                <User className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-6 w-full font-bold"
              size="lg"
              disabled={isPaying}
            >
              {isPaying
                ? "جاري الدفع الافتراضي..."
                : `دفع ${order.amount ? formatPrice(order.amount) : "0 ₪"}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
