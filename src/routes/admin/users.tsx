import { createFileRoute } from "@tanstack/react-router";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ROLE_LABELS, USER_ROLES, CITIES } from "../../../shared/constants";
import { useState } from "react";
import { Plus, Trash2, Edit2, Search } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersComponent,
});

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "client" | "provider" | "admin";
  phone: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
}

function AdminUsersComponent() {
  const { data, isLoading, refetch } = trpc.admin.listUsers.useQuery({
    page: 1,
    limit: 100,
  });

  // Mutations
  const toggleUserActiveMutation = trpc.admin.toggleUserActive.useMutation();
  const createUserMutation = trpc.admin.createUser.useMutation();
  const updateUserMutation = trpc.admin.updateUser.useMutation();
  const deleteUserMutation = trpc.admin.deleteUser.useMutation();

  // Filter states
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "provider" | "admin">("client");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("client");
    setPhone("");
    setCity("");
    setIsActive(true);
    setDialogOpen(true);
  };

  const handleOpenEdit = (usr: UserItem) => {
    setEditingUserId(usr.id);
    setName(usr.name);
    setEmail(usr.email);
    setPassword("");
    setRole(usr.role);
    setPhone(usr.phone || "");
    setCity(usr.city || "");
    setIsActive(usr.isActive);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!name || !email || (!editingUserId && !password)) {
      toast.error("الرجاء إدخال الحقول الإلزامية");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingUserId) {
        await updateUserMutation.mutateAsync({
          id: editingUserId,
          name,
          email,
          role,
          phone: phone || undefined,
          city: city || undefined,
          isActive,
        });
        toast.success("تم تحديث المستخدم بنجاح");
      } else {
        await createUserMutation.mutateAsync({
          name,
          email,
          password,
          role,
          phone: phone || undefined,
          city: city || undefined,
        });
        toast.success("تم إضافة المستخدم بنجاح");
      }
      setDialogOpen(false);
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء حفظ بيانات المستخدم");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "هل أنت متأكد من رغبتك في حذف هذا المستخدم نهائياً؟ سيتم حذف جميع أعماله والطلبات المرتبطة به!",
      )
    )
      return;
    try {
      await deleteUserMutation.mutateAsync({ id });
      toast.success("تم حذف حساب المستخدم بنجاح");
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء حذف حساب المستخدم");
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserActiveMutation.mutateAsync({
        userId,
        isActive: !currentStatus,
      });
      toast.success(!currentStatus ? "تم تنشيط حساب المستخدم" : "تم تعطيل حساب المستخدم");
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ في تحديث حالة المستخدم");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-4 p-6" dir="rtl">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const allUsers = (data?.users as unknown as UserItem[]) || [];
  const totalCount = allUsers.length;
  const clientsCount = allUsers.filter((u) => u.role === "client").length;
  const providersCount = allUsers.filter((u) => u.role === "provider").length;
  const adminsCount = allUsers.filter((u) => u.role === "admin").length;
  const activeCount = allUsers.filter((u) => u.isActive).length;
  const bannedCount = totalCount - activeCount;

  const filteredUsers = allUsers.filter((usr) => {
    const matchSearch =
      usr.name.toLowerCase().includes(search.toLowerCase()) ||
      usr.email.toLowerCase().includes(search.toLowerCase());

    const matchRole = roleFilter === "all" || usr.role === roleFilter;

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && usr.isActive) ||
      (statusFilter === "inactive" && !usr.isActive);

    return matchSearch && matchRole && matchStatus;
  });

  return (
    <div className="container mx-auto space-y-6 px-4 py-8 sm:px-6 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة المستخدمين</h1>
          <p className="mt-2 text-muted-foreground">
            تصفح، عدل، أضف، أو احذف مستخدمي المنصة وإداري النظام
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="font-semibold cursor-pointer">
          <Plus className="ml-1 size-4" />
          إضافة مستخدم جديد
        </Button>
      </div>

      {/* Stats block */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        <Card className="bg-card border border-border shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">المجموع</span>
            <span className="text-2xl font-black mt-2">{totalCount}</span>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">العملاء</span>
            <span className="text-2xl font-black mt-2 text-blue-600">{clientsCount}</span>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">المزودون</span>
            <span className="text-2xl font-black mt-2 text-indigo-600">{providersCount}</span>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">المدراء</span>
            <span className="text-2xl font-black mt-2 text-primary">{adminsCount}</span>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">النشطون</span>
            <span className="text-2xl font-black mt-2 text-emerald-600">{activeCount}</span>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-xs">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-muted-foreground">المعطلون</span>
            <span className="text-2xl font-black mt-2 text-red-600">{bannedCount}</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row gap-4 bg-muted/40 p-4 rounded-xl border border-border">
        <div className="relative flex-grow">
          <Input
            placeholder="ابحث بالاسم أو البريد الإلكتروني..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 text-right bg-background"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[180px] text-right bg-background">
            <SelectValue placeholder="جميع الأدوار" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأدوار</SelectItem>
            {USER_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[160px] text-right bg-background">
            <SelectValue placeholder="جميع الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
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
                  <TableHead className="text-center">الاسم</TableHead>
                  <TableHead className="text-center">البريد الإلكتروني</TableHead>
                  <TableHead className="text-center">الهاتف</TableHead>
                  <TableHead className="text-center">المدينة</TableHead>
                  <TableHead className="text-center">الدور</TableHead>
                  <TableHead className="text-center">تاريخ التسجيل</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((usr) => (
                  <TableRow key={usr.id} className={!usr.isActive ? "opacity-75 bg-muted/10" : ""}>
                    <TableCell className="text-center font-bold">{usr.name}</TableCell>
                    <TableCell className="text-center">{usr.email}</TableCell>
                    <TableCell className="text-center">{usr.phone || "-"}</TableCell>
                    <TableCell className="text-center">{usr.city || "-"}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          usr.role === "admin"
                            ? "destructive"
                            : usr.role === "provider"
                              ? "default"
                              : "outline"
                        }
                      >
                        {ROLE_LABELS[usr.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(usr.createdAt).toLocaleDateString("ar")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={usr.isActive ? "default" : "destructive"}>
                        {usr.isActive ? "نشط" : "معطل"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 font-semibold cursor-pointer"
                          onClick={() => handleOpenEdit(usr)}
                        >
                          <Edit2 className="size-3.5 ml-1" />
                          تعديل
                        </Button>
                        <Button
                          size="sm"
                          variant={usr.isActive ? "destructive" : "default"}
                          className="h-8 font-semibold cursor-pointer"
                          onClick={() => handleToggleActive(usr.id, usr.isActive)}
                        >
                          {usr.isActive ? "تعطيل" : "تنشيط"}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                          onClick={() => handleDelete(usr.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد حسابات مطابقة لخيارات البحث.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE / EDIT USER MODAL */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="text-right max-w-md" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>{editingUserId ? "تعديل حساب المستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
            <DialogDescription>
              املأ الحقول أدناه لتهيئة حساب المستخدم وصلاحياته بالنظام
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-3">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الاسم الكامل *</label>
              <Input
                placeholder="مثال: أحمد مصطفى"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-right"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">البريد الإلكتروني *</label>
              <Input
                type="email"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-right"
              />
            </div>

            {/* Password (Required for create only) */}
            {!editingUserId && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">كلمة المرور *</label>
                <Input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!editingUserId}
                  className="text-right"
                />
              </div>
            )}

            {/* Role & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الدور *</label>
                <Select
                  value={role}
                  onValueChange={(val) => setRole(val as "client" | "provider" | "admin")}
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">الحالة *</label>
                <Select
                  value={isActive ? "active" : "inactive"}
                  onValueChange={(val) => setIsActive(val === "active")}
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">معطل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Phone & City */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الهاتف</label>
                <Input
                  placeholder="+970599000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-right"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">المدينة</label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="w-full text-right">
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full font-bold cursor-pointer mt-2"
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ بيانات الحساب"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
