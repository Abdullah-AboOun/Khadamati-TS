import { createFileRoute } from "@tanstack/react-router"
import { trpc } from "@/lib/trpc"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"
import { Wallet, Settings, TrendingUp } from "lucide-react"
import { formatPrice } from "../../../shared/constants"

export const Route = createFileRoute("/admin/finance")({
  component: AdminFinanceComponent,
})

function AdminFinanceComponent() {
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = trpc.admin.stats.useQuery()
  const { data: report, isLoading: reportLoading } =
    trpc.admin.financialReport.useQuery()

  const [commissionInput, setCommissionInput] = useState(() => {
    return stats ? (stats.commissionRate * 100).toString() : ""
  })
  const [isUpdating, setIsUpdating] = useState(false)

  // mutations
  const updateCommissionMutation = trpc.admin.updateCommissionRate.useMutation()

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault()
    const ratePercentage = parseFloat(commissionInput)
    if (isNaN(ratePercentage) || ratePercentage < 0 || ratePercentage > 100) {
      toast.error("الرجاء إدخال نسبة صحيحة بين 0% و 100%")
      return
    }

    setIsUpdating(true)
    try {
      await updateCommissionMutation.mutateAsync({
        commissionRate: ratePercentage / 100,
      })
      toast.success("تم تحديث نسبة عمولة النظام بنجاح!")
      refetchStats()
    } catch (err) {
      const error = err as Error
      toast.error(error.message || "حدث خطأ أثناء تحديث نسبة العمولة")
    } finally {
      setIsUpdating(false)
    }
  }

  if (statsLoading || reportLoading) {
    return (
      <div className="container mx-auto space-y-4 p-6">
        <Skeleton className="h-10 w-1/4" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const commissionRate = stats?.commissionRate ?? 0.1

  return (
    <div className="container mx-auto space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          التقارير والإعدادات المالية
        </h1>
        <p className="mt-2 text-muted-foreground">
          راجع إجمالي الإيرادات وعمولات المنصة وقم بضبط نسبة الاقتطاع من
          المبيعات
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Statistics Widgets */}
        <div className="space-y-6 md:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  إجمالي حجم مبيعات المنصة
                </CardTitle>
                <TrendingUp className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatPrice(stats?.totalRevenue ?? 0)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  من مبيعات كافة الخدمات المكتملة
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  إجمالي العمولات المكتسبة
                </CardTitle>
                <Wallet className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatPrice(stats?.totalCommission ?? 0)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  صافي أرباح المنصة المستحقة
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Completed Sales Ledger */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle>سجل المبيعات والعمولات بالتفصيل</CardTitle>
              <CardDescription>
                قائمة بالطلبات المكتملة وحصة المنصة المستحقة من كل معاملة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رقم الطلب</TableHead>
                      <TableHead className="text-right">اسم الخدمة</TableHead>
                      <TableHead className="text-right">قيمة الطلب</TableHead>
                      <TableHead className="text-right">
                        عمولة المنصة ({(commissionRate * 100).toFixed(0)}%)
                      </TableHead>
                      <TableHead className="text-right">تاريخ الدفع</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report?.map((ord) => (
                      <TableRow key={ord.id}>
                        <TableCell className="font-mono">#{ord.id}</TableCell>
                        <TableCell className="font-bold">
                          {ord.serviceTitle}
                        </TableCell>
                        <TableCell>
                          {ord.amount ? formatPrice(ord.amount) : "0 ₪"}
                        </TableCell>
                        <TableCell className="font-bold text-primary">
                          {ord.amount
                            ? formatPrice(ord.amount * commissionRate)
                            : "0 ₪"}
                        </TableCell>
                        <TableCell>
                          {new Date(ord.createdAt).toLocaleDateString("ar")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings widget */}
        <div key={stats ? stats.commissionRate : "loading"}>
          <Card className="border border-border shadow-sm">
            <CardHeader className="text-right">
              <CardTitle className="flex items-center gap-2">
                <Settings className="size-5 text-muted-foreground" />
                إعدادات عمولة النظام
              </CardTitle>
              <CardDescription>
                اضبط النسبة المئوية المقتطعة من مبيعات الخدمات المكتملة بالمنصة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateCommission} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    نسبة الاقتطاع (%)
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="10.0"
                      value={commissionInput}
                      onChange={(e) => setCommissionInput(e.target.value)}
                      className="pl-10 text-right"
                      required
                    />
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full font-semibold"
                  disabled={isUpdating}
                >
                  {isUpdating ? "جاري الحفظ..." : "حفظ التغييرات المالية"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
