import { createFileRoute, Link } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, ClipboardList, Wallet } from "lucide-react";
import { formatPrice } from "../../../shared/constants";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardComponent,
});

function AdminDashboardComponent() {
  const { data: stats, isLoading } = trpc.admin.stats.useQuery();

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
    );
  }

  const statItems = [
    {
      title: "إجمالي المستخدمين",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      desc: "عملاء ومزودين مسجلين",
      colorClass: "text-foreground",
      iconColorClass: "text-muted-foreground",
    },
    {
      title: "الخدمات النشطة",
      value: stats?.totalServices ?? 0,
      icon: Briefcase,
      desc: "خدمات معروضة في المنصة",
      colorClass: "text-emerald-600 dark:text-emerald-400",
      iconColorClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "إجمالي الطلبات",
      value: stats?.totalOrders ?? 0,
      icon: ClipboardList,
      desc: "جميع الطلبات المقدمة",
      colorClass: "text-foreground",
      iconColorClass: "text-muted-foreground",
    },
    {
      title: "إجمالي العمولات",
      value: formatPrice(stats?.totalCommission ?? 0),
      icon: Wallet,
      desc: `عمولة المنصة (${((stats?.commissionRate ?? 0.1) * 100).toFixed(0)}%)`,
      colorClass: "text-primary",
      iconColorClass: "text-primary",
    },
  ];

  return (
    <div className="container mx-auto space-y-8 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة النظام</h1>
        <p className="mt-2 text-muted-foreground">نظرة عامة على أداء المنصة والإحصائيات الرئيسية</p>
      </div>

      <Card className="bg-card border border-border shadow-xs rounded-xl overflow-hidden p-0">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-border/60">
          {statItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-4 flex flex-col items-center justify-center text-center gap-1.5 min-h-[96px]"
              >
                <span className="text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1.5 text-center">
                  <Icon className={`size-4 shrink-0 ${item.iconColorClass}`} />
                  <span>{item.title}</span>
                </span>
                <span
                  className={`text-2xl font-extrabold tracking-tight text-center ${item.colorClass}`}
                >
                  {item.value}
                </span>
                <p className="text-[11px] text-muted-foreground text-center line-clamp-1">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Financial info summary card */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-center">أداء المبيعات والعمولات</CardTitle>
          <CardDescription className="text-center">
            الملخص المالي للمبيعات المكتملة وعمولات المنصة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 py-2">
            <span className="text-sm text-muted-foreground">
              إجمالي قيمة مبيعات الخدمات المكتملة
            </span>
            <span className="text-lg font-bold">{formatPrice(stats?.totalRevenue ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-border/50 py-2">
            <span className="text-sm text-muted-foreground">نسبة عمولة المنصة الحالية</span>
            <span className="text-lg font-bold">
              {((stats?.commissionRate ?? 0.1) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-bold text-foreground">صافي عمولات المنصة المستحقة</span>
            <span className="text-xl font-extrabold text-primary">
              {formatPrice(stats?.totalCommission ?? 0)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Panel */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Link
          to="/admin/users"
          className="flex flex-col items-center justify-center text-center p-5 bg-card hover:bg-primary/5 border border-border rounded-xl shadow-xs transition-all group"
        >
          <div className="rounded-lg bg-primary/10 text-primary p-2 mb-3 group-hover:bg-primary group-hover:text-white transition-all">
            <Users className="size-5" />
          </div>
          <span className="font-bold text-base text-center">إدارة المستخدمين</span>
          <span className="text-xs text-muted-foreground mt-1 text-center">
            عرض وتعديل المستخدمين وتغيير أدوارهم وتنشيط الحسابات
          </span>
        </Link>

        <Link
          to="/admin/services"
          className="flex flex-col items-center justify-center text-center p-5 bg-card hover:bg-primary/5 border border-border rounded-xl shadow-xs transition-all group"
        >
          <div className="rounded-lg bg-primary/10 text-primary p-2 mb-3 group-hover:bg-primary group-hover:text-white transition-all">
            <Briefcase className="size-5" />
          </div>
          <span className="font-bold text-base text-center">إدارة الخدمات</span>
          <span className="text-xs text-muted-foreground mt-1 text-center">
            مراجعة الخدمات وتنشيطها أو تعطيلها في المنصة
          </span>
        </Link>

        <Link
          to="/admin/orders"
          className="flex flex-col items-center justify-center text-center p-5 bg-card hover:bg-primary/5 border border-border rounded-xl shadow-xs transition-all group"
        >
          <div className="rounded-lg bg-primary/10 text-primary p-2 mb-3 group-hover:bg-primary group-hover:text-white transition-all">
            <ClipboardList className="size-5" />
          </div>
          <span className="font-bold text-base text-center">إدارة الطلبات</span>
          <span className="text-xs text-muted-foreground mt-1 text-center">
            مراقبة طلبات الخدمات وتفاصيل العمولات المالية
          </span>
        </Link>

        <Link
          to="/admin/finance"
          className="flex flex-col items-center justify-center text-center p-5 bg-card hover:bg-primary/5 border border-border rounded-xl shadow-xs transition-all group"
        >
          <div className="rounded-lg bg-primary/10 text-primary p-2 mb-3 group-hover:bg-primary group-hover:text-white transition-all">
            <Wallet className="size-5" />
          </div>
          <span className="font-bold text-base text-center">التقارير والعمولات</span>
          <span className="text-xs text-muted-foreground mt-1 text-center">
            متابعة إيرادات المنصة والتعديل على نسبة العمولات
          </span>
        </Link>
      </div>
    </div>
  );
}
