import { createFileRoute } from "@tanstack/react-router"
import { trpc } from "@/lib/trpc"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatPrice, STATUS_LABELS } from "../../../shared/constants"

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersComponent,
})

const STATUS_COLOR_CLASSES: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200",
  quoted:
    "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200",
  accepted:
    "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 border-green-200",
  in_progress:
    "bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200",
  cancelled:
    "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border-red-200",
}

function AdminOrdersComponent() {
  const { data, isLoading } = trpc.admin.listOrders.useQuery({
    page: 1,
    limit: 50,
  })

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-4 p-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          إدارة طلبات المنصة
        </h1>
        <p className="mt-2 text-muted-foreground">
          تصفح ومراقبة كافة المعاملات المالية وحالات الطلبات بين العملاء ومزودي
          الخدمات
        </p>
      </div>

      <Card className="border border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم الطلب</TableHead>
                  <TableHead className="text-right">اسم الخدمة</TableHead>
                  <TableHead className="text-right">العميل</TableHead>
                  <TableHead className="text-right">تاريخ الطلب</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-left">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.orders.map((ord) => (
                  <TableRow key={ord.id}>
                    <TableCell className="font-mono">#{ord.id}</TableCell>
                    <TableCell className="font-bold">
                      {ord.serviceTitle}
                    </TableCell>
                    <TableCell>{ord.clientName}</TableCell>
                    <TableCell>
                      {new Date(ord.createdAt).toLocaleDateString("ar")}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {ord.amount ? formatPrice(ord.amount) : "قيد التسعير"}
                    </TableCell>
                    <TableCell className="text-left">
                      <Badge
                        className={`${STATUS_COLOR_CLASSES[ord.status]}`}
                        variant="outline"
                      >
                        {STATUS_LABELS[ord.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
