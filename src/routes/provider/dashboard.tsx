import { createFileRoute, Link } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, CheckCircle, TrendingUp, Hourglass } from "lucide-react";
import { formatPrice, STATUS_LABELS } from "../../../shared/constants";

export const Route = createFileRoute("/provider/dashboard")({
  component: ProviderDashboardComponent,
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

function ProviderDashboardComponent() {
  const { data: orders, isLoading } = trpc.orders.getProviderOrders.useQuery();

  // Calculate statistics
  const totalOrders = orders?.length ?? 0;
  const activeOrders =
    orders?.filter((o) => ["pending", "quoted", "accepted", "in_progress"].includes(o.status))
      .length ?? 0;
  const completedOrders = orders?.filter((o) => o.status === "completed").length ?? 0;
  const totalEarnings =
    orders?.filter((o) => o.status === "completed").reduce((sum, o) => sum + (o.amount ?? 0), 0) ??
    0;

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <Skeleton className="h-10 w-1/4" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">لوحة التحكم للمزود</h1>
        <p className="mt-2 text-muted-foreground">
          تابع أعمالك، أرباحك، وطلبات العملاء من مكان واحد
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              إجمالي الطلبات
            </CardTitle>
            <ClipboardList className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              الطلبات النشطة
            </CardTitle>
            <Hourglass className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders}</div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              الطلبات المكتملة
            </CardTitle>
            <CheckCircle className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">
              إجمالي الأرباح
            </CardTitle>
            <TrendingUp className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatPrice(totalEarnings)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div>
            <CardTitle className="text-lg font-bold">آخر طلبات العملاء المستلمة</CardTitle>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/provider/orders">عرض وإدارة الطلبات</Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          {orders?.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">لم تستلم أي طلبات بعد.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right">
                <thead>
                  <tr className="border-b border-border text-sm font-medium text-muted-foreground">
                    <th className="pb-3">رقم الطلب</th>
                    <th className="pb-3">الخدمة</th>
                    <th className="pb-3">العميل</th>
                    <th className="pb-3">تاريخ الطلب</th>
                    <th className="pb-3">السعر</th>
                    <th className="pb-3 text-left">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {orders?.slice(0, 5).map((ord) => (
                    <tr key={ord.id} className="transition-colors hover:bg-muted/30">
                      <td className="py-4 font-mono">#{ord.id}</td>
                      <td className="py-4 font-bold">{ord.serviceTitle}</td>
                      <td className="py-4">{ord.clientName}</td>
                      <td className="py-4">{new Date(ord.createdAt).toLocaleDateString("ar")}</td>
                      <td className="py-4 font-semibold">
                        {ord.amount ? formatPrice(ord.amount) : "طلب تسعير"}
                      </td>
                      <td className="py-4 text-left">
                        <Badge className={`${STATUS_COLOR_CLASSES[ord.status]}`} variant="outline">
                          {STATUS_LABELS[ord.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
