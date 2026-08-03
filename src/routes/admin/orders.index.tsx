import { createFileRoute, Link } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { formatPrice, STATUS_LABELS } from "../../../shared/constants";
import { Search, ClipboardList, Wallet, Landmark, Eye, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin/orders/")({
  component: AdminOrdersComponent,
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

interface OrderItem {
  id: number;
  amount: number | null;
  status: "pending" | "quoted" | "accepted" | "in_progress" | "completed" | "cancelled";
  details: string | null;
  createdAt: string;
  serviceTitle: string;
  clientName: string;
}

function AdminOrdersComponent() {
  const { data, isLoading } = trpc.admin.listOrders.useQuery({
    page: 1,
    limit: 100,
  });
  const { data: stats } = trpc.admin.stats.useQuery();

  // Filter states
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const ordersList = useMemo(() => (data?.orders as unknown as OrderItem[]) || [], [data?.orders]);
  const commissionRate = stats?.commissionRate ?? 0.15;

  // Calculations memoized
  const { totalOrdersCount, totalRevenueVal, totalCommissionsVal, pendingOrdersCount } =
    useMemo(() => {
      const totalOrdersCount = ordersList.length;
      let totalRevenueVal = 0;
      let pendingOrdersCount = 0;

      for (let i = 0; i < ordersList.length; i++) {
        const o = ordersList[i];
        if (o.status === "completed") {
          totalRevenueVal += o.amount ?? 0;
        }
        if (!["completed", "cancelled"].includes(o.status)) {
          pendingOrdersCount++;
        }
      }

      return {
        totalOrdersCount,
        totalRevenueVal,
        totalCommissionsVal: totalRevenueVal * commissionRate,
        pendingOrdersCount,
      };
    }, [ordersList, commissionRate]);

  // Filtering memoized
  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase();
    return ordersList.filter((ord) => {
      const matchSearch =
        !q ||
        ord.serviceTitle.toLowerCase().includes(q) ||
        ord.clientName.toLowerCase().includes(q) ||
        ord.id.toString().includes(q);

      const matchStatus = statusFilter === "all" || ord.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [ordersList, search, statusFilter]);

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-4 p-6" dir="rtl">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8 sm:px-6 text-right" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">إدارة طلبات المنصة</h1>
        <p className="mt-2 text-muted-foreground">
          تصفح ومراقبة كافة المعاملات المالية وحالات الطلبات بين العملاء ومزودي الخدمات
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="bg-card border border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-muted-foreground block">
                إجمالي الطلبات
              </span>
              <span className="text-2xl font-extrabold text-foreground mt-1 block">
                {totalOrdersCount}
              </span>
            </div>
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ClipboardList className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-muted-foreground block">مبيعات مكتملة</span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {formatPrice(totalRevenueVal)}
              </span>
            </div>
            <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Wallet className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-muted-foreground block">عمولات المنصة</span>
              <span className="text-2xl font-extrabold text-primary mt-1 block">
                {formatPrice(totalCommissionsVal)}
              </span>
            </div>
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Landmark className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-muted-foreground block">طلبات نشطة</span>
              <span className="text-2xl font-extrabold text-primary mt-1 block">
                {pendingOrdersCount}
              </span>
            </div>
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ArrowUpRight className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-muted/40 p-4 rounded-xl border border-border">
        <div className="relative flex-grow">
          <Input
            placeholder="ابحث برقم الطلب، اسم الخدمة، أو اسم العميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 text-right bg-background"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px] text-right bg-background">
            <SelectValue placeholder="جميع الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            {Object.keys(STATUS_LABELS).map((statusKey) => (
              <SelectItem key={statusKey} value={statusKey}>
                {STATUS_LABELS[statusKey as "pending"]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border border-border shadow-sm bg-card">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">رقم الطلب</TableHead>
                  <TableHead className="text-center">اسم الخدمة</TableHead>
                  <TableHead className="text-center">العميل</TableHead>
                  <TableHead className="text-center">تاريخ الطلب</TableHead>
                  <TableHead className="text-center">السعر</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((ord) => (
                  <TableRow
                    key={ord.id}
                    className={ord.status === "cancelled" ? "opacity-75 bg-muted/10" : ""}
                  >
                    <TableCell className="text-center font-mono">#{ord.id}</TableCell>
                    <TableCell className="text-center font-bold">{ord.serviceTitle}</TableCell>
                    <TableCell className="text-center">{ord.clientName}</TableCell>
                    <TableCell className="text-center">
                      {new Date(ord.createdAt).toLocaleDateString("ar")}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {ord.amount ? formatPrice(ord.amount) : "قيد التسعير"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${STATUS_COLOR_CLASSES[ord.status]}`} variant="outline">
                        {STATUS_LABELS[ord.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="h-8 font-semibold cursor-pointer"
                        >
                          <Link to="/admin/orders/$id" params={{ id: ord.id.toString() }}>
                            <Eye className="ml-1 size-3.5" />
                            عرض التفاصيل
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد طلبات مطابقة للبحث.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
