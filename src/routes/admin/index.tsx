import { createFileRoute } from "@tanstack/react-router"
import { trpc } from "@/lib/trpc"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Briefcase, ClipboardList, Wallet } from "lucide-react"
import { formatPrice } from "../../../shared/constants"

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardComponent,
})

function AdminDashboardComponent() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery()

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <Skeleton className="h-10 w-1/4" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const statItems = [
    {
      title: "إجمالي المستخدمين",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      desc: "عملاء ومزودين مسجلين",
    },
    {
      title: "الخدمات النشطة",
      value: stats?.totalServices ?? 0,
      icon: Briefcase,
      desc: "خدمات معروضة في المنصة",
    },
    {
      title: "إجمالي الطلبات",
      value: stats?.totalOrders ?? 0,
      icon: ClipboardList,
      desc: "جميع الطلبات المقدمة",
    },
    {
      title: "إجمالي العمولات",
      value: formatPrice(stats?.totalCommission ?? 0),
      icon: Wallet,
      desc: `عمولة المنصة (${((stats?.commissionRate ?? 0.1) * 100).toFixed(0)}%)`,
    },
  ]

  return (
    <div className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة النظام</h1>
        <p className="mt-2 text-muted-foreground">
          نظرة عامة على أداء المنصة والإحصائيات الرئيسية
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {statItems.map((item, idx) => {
          const Icon = item.icon
          return (
            <Card key={idx} className="border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {item.title}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{item.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.desc}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Financial info summary card */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <CardTitle>أداء المبيعات والعمولات</CardTitle>
          <CardDescription>
            الملخص المالي للمبيعات المكتملة وعمولات المنصة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 py-2">
            <span className="text-sm text-muted-foreground">
              إجمالي قيمة مبيعات الخدمات المكتملة
            </span>
            <span className="text-lg font-bold">
              {formatPrice(stats?.totalRevenue ?? 0)}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-border/50 py-2">
            <span className="text-sm text-muted-foreground">
              نسبة عمولة المنصة الحالية
            </span>
            <span className="text-lg font-bold">
              {((stats?.commissionRate ?? 0.1) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-bold text-foreground">
              صافي عمولات المنصة المستحقة
            </span>
            <span className="text-xl font-extrabold text-primary">
              {formatPrice(stats?.totalCommission ?? 0)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
