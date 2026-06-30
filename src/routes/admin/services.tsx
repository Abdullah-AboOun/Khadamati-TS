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
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { PRICING_LABELS } from "../../../shared/constants"

export const Route = createFileRoute("/admin/services")({
  component: AdminServicesComponent,
})

function AdminServicesComponent() {
  const { data, isLoading, refetch } = trpc.admin.listServices.useQuery({
    page: 1,
    limit: 50,
  })

  const toggleActiveMutation = trpc.admin.toggleServiceActive.useMutation()

  const handleToggleActive = async (
    serviceId: number,
    currentStatus: boolean
  ) => {
    try {
      await toggleActiveMutation.mutateAsync({
        id: serviceId,
        isActive: !currentStatus,
      })
      toast.success(
        !currentStatus
          ? "تم تنشيط الخدمة في المنصة"
          : "تم إلغاء تنشيط الخدمة في المنصة"
      )
      refetch()
    } catch (err) {
      const error = err as Error
      toast.error(error.message || "حدث خطأ في تحديث حالة الخدمة")
    }
  }

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
          إدارة الخدمات المعروضة
        </h1>
        <p className="mt-2 text-muted-foreground">
          عرض وتعديل تنشيط كافة الخدمات المعروضة من قبل مزودي الخدمات
        </p>
      </div>

      <Card className="border border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">عنوان الخدمة</TableHead>
                  <TableHead className="text-right">مزود الخدمة</TableHead>
                  <TableHead className="text-right">التصنيف</TableHead>
                  <TableHead className="text-right">المدينة</TableHead>
                  <TableHead className="text-right">طريقة التسعير</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">تاريخ الإضافة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.services.map((svc) => (
                  <TableRow key={svc.id}>
                    <TableCell className="font-bold">{svc.title}</TableCell>
                    <TableCell>{svc.providerName}</TableCell>
                    <TableCell>{svc.categoryName}</TableCell>
                    <TableCell>{svc.city || "-"}</TableCell>
                    <TableCell>
                      {PRICING_LABELS[svc.pricingType as "fixed" | "quote"]}
                    </TableCell>
                    <TableCell>
                      {svc.price ? `${svc.price} ₪` : "طلب تسعير"}
                    </TableCell>
                    <TableCell>
                      {new Date(svc.createdAt).toLocaleDateString("ar")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={svc.isActive ? "default" : "secondary"}>
                        {svc.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <Button
                        size="sm"
                        variant={svc.isActive ? "destructive" : "default"}
                        className="h-8 font-semibold"
                        onClick={() => handleToggleActive(svc.id, svc.isActive)}
                      >
                        {svc.isActive ? "إلغاء التنشيط" : "تنشيط الخدمة"}
                      </Button>
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
