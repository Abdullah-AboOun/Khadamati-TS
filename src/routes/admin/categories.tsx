import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit2 } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesComponent,
});

function AdminCategoriesComponent() {
  const { data: categories, isLoading, refetch } = trpc.categories.list.useQuery();

  // Form states
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // mutations
  const createCategoryMutation = trpc.categories.create.useMutation();
  const updateCategoryMutation = trpc.categories.update.useMutation();
  const deleteCategoryMutation = trpc.categories.delete.useMutation();

  const handleOpenCreate = () => {
    setEditingCategoryId(null);
    setName("");
    setSlug("");
    setIcon("Zap");
    setDialogOpen(true);
  };

  interface CategoryItem {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
  }

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingCategoryId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setIcon(cat.icon || "Zap");
    setDialogOpen(true);
  };

  const handleSave = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      toast.error("الرجاء تعبئة حقول الاسم والمعرّف");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategoryId) {
        await updateCategoryMutation.mutateAsync({
          id: editingCategoryId,
          name,
          slug,
          icon,
        });
        toast.success("تم تحديث التصنيف بنجاح");
      } else {
        await createCategoryMutation.mutateAsync({
          name,
          slug,
          icon,
        });
        toast.success("تم إضافة التصنيف الجديد بنجاح");
      }
      setDialogOpen(false);
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ في حفظ التصنيف");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا التصنيف؟ قد يؤثر ذلك على الخدمات التابعة له."))
      return;
    try {
      await deleteCategoryMutation.mutateAsync({ id });
      toast.success("تم حذف التصنيف بنجاح");
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء حذف التصنيف");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-4 p-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8 sm:px-6 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة التصنيفات</h1>
          <p className="mt-2 text-muted-foreground">
            أضف تصنيفات جديدة للمنصة أو عدل التصنيفات الحالية والرموز الخاصة بها
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="font-semibold cursor-pointer">
          <Plus className="ml-1 size-4" />
          إضافة تصنيف جديد
        </Button>
      </div>

      <Card className="border border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">رقم التصنيف</TableHead>
                  <TableHead className="text-center">الاسم</TableHead>
                  <TableHead className="text-center">المعرف الرابط (Slug)</TableHead>
                  <TableHead className="text-center">الرمز الإيقوني (Icon)</TableHead>
                  <TableHead className="text-center">تاريخ الإضافة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="text-center font-mono">#{cat.id}</TableCell>
                    <TableCell className="text-center font-bold">{cat.name}</TableCell>
                    <TableCell className="text-center">{cat.slug}</TableCell>
                    <TableCell className="text-center">{cat.icon || "Zap"}</TableCell>
                    <TableCell className="text-center">
                      {new Date(cat.createdAt).toLocaleDateString("ar")}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 font-semibold cursor-pointer"
                          onClick={() => handleOpenEdit(cat)}
                        >
                          <Edit2 className="ml-1 size-3.5" />
                          تعديل
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                          onClick={() => handleDelete(cat.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>
              {editingCategoryId ? "تعديل بيانات التصنيف" : "إضافة تصنيف جديد"}
            </DialogTitle>
            <DialogDescription>املأ الحقول لتحديث بيانات تصنيفات الخدمات بالمنصة.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">اسم التصنيف (بالعربية)</label>
              <Input
                type="text"
                placeholder="مثال: سباكة"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">المعرّف الرابط (Slug - بالإنجليزية)</label>
              <Input
                type="text"
                placeholder="example: plumbing"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="text-right font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">رمز الأيقونة (من Lucide)</label>
              <Input
                type="text"
                placeholder="Zap, Hammer, Snowflake, Code, etc."
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="text-right font-mono"
              />
            </div>

            <Button type="submit" className="mt-4 w-full font-bold" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ التصنيف"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
