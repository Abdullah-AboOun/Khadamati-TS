import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getAdminServicesFn,
  getAdminUsersFn,
  toggleServiceActiveFn,
  adminCreateServiceFn,
  adminUpdateServiceFn,
  adminDeleteServiceFn,
} from "@/server/functions/admin";
import { getServiceByIdFn } from "@/server/functions/services";
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
import { PRICING_LABELS, CITIES, formatPrice, DEFAULT_CATEGORIES } from "../../../shared/constants";
import { useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Upload,
  Search,
  Filter,
  Ban,
  CheckCircle,
  Briefcase,
} from "lucide-react";

export const Route = createFileRoute("/admin/services")({
  component: AdminServicesComponent,
});

interface ServiceItem {
  id: number;
  title: string;
  providerId?: string;
  providerName: string;
  categoryId: number | null;
  categoryName: string;
  pricingType: "fixed" | "quote";
  price: number | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
  images?: string[];
}

function AdminServicesComponent() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["adminServices"],
    queryFn: () => getAdminServicesFn({ data: { page: 1, limit: 100 } }),
  });

  const categories = DEFAULT_CATEGORIES;
  const { data: providers } = useQuery({
    queryKey: ["adminProviders"],
    queryFn: () => getAdminUsersFn({ data: { role: "provider", limit: 100 } }),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (data: { id: number; isActive: boolean }) => toggleServiceActiveFn({ data }),
  });
  const createServiceMutation = useMutation({
    mutationFn: (data: {
      providerId: string;
      title: string;
      description: string;
      categoryId: number;
      pricingType: "fixed" | "quote";
      price: number | null;
      city: string;
      images?: string[];
    }) => adminCreateServiceFn({ data }),
  });
  const updateServiceMutation = useMutation({
    mutationFn: (data: {
      id: number;
      providerId?: string;
      title?: string;
      description?: string;
      categoryId?: number;
      pricingType?: "fixed" | "quote";
      price?: number | null;
      city?: string;
      images?: string[];
      isActive?: boolean;
    }) => adminUpdateServiceFn({ data }),
  });
  const deleteServiceMutation = useMutation({
    mutationFn: (id: number) => adminDeleteServiceFn({ data: id }),
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [pricingType, setPricingType] = useState<"fixed" | "quote">("fixed");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setEditingServiceId(null);
    setTitle("");
    setDescription("");
    setCategoryId("");
    setProviderId("");
    setPricingType("fixed");
    setPrice("");
    setCity("");
    setImages([]);
    setDialogOpen(true);
  };

  const handleOpenEdit = (svc: ServiceItem) => {
    setEditingServiceId(svc.id);
    setTitle(svc.title);
    setDescription("");
    setCategoryId(svc.categoryId?.toString() || "");
    setProviderId(svc.providerId || "");
    setPricingType(svc.pricingType);
    setPrice(svc.price?.toString() || "");
    setCity(svc.city || "");
    setImages(svc.images || []);
    setDialogOpen(true);

    fetchServiceDetail(svc.id);
  };

  const fetchServiceDetail = async (id: number) => {
    try {
      const details = await getServiceByIdFn({ data: id });
      if (details) {
        setDescription(details.description || "");
        setImages(details.images?.map((img: { url: string }) => img.url) || []);
        setProviderId(details.providerId || "");
      }
    } catch (e) {
      console.error("Failed to load details", e);
    }
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId || !city || (!editingServiceId && !providerId)) {
      toast.error("الرجاء تعبئة جميع الحقول المطلوبة");
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
          description: description || undefined,
          categoryId: parseInt(categoryId),
          pricingType,
          price: priceNum,
          city,
          images,
        });
        toast.success("تم تحديث الخدمة بنجاح");
      } else {
        await createServiceMutation.mutateAsync({
          providerId,
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
      setDialogOpen(false);
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء حفظ الخدمة");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذه الخدمة نهائياً؟")) return;
    try {
      await deleteServiceMutation.mutateAsync(id);
      toast.success("تم حذف الخدمة بنجاح");
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء حذف الخدمة");
    }
  };

  const handleToggleActive = async (serviceId: number, currentStatus: boolean) => {
    try {
      await toggleActiveMutation.mutateAsync({
        id: serviceId,
        isActive: !currentStatus,
      });
      toast.success(
        !currentStatus ? "تم تنشيط الخدمة في المنصة" : "تم إلغاء تنشيط الخدمة في المنصة",
      );
      refetch();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ في تحديث حالة الخدمة");
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

  const allServices = (data?.services as unknown as ServiceItem[]) || [];
  const totalCount = allServices.length;
  const activeCount = allServices.filter((s) => s.isActive).length;
  const inactiveCount = totalCount - activeCount;

  const filteredServices = allServices.filter((svc) => {
    const matchSearch =
      svc.title.toLowerCase().includes(search.toLowerCase()) ||
      svc.providerName.toLowerCase().includes(search.toLowerCase());

    const matchCategory = categoryFilter === "all" || svc.categoryId?.toString() === categoryFilter;

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && svc.isActive) ||
      (statusFilter === "inactive" && !svc.isActive);

    return matchSearch && matchCategory && matchStatus;
  });

  return (
    <div className="container mx-auto space-y-6 px-4 py-8 sm:px-6 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الخدمات المعروضة</h1>
          <p className="mt-2 text-muted-foreground">
            تصفح، عدل، أضف، أو احذف أي خدمات معروضة بالمنصة
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="font-semibold cursor-pointer">
          <Plus className="ml-1 size-4" />
          إضافة خدمة جديدة
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="bg-card border border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-muted-foreground block">
                إجمالي الخدمات
              </span>
              <span className="text-2xl font-extrabold text-foreground mt-1 block">
                {totalCount}
              </span>
            </div>
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Briefcase className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-muted-foreground block">خدمات نشطة</span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {activeCount}
              </span>
            </div>
            <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-muted-foreground block">خدمات معطلة</span>
              <span className="text-2xl font-extrabold text-destructive mt-1 block">
                {inactiveCount}
              </span>
            </div>
            <div className="size-10 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <Ban className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-muted-foreground block">نتائج التصفية</span>
              <span className="text-2xl font-extrabold text-primary mt-1 block">
                {filteredServices.length}
              </span>
            </div>
            <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Filter className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-muted/40 p-4 rounded-xl border border-border">
        <div className="relative flex-grow">
          <Input
            placeholder="ابحث بعنوان الخدمة أو اسم المزود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 text-right bg-background"
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px] text-right bg-background">
            <SelectValue placeholder="جميع التصنيفات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع التصنيفات</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
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

      <Card className="border border-border shadow-sm bg-card">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">عنوان الخدمة</TableHead>
                  <TableHead className="text-center">مزود الخدمة</TableHead>
                  <TableHead className="text-center">التصنيف</TableHead>
                  <TableHead className="text-center">المدينة</TableHead>
                  <TableHead className="text-center">طريقة التسعير</TableHead>
                  <TableHead className="text-center">السعر</TableHead>
                  <TableHead className="text-center">تاريخ الإضافة</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((svc) => (
                  <TableRow key={svc.id} className={!svc.isActive ? "opacity-75 bg-muted/10" : ""}>
                    <TableCell className="text-center font-bold">{svc.title}</TableCell>
                    <TableCell className="text-center">{svc.providerName}</TableCell>
                    <TableCell className="text-center">{svc.categoryName}</TableCell>
                    <TableCell className="text-center">{svc.city || "-"}</TableCell>
                    <TableCell className="text-center">
                      {PRICING_LABELS[svc.pricingType as "fixed" | "quote"]}
                    </TableCell>
                    <TableCell className="text-center">
                      {svc.price ? formatPrice(svc.price) : "طلب تسعير"}
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(svc.createdAt).toLocaleDateString("ar")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={svc.isActive ? "default" : "secondary"}>
                        {svc.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 font-semibold cursor-pointer"
                          onClick={() => handleOpenEdit(svc)}
                        >
                          <Edit2 className="size-3.5 ml-1" />
                          تعديل
                        </Button>
                        <Button
                          size="sm"
                          variant={svc.isActive ? "destructive" : "default"}
                          className="h-8 font-semibold cursor-pointer"
                          onClick={() => handleToggleActive(svc.id, svc.isActive)}
                        >
                          {svc.isActive ? "إلغاء التنشيط" : "تنشيط"}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                          onClick={() => handleDelete(svc.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredServices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      لا توجد خدمات مطابقة لخيارات البحث الحالية.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="text-right max-w-lg" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle>
              {editingServiceId ? "تعديل بيانات الخدمة" : "إضافة خدمة جديدة"}
            </DialogTitle>
            <DialogDescription>أدخل تفاصيل الخدمة والأسعار لتهيئتها في المنصة</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">عنوان الخدمة *</label>
              <Input
                placeholder="مثال: صيانة تكييف مركزي"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-right"
              />
            </div>

            {!editingServiceId && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">مزود الخدمة *</label>
                <Select value={providerId} onValueChange={setProviderId}>
                  <SelectTrigger className="w-full text-right">
                    <SelectValue placeholder="اختر مقدم الخدمة" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers?.users.map((prov) => (
                      <SelectItem key={prov.id} value={prov.id}>
                        {prov.name} ({prov.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">التصنيف *</label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-full text-right">
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

              <div className="space-y-1.5">
                <label className="text-sm font-medium">المدينة *</label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">طريقة التسعير *</label>
                <Select
                  value={pricingType}
                  onValueChange={(val) => setPricingType(val as "fixed" | "quote")}
                >
                  <SelectTrigger className="w-full text-right">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">سعر ثابت</SelectItem>
                    <SelectItem value="quote">طلب تسعير (مفتوح)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {pricingType === "fixed" && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">السعر (₪) *</label>
                  <Input
                    type="number"
                    placeholder="150"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required={pricingType === "fixed"}
                    className="text-right"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">الوصف التفصيلي *</label>
              <textarea
                placeholder="اكتب تفاصيل الخدمة وشروط العمل..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring text-right"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">صور الخدمة</label>
              <div className="flex flex-wrap gap-2 items-center">
                <label className="flex flex-col items-center justify-center border border-dashed border-border rounded-lg p-4 w-24 h-24 cursor-pointer hover:bg-muted/50 transition-all">
                  <Upload className="size-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">رفع صورة</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
                {images.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-24 h-24 rounded-lg overflow-hidden border border-border"
                  >
                    <img src={url} className="w-full h-full object-cover" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 left-1 size-5 rounded-full p-0 cursor-pointer"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full font-bold cursor-pointer mt-2"
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ الخدمة"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
