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
import { Settings, BarChart3, Users, Landmark } from "lucide-react"
import { formatPrice } from "../../../shared/constants"

export const Route = createFileRoute("/admin/finance")({
  component: AdminFinanceComponent,
})

function AdminFinanceComponent() {
  // Lifetime stats for general context
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = trpc.admin.stats.useQuery()

  // Month Picker State
  const [selectedMonthStr, setSelectedMonthStr] = useState(() => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    return `${yyyy}-${mm}`
  })

  const [yearStr, monthStr] = selectedMonthStr.split("-")
  const year = parseInt(yearStr) || new Date().getFullYear()
  const month = parseInt(monthStr) || (new Date().getMonth() + 1)

  // tRPC monthly queries
  const { data: report, isLoading: reportLoading } =
    trpc.admin.financialReport.useQuery({ year, month })

  const { data: topProviders, isLoading: topProvidersLoading } =
    trpc.admin.topProviders.useQuery({ year, month })

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

  if (statsLoading || reportLoading || topProvidersLoading) {
    return (
      <div className="container mx-auto space-y-4 p-6" dir="rtl">
        <Skeleton className="h-10 w-1/4" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const commissionRate = stats?.commissionRate ?? 0.1

  // Monthly stats calculations
  const monthlyCompletedCount = report?.length ?? 0
  const monthlyRevenue = report?.reduce((sum, ord) => sum + (ord.amount ?? 0), 0) ?? 0
  const monthlyAdminCut = monthlyRevenue * commissionRate
  const monthlyProviderNet = monthlyRevenue - monthlyAdminCut

  return (
    <div className="container mx-auto space-y-6 px-4 py-8 sm:px-6 text-right" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">التقارير والإعدادات المالية</h1>
        <p className="mt-2 text-muted-foreground">
          راجع إجمالي الإيرادات وعمولات المنصة وقم بضبط نسبة الاقتطاع من المبيعات
        </p>
      </div>

      {/* Month Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border border-border">
        <div className="space-y-1">
          <h2 className="text-lg font-bold">فلترة التقارير المالية</h2>
          <p className="text-xs text-muted-foreground">اختر الشهر لعرض الإحصائيات وجدول المتصدرين</p>
        </div>
        <Input
          type="month"
          value={selectedMonthStr}
          onChange={(e) => setSelectedMonthStr(e.target.value)}
          className="w-full sm:w-48 text-right bg-background cursor-pointer"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Statistics and Ledger */}
        <div className="space-y-6 md:col-span-2">
          {/* Filtered Monthly Stats Cards */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <Card className="border border-border shadow-xs">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground block">مبيعات الشهر</span>
                <span className="text-lg sm:text-xl font-extrabold text-foreground block">
                  {formatPrice(monthlyRevenue)}
                </span>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-xs">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground block">عمولة المنصة</span>
                <span className="text-lg sm:text-xl font-extrabold text-primary block">
                  {formatPrice(monthlyAdminCut)}
                </span>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-xs">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground block">صافي المزودين</span>
                <span className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 block">
                  {formatPrice(monthlyProviderNet)}
                </span>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-xs">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground block">الطلبات المكتملة</span>
                <span className="text-lg sm:text-xl font-extrabold text-foreground block">
                  {monthlyCompletedCount} طلبات
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Top Providers Leaderboard for the month */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-muted-foreground" />
                متصدرو مقدمي الخدمات للشهر ({month} / {year})
              </CardTitle>
              <CardDescription>أفضل 10 مزودين من حيث المبيعات والطلبات المكتملة في هذا الشهر</CardDescription>
            </CardHeader>
            <CardContent>
              {topProvidersLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : !topProviders || topProviders.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  لا توجد طلبات مكتملة أو بيانات ليدربورد لهذا الشهر.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">مزود الخدمة</TableHead>
                        <TableHead className="text-right">عدد الطلبات</TableHead>
                        <TableHead className="text-right">إجمالي المبيعات</TableHead>
                        <TableHead className="text-right">عمولة المنصة ({ (commissionRate * 100).toFixed(0) }%)</TableHead>
                        <TableHead className="text-right">صافي أرباح المزود</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProviders.map((prov) => (
                        <TableRow key={prov.providerId}>
                          <TableCell className="font-bold">{prov.providerName}</TableCell>
                          <TableCell>{prov.orderCount} طلبات</TableCell>
                          <TableCell className="font-semibold">{formatPrice(prov.grossRevenue)}</TableCell>
                          <TableCell className="text-primary">{formatPrice(prov.adminCut)}</TableCell>
                          <TableCell className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatPrice(prov.netToProvider)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Sales Ledger for the month */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5 text-muted-foreground" />
                سجل المبيعات والعمولات التفصيلي للشهر ({month} / {year})
              </CardTitle>
              <CardDescription>قائمة بالمعاملات المكتملة المسجلة خلال هذا الشهر وحصة المنصة منها</CardDescription>
            </CardHeader>
            <CardContent>
              {report?.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  لا توجد معاملات مسجلة في هذا الشهر.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">رقم الطلب</TableHead>
                        <TableHead className="text-right">اسم الخدمة</TableHead>
                        <TableHead className="text-right">العميل</TableHead>
                        <TableHead className="text-right">قيمة الطلب</TableHead>
                        <TableHead className="text-right">العمولة المستقطعة</TableHead>
                        <TableHead className="text-right">تاريخ الإكمال</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report?.map((ord) => (
                        <TableRow key={ord.id}>
                          <TableCell className="font-mono">#{ord.id}</TableCell>
                          <TableCell className="font-bold">{ord.serviceTitle}</TableCell>
                          <TableCell>{ord.clientName || "غير معروف"}</TableCell>
                          <TableCell>{ord.amount ? formatPrice(ord.amount) : "0 ₪"}</TableCell>
                          <TableCell className="font-semibold text-primary">
                            {ord.amount ? formatPrice(ord.amount * commissionRate) : "0 ₪"}
                          </TableCell>
                          <TableCell>{new Date(ord.createdAt).toLocaleDateString("ar-EG")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar settings */}
        <div className="space-y-6">
          {/* System Settings form */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
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
                  <label className="text-sm font-medium">نسبة الاقتطاع (%)</label>
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
                <Button type="submit" className="w-full font-semibold cursor-pointer" disabled={isUpdating}>
                  {isUpdating ? "جاري الحفظ..." : "حفظ التغييرات المالية"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lifetime Platform Overview card */}
          <Card className="border border-border shadow-sm bg-muted/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="size-5 text-muted-foreground" />
                نظرة شاملة تراكمية (Lifetime)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-sm text-muted-foreground">إجمالي مبيعات المنصة:</span>
                <span className="font-bold">{formatPrice(stats?.totalRevenue ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-sm text-muted-foreground">إجمالي عمولات المنصة:</span>
                <span className="font-bold text-primary">{formatPrice(stats?.totalCommission ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center pb-1">
                <span className="text-sm text-muted-foreground">إجمالي المستخدمين:</span>
                <span className="font-bold">{stats?.totalUsers ?? 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
