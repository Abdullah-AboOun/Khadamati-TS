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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { ROLE_LABELS, USER_ROLES } from "../../../shared/constants"

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersComponent,
})

function AdminUsersComponent() {
  const { data, isLoading, refetch } = trpc.admin.listUsers.useQuery({
    page: 1,
    limit: 50,
  })

  // mutations
  const toggleUserActiveMutation = trpc.admin.toggleUserActive.useMutation()

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserActiveMutation.mutateAsync({
        userId: parseInt(userId),
        isActive: !currentStatus,
      })
      toast.success(
        !currentStatus ? "تم تفعيل حساب المستخدم" : "تم تعطيل حساب المستخدم"
      )
      refetch()
    } catch (err) {
      const error = err as Error
      toast.error(error.message || "حدث خطأ في تحديث حالة المستخدم")
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await toggleUserActiveMutation.mutateAsync({
        userId: parseInt(userId),
        role: newRole as Parameters<
          typeof toggleUserActiveMutation.mutateAsync
        >[0]["role"],
      })
      toast.success("تم تغيير دور المستخدم بنجاح")
      refetch()
    } catch (err) {
      const error = err as Error
      toast.error(error.message || "حدث خطأ في تغيير دور المستخدم")
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
        <h1 className="text-3xl font-bold tracking-tight">إدارة المستخدمين</h1>
        <p className="mt-2 text-muted-foreground">
          عرض وتعديل بيانات مستخدمي المنصة وتغيير أدوارهم وتنشيط حساباتهم
        </p>
      </div>

      <Card className="border border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم</TableHead>
                  <TableHead className="text-right">
                    البريد الإلكتروني
                  </TableHead>
                  <TableHead className="text-right">المدينة</TableHead>
                  <TableHead className="text-right">الدور</TableHead>
                  <TableHead className="text-right">تاريخ التسجيل</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-left">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users.map((usr) => (
                  <TableRow key={usr.id}>
                    <TableCell className="font-bold">{usr.name}</TableCell>
                    <TableCell>{usr.email}</TableCell>
                    <TableCell>{usr.city || "-"}</TableCell>
                    <TableCell>
                      <Select
                        value={usr.role}
                        onValueChange={(val) => handleRoleChange(usr.id, val)}
                      >
                        <SelectTrigger className="flex h-8 w-[130px] justify-between text-right">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {USER_ROLES.map((role) => (
                            <SelectItem
                              key={role}
                              value={role}
                              className="flex justify-end text-right"
                            >
                              {ROLE_LABELS[role]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(usr.createdAt).toLocaleDateString("ar")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={usr.isActive ? "default" : "destructive"}>
                        {usr.isActive ? "نشط" : "معطل"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <Button
                        size="sm"
                        variant={usr.isActive ? "destructive" : "default"}
                        className="h-8 font-semibold"
                        onClick={() => handleToggleActive(usr.id, usr.isActive)}
                      >
                        {usr.isActive ? "تعطيل الحساب" : "تفعيل"}
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
