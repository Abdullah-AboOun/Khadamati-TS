import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Upload, MapPin, Eye, EyeOff } from "lucide-react";
import { formatPrice, CITIES } from "../../../shared/constants";

export interface ServiceItem {
  id: number;
  title: string;
  description: string | null;
  categoryId: number | null;
  pricingType: "fixed" | "quote";
  price: number | null;
  city: string | null;
  isActive: boolean;
  images?: { id: number; url: string }[] | null;
}

export const Route = createFileRoute("/provider/my-services")({
  component: MyServicesComponent,
});

function MyServicesComponent() {
  const { data: services, isLoading, refetch } = trpc.services.getMyServices.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();

  // Form states
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [pricingType, setPricingType] = useState<"fixed" | "quote">("fixed");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // mutations
  const createServiceMutation = trpc.services.create.useMutation();
  const updateServiceMutation = trpc.services.update.useMutation();
  const deleteServiceMutation = trpc.services.delete.useMutation();

  const handleOpenCreateDialog = () => {
    setEditingServiceId(null);
    setTitle("");
    setDescription("");
    setCategoryId("");
    setPricingType("fixed");
    setPrice("");
    setCity("");
    setImages([]);
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (svc: ServiceItem) => {
    setEditingServiceId(svc.id);
    setTitle(svc.title);
    setDescription(svc.description || "");
    setCategoryId(svc.categoryId?.toString() || "");
    setPricingType(svc.pricingType);
    setPrice(svc.price?.toString() || "");
    setCity(svc.city || "");
    // Fetch and populate images if available (mocked/queried if not loaded here)
    setImages(svc.images?.map((img) => img.url) || []);
    setFormDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", files[0]);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setImages((prev) => [...prev, data.url]);
        toast.success("تم رفع الصورة بنجاح");
      } else {
        toast.error(data.error || "فشل رفع الصورة");
      }
    } catch {
      toast.error("حدث خطأ أثناء رفع الصورة");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!title || !description || !categoryId || !city) {
      toast.error("الرجاء تعبئة جميع الحقول الإلزامية");
      return;
    }

    const priceNum = pricingType === "fixed" ? parseFloat(price) : null;
    if (pricingType === "fixed" && (priceNum === null || isNaN(priceNum) || priceNum <= 0)) {
      toast.error("الرجاء إدخال سعر صحيح أكبر من صفر");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingServiceId) {
        await updateServiceMutation.mutateAsync({
          id: editingServiceId,
          title,
          description,
          categoryId: parseInt(categoryId),
          pricingType,
          price: priceNum,
          city,
          images,
        });
        toast.success("تم تحديث الخدمة بنجاح");
      } else {
        await createServiceMutation.mutateAsync({
          title,
          description,
          categoryId: parseInt(categoryId),
          pricingType,
          price: priceNum,
          city,
          images,
        });
        toast.success("تم إضافة الخدمة بنجاح");
      }
      setFormDialogOpen(false);
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء حفظ الخدمة");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذه الخدمة؟")) return;
    try {
      await deleteServiceMutation.mutateAsync({ id });
      toast.success("تم حذف الخدمة بنجاح");
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء حذف الخدمة");
    }
  };

  const handleToggleActive = async (svc: ServiceItem) => {
    try {
      await updateServiceMutation.mutateAsync({
        id: svc.id,
        isActive: !svc.isActive,
      });
      toast.success(svc.isActive ? "تم إخفاء الخدمة من المنصة" : "تم تنشيط الخدمة في المنصة");
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء تعديل الخدمة");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-4 p-6">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-48 w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة خدماتي المعروضة</h1>
          <p className="mt-2 text-muted-foreground">أضف خدمات جديدة، عدل الأسعار، وتصفح ما تقدمه</p>
        </div>
        <Button onClick={handleOpenCreateDialog} className="font-semibold">
          <Plus className="ml-1 size-4" />
          إضافة خدمة جديدة
        </Button>
      </div>

      {services?.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <Plus className="mx-auto mb-4 size-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">لا توجد خدمات معروضة بعد</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            اضغط على إضافة خدمة لتبدأ بعرض مهاراتك للعملاء.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services?.map((svc) => (
            <Card
              key={svc.id}
              className={`overflow-hidden border border-border bg-card shadow-sm transition-all duration-200 ${!svc.isActive && "opacity-75"}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="line-clamp-1 text-lg font-bold">{svc.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" />
                      <span>{svc.city}</span>
                    </div>
                  </div>
                  <Badge variant={svc.isActive ? "default" : "secondary"}>
                    {svc.isActive ? "نشط" : "مخفي"}
                  </Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{svc.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-lg font-extrabold text-primary">
                    {svc.pricingType === "fixed" && svc.price
                      ? formatPrice(svc.price)
                      : "طلب تسعير"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-full"
                      onClick={() => handleToggleActive(svc)}
                      title={svc.isActive ? "إخفاء الخدمة" : "تنشيط الخدمة"}
                    >
                      {svc.isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-full"
                      onClick={() => handleOpenEditDialog(svc)}
                      title="تعديل الخدمة"
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-full text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(svc.id)}
                      title="حذف الخدمة"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-lg text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>
              {editingServiceId ? "تعديل الخدمة المعروضة" : "إضافة خدمة جديدة"}
            </DialogTitle>
            <DialogDescription>
              أدخل تفاصيل خدمتك وحدد السعر والمدينة لجذب العملاء.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">عنوان الخدمة</label>
              <Input
                type="text"
                placeholder="عنوان جذاب يصف خدمتك باختصار"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-right"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">الوصف التفصيلي</label>
              <textarea
                placeholder="اكتب ما تقدمه بالتفصيل والمميزات والضمان..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-right text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">التصنيف</label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="flex w-full justify-between text-right">
                    <SelectValue placeholder="اختر التصنيف" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">المدينة</label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="flex w-full justify-between text-right">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">طريقة التسعير</label>
                <Select
                  value={pricingType}
                  onValueChange={(val: "fixed" | "quote") => setPricingType(val)}
                >
                  <SelectTrigger className="flex w-full justify-between text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">سعر ثابت</SelectItem>
                    <SelectItem value="quote">طلب تسعير</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {pricingType === "fixed" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">السعر (شيكل)</label>
                  <Input
                    type="number"
                    placeholder="150"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="text-right"
                    required
                  />
                </div>
              )}
            </div>

            {/* Photo Uploader */}
            <div className="space-y-2">
              <label className="text-sm font-medium">صور الخدمة</label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                  id="image-file"
                />
                <label
                  htmlFor="image-file"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-input bg-secondary/30 px-4 py-2 text-sm hover:bg-secondary/50"
                >
                  <Upload className="size-4 text-muted-foreground" />
                  <span>رفع صورة</span>
                </label>
                {isUploading && (
                  <span className="text-xs text-muted-foreground">جاري الرفع...</span>
                )}
              </div>
              {images.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="group relative size-16 overflow-hidden rounded-md border bg-muted"
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="mt-4 w-full font-bold" disabled={isSubmitting}>
              {isSubmitting ? "جاري الحفظ..." : "حفظ الخدمة"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
