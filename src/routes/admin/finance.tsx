import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings, BarChart3, Users, Landmark, TrendingUp, PieChart as PieChartIcon, Activity } from "lucide-react";
import { formatPrice, STATUS_LABELS } from "../../../shared/constants";
import { MonthPicker } from "@/components/ui/month-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

export const Route = createFileRoute("/admin/finance")({
  component: AdminFinanceComponent,
});

function AdminFinanceComponent() {
  // Lifetime stats for general context
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = trpc.admin.stats.useQuery();

  // Month Picker State
  const [selectedMonthStr, setSelectedMonthStr] = useState(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    return `${yyyy}-${mm}`;
  });

  const [yearStr, monthStr] = selectedMonthStr.split("-");
  const year = parseInt(yearStr) || new Date().getFullYear();
  const month = parseInt(monthStr) || new Date().getMonth() + 1;

  // tRPC monthly queries
  const { data: report, isLoading: reportLoading } = trpc.admin.financialReport.useQuery({
    year,
    month,
  });

  const { data: topProviders, isLoading: topProvidersLoading } = trpc.admin.topProviders.useQuery({
    year,
    month,
  });

  // tRPC charts query
  const { data: charts, isLoading: chartsLoading } = trpc.admin.financialCharts.useQuery();

  const [monthPeriod, setMonthPeriod] = useState<6 | 12>(6);

  const [commissionInput, setCommissionInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (stats) {
      setCommissionInput((stats.commissionRate * 100).toString());
    }
  }, [stats]);

  // mutations
  const updateCommissionMutation = trpc.admin.updateCommissionRate.useMutation();

  const handleUpdateCommission = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const ratePercentage = parseFloat(commissionInput);
    if (isNaN(ratePercentage) || ratePercentage < 0 || ratePercentage > 100) {
      toast.error("الرجاء إدخال نسبة صحيحة بين 0% و 100%");
      return;
    }

    setIsUpdating(true);
    try {
      await updateCommissionMutation.mutateAsync({
        commissionRate: ratePercentage / 100,
      });
      toast.success("تم تحديث نسبة عمولة النظام بنجاح!");
      refetchStats();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء تحديث نسبة العمولة");
    } finally {
      setIsUpdating(false);
    }
  };

  if (statsLoading || reportLoading || topProvidersLoading || chartsLoading) {
    return (
      <div className="container mx-auto space-y-4 p-6" dir="rtl">
        <Skeleton className="h-10 w-1/4" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const commissionRate = stats?.commissionRate ?? 0.1;

  // Monthly stats calculations
  const monthlyCompletedCount = report?.length ?? 0;
  const monthlyRevenue = report?.reduce((sum, ord) => sum + (ord.amount ?? 0), 0) ?? 0;
  const monthlyAdminCut = monthlyRevenue * commissionRate;
  const monthlyProviderNet = monthlyRevenue - monthlyAdminCut;

  const STATUS_COLORS: Record<string, string> = {
    completed: "#10b981", // Emerald 500
    cancelled: "#f43f5e", // Rose 500
    in_progress: "#3b82f6", // Blue 500
    accepted: "#60a5fa", // Blue 400
    quoted: "#eab308", // Yellow 500
    pending: "#f97316", // Orange 500
  };

  const barChartConfig = {
    revenue: {
      label: "إجمالي المبيعات",
      color: "var(--color-chart-1)",
    },
    adminCut: {
      label: "عمولة المنصة",
      color: "var(--color-chart-2)",
    },
    providerNet: {
      label: "صافي أرباح المزودين",
      color: "var(--color-chart-3)",
    },
  };

  const lineChartConfig = {
    revenue: {
      label: "الإيرادات",
      color: "var(--color-chart-1)",
    },
    adminCut: {
      label: "العمولة",
      color: "var(--color-chart-2)",
    },
  };

  const topServicesConfig = {
    revenue: {
      label: "الإيرادات",
      color: "var(--color-chart-1)",
    },
  };

  // Filter monthlyTrends data for BarChart based on monthly period state
  const monthlyTrendsData = charts?.monthlyTrends.slice(-monthPeriod) ?? [];

  // Order statuses breakdown data
  const statusData = Object.entries(charts?.orderStatuses ?? {})
    .map(([key, val]) => ({
      name: STATUS_LABELS[key as keyof typeof STATUS_LABELS] || key,
      value: val,
      fill: STATUS_COLORS[key] || "var(--muted-foreground)",
    }))
    .filter((d) => d.value > 0);

  // Commission split doughnut data
  const totalRevenueAllTime = charts?.monthlyTrends.reduce((sum, m) => sum + m.revenue, 0) ?? 0;
  const totalCommissionAllTime = charts?.monthlyTrends.reduce((sum, m) => sum + m.adminCut, 0) ?? 0;
  const totalProviderNetAllTime = charts?.monthlyTrends.reduce((sum, m) => sum + m.providerNet, 0) ?? 0;

  const commissionSplitData = [
    { name: "عمولة المنصة", value: totalCommissionAllTime, fill: "#eab308" },
    { name: "صافي المزودين", value: totalProviderNetAllTime, fill: "#3b82f6" },
  ].filter((d) => d.value > 0);

  return (
    <div className="container mx-auto space-y-6 px-4 py-8 sm:px-6 text-right" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">التقارير والإعدادات المالية</h1>
        <p className="mt-2 text-muted-foreground">
          راجع إجمالي الإيرادات وعمولات المنصة وقم بضبط نسبة الاقتطاع من المبيعات
        </p>
      </div>

      <Tabs defaultValue="reports" className="w-full space-y-6">
        <TabsList className="grid grid-cols-2 max-w-[400px] border border-border/40 p-1">
          <TabsTrigger value="reports" className="font-semibold cursor-pointer">
            التقارير والإعدادات
          </TabsTrigger>
          <TabsTrigger value="charts" className="font-semibold cursor-pointer">
            الرسوم البيانية
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Reports & Settings */}
        <TabsContent value="reports" className="space-y-6 outline-hidden">
          {/* Month Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border border-border">
            <div className="space-y-1">
              <h2 className="text-lg font-bold">فلترة التقارير المالية</h2>
              <p className="text-xs text-muted-foreground">اختر الشهر لعرض الإحصائيات وجدول المتصدرين</p>
            </div>
            <MonthPicker value={selectedMonthStr} onChange={setSelectedMonthStr} />
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Statistics and Ledger */}
            <div className="space-y-6 md:col-span-2">
              {/* Filtered Monthly Stats Cards */}
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                <Card className="border border-border shadow-xs">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">
                      مبيعات الشهر
                    </span>
                    <span className="text-lg sm:text-xl font-extrabold text-foreground block">
                      {formatPrice(monthlyRevenue)}
                    </span>
                  </CardContent>
                </Card>

                <Card className="border border-border shadow-xs">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">
                      عمولة المنصة
                    </span>
                    <span className="text-lg sm:text-xl font-extrabold text-primary block">
                      {formatPrice(monthlyAdminCut)}
                    </span>
                  </CardContent>
                </Card>

                <Card className="border border-border shadow-xs">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">
                      صافي المزودين
                    </span>
                    <span className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 block">
                      {formatPrice(monthlyProviderNet)}
                    </span>
                  </CardContent>
                </Card>

                <Card className="border border-border shadow-xs">
                  <CardContent className="p-4 space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground block">
                      الطلبات المكتملة
                    </span>
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
                  <CardDescription>
                    أفضل 10 مزودين من حيث المبيعات والطلبات المكتملة في هذا الشهر
                  </CardDescription>
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
                            <TableHead className="text-right">
                              عمولة المنصة ({(commissionRate * 100).toFixed(0)}%)
                            </TableHead>
                            <TableHead className="text-right">صافي أرباح المزود</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {topProviders.map((prov) => (
                            <TableRow key={prov.providerId}>
                              <TableCell className="font-bold">{prov.providerName}</TableCell>
                              <TableCell>{prov.orderCount} طلبات</TableCell>
                              <TableCell className="font-semibold">
                                {formatPrice(prov.grossRevenue)}
                              </TableCell>
                              <TableCell className="text-primary">
                                {formatPrice(prov.adminCut)}
                              </TableCell>
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
                  <CardDescription>
                    قائمة بالمعاملات المكتملة المسجلة خلال هذا الشهر وحصة المنصة منها
                  </CardDescription>
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
                              <TableCell>
                                {new Date(ord.createdAt).toLocaleDateString("ar-EG")}
                              </TableCell>
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
                    <Button
                      type="submit"
                      className="w-full font-semibold cursor-pointer"
                      disabled={isUpdating}
                    >
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
                    <span className="font-bold text-primary">
                      {formatPrice(stats?.totalCommission ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-sm text-muted-foreground">إجمالي المستخدمين:</span>
                    <span className="font-bold">{stats?.totalUsers ?? 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Visual Charts */}
        <TabsContent value="charts" className="space-y-6 outline-hidden">
          {/* Quick Insights Cards */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <Card className="border border-border bg-card shadow-xs">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground block">
                  إجمالي المبيعات (12 شهر)
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-foreground block">
                  {formatPrice(totalRevenueAllTime)}
                </span>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-xs">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground block">
                  عمولة النظام التراكمية
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-primary block">
                  {formatPrice(totalCommissionAllTime)}
                </span>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-xs">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground block">
                  صافي أرباح المزودين
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 block">
                  {formatPrice(totalProviderNetAllTime)}
                </span>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-xs">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground block">
                  أفضل شهر إيراداً
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-foreground block truncate">
                  {(() => {
                    const best = charts?.monthlyTrends.reduce(
                      (max, m) => (m.revenue > max.revenue ? m : max),
                      { label: "—", revenue: 0 },
                    );
                    return best?.label !== "—" ? `${best?.label}` : "—";
                  })()}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* Chart 1: Bar Chart Monthly Revenue */}
          <Card className="border border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-5 text-muted-foreground" />
                  الإيرادات والعمولات الشهرية
                </CardTitle>
                <CardDescription>مقارنة بين إجمالي الإيرادات، عمولات المنصة، وأرباح المزودين</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 bg-muted p-1 rounded-md">
                <Button
                  variant={monthPeriod === 6 ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setMonthPeriod(6)}
                  className="h-7 px-3 text-xs font-bold cursor-pointer"
                >
                  6 أشهر
                </Button>
                <Button
                  variant={monthPeriod === 12 ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setMonthPeriod(12)}
                  className="h-7 px-3 text-xs font-bold cursor-pointer"
                >
                  12 شهراً
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
              <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrendsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(v) => `${v} ₪`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="revenue"
                      fill="var(--color-revenue)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="adminCut"
                      fill="var(--color-adminCut)"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="providerNet"
                      fill="var(--color-providerNet)"
                      radius={[4, 4, 0, 0]}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Line Chart Growth */}
          <Card className="border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5 text-muted-foreground" />
                منحنى نمو الإيرادات
              </CardTitle>
              <CardDescription>متابعة النمو التراكمي والتغيير في الإيرادات والعمولات شهراً بعد شهر</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts?.monthlyTrends ?? []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(v) => `${v} ₪`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--color-revenue)"
                      strokeWidth={2}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="adminCut"
                      stroke="var(--color-adminCut)"
                      strokeWidth={2}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Row of side-by-side charts */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Chart 3: Order status distribution Pie Chart */}
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="size-5 text-muted-foreground" />
                  توزيع الطلبات حسب الحالة
                </CardTitle>
                <CardDescription>النسبة المئوية لحالات الطلبات في المنصة</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[320px]">
                {statusData.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-12">لا توجد طلبات لعرضها</div>
                ) : (
                  <div className="w-full flex justify-center">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} طلب`, "العدد"]} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart 4: Top services horizontal bar chart */}
            <Card className="border border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-5 text-muted-foreground" />
                  أفضل 6 خدمات إيراداً
                </CardTitle>
                <CardDescription>الخدمات الأكثر تحقيقاً للمبيعات بالمنصة</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[320px]">
                {charts?.topServices.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-12">لا توجد خدمات مكتملة المبيعات</div>
                ) : (
                  <ChartContainer config={topServicesConfig} className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={charts?.topServices ?? []}
                        layout="vertical"
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis
                          type="number"
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v} ₪`}
                        />
                        <YAxis
                          dataKey="title"
                          type="category"
                          tickLine={false}
                          axisLine={false}
                          width={120}
                          fontSize={11}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="revenue"
                          fill="var(--color-revenue)"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chart 5: Commission Split Doughnut */}
          <Card className="border border-border shadow-sm max-w-xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle>توزيع الإيرادات الكلية</CardTitle>
              <CardDescription>النسبة المئوية لحصة عمولة النظام مقابل أرباح مقدمي الخدمات الكلية</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
              {commissionSplitData.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-12">لا توجد إيرادات مسجلة بالمنصة</div>
              ) : (
                <div className="w-full flex justify-center">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={commissionSplitData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {commissionSplitData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${formatPrice(value as number)}`, "المجموع"]} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
