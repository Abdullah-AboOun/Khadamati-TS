import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ClipboardList,
  CheckCircle,
  TrendingUp,
  Hourglass,
  Plus,
  Trash2,
  Edit2,
  Upload,
  MapPin,
  Eye,
  EyeOff,
  FileText,
  LayoutDashboard,
  Briefcase,
  Sliders,
  Menu,
  X,
} from "lucide-react";
import { formatPrice, STATUS_LABELS, CITIES, DEFAULT_CATEGORIES } from "../../../shared/constants";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

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

const STATUS_COLOR_CLASSES: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 border-yellow-200",
  quoted: "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200",
  accepted: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 border-green-200",
  in_progress:
    "bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200",
  completed:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400 border-red-200",
};

const dashboardSearchSchema = z.object({
  tab: z.enum(["overview", "services", "orders"]).optional().catch("overview"),
});

export const Route = createFileRoute("/provider/dashboard")({
  validateSearch: (search) => dashboardSearchSchema.parse(search),
  component: ProviderDashboardComponent,
});

function ProviderDashboardComponent() {
  const { tab = "overview" } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const handleTabChange = (value: "overview" | "services" | "orders") => {
    navigate({
      search: (prev) => ({ ...prev, tab: value }),
    });
  };

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { label: "الخلاصة", value: "overview", icon: LayoutDashboard },
    { label: "خدماتي المعروضة", value: "services", icon: Briefcase },
    { label: "طلبات العملاء", value: "orders", icon: ClipboardList },
  ] as const;

  const { data: orders, isLoading: isOrdersLoading, refetch: refetchOrders } =
    trpc.orders.getProviderOrders.useQuery();
  const { data: services, isLoading: isServicesLoading, refetch: refetchServices } =
    trpc.services.getMyServices.useQuery();

  // Statistics
  const totalOrders = orders?.length ?? 0;
  const activeOrders =
    orders?.filter((o) => ["pending", "quoted", "accepted", "in_progress"].includes(o.status))
      .length ?? 0;
  const completedOrders = orders?.filter((o) => o.status === "completed").length ?? 0;
  const totalEarnings =
    orders?.filter((o) => o.status === "completed").reduce((sum, o) => sum + (o.amount ?? 0), 0) ??
    0;

  // --- Services tab state and mutations ---
  const categories = DEFAULT_CATEGORIES;
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

  const handleSave = async (e: React.FormEvent) => {
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
      refetchServices();
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
      refetchServices();
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
      refetchServices();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء تعديل الخدمة");
    }
  };

  // --- Orders tab state and mutations ---
  const [quoteOrderId, setQuoteOrderId] = useState<number | null>(null);
  const [quotedPrice, setQuotedPrice] = useState("");
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  const respondToQuoteMutation = trpc.orders.respondToQuote.useMutation();
  const updateStatusMutation = trpc.orders.updateStatus.useMutation();
  const cancelOrderMutation = trpc.orders.cancelOrder.useMutation();

  const [cancelOrderId, setCancelOrderId] = useState<number | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: status as Parameters<typeof updateStatusMutation.mutateAsync>[0]["status"],
      });
      toast.success("تم تحديث حالة الطلب بنجاح");
      refetchOrders();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ في تحديث الطلب");
    }
  };

  const handleSendQuote = async () => {
    if (!quoteOrderId || !quotedPrice) return;
    const priceNum = parseFloat(quotedPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("الرجاء إدخال سعر صالح أكبر من صفر");
      return;
    }

    setIsSubmittingQuote(true);
    try {
      await respondToQuoteMutation.mutateAsync({
        orderId: quoteOrderId,
        quotedPrice: priceNum,
      });
      toast.success("تم إرسال التسعيرة للعميل بنجاح");
      setQuoteDialogOpen(false);
      setQuotedPrice("");
      refetchOrders();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء إرسال التسعيرة");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderId) return;
    setIsCancelling(true);
    try {
      await cancelOrderMutation.mutateAsync({ orderId: cancelOrderId });
      toast.success("تم إلغاء الطلب بنجاح");
      setCancelDialogOpen(false);
      refetchOrders();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء إلغاء الطلب");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-muted/20" dir="rtl">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside
        className={`hidden md:flex flex-col border-l border-border bg-card transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Sidebar Header */}
        <div
          className={`flex h-16 items-center border-b border-border ${
            collapsed ? "justify-center" : "justify-start px-4"
          }`}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-primary hover:bg-primary/5 hover:text-primary cursor-pointer"
            title={collapsed ? "توسيع القائمة" : "طي القائمة"}
          >
            <Sliders className="size-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = tab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => handleTabChange(item.value)}
                className={`flex items-center rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all cursor-pointer w-full text-right ${
                  isActive ? "bg-primary/10 text-primary font-bold" : ""
                } ${
                  collapsed ? "justify-center p-2.5 w-10 mx-auto" : "gap-3 px-3 py-2.5 justify-start"
                }`}
              >
                <Icon className="size-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>

      </aside>

      {/* ─── MOBILE DRAWER SIDEBAR ─── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-background/80 backdrop-blur-sm">
          <aside className="w-64 max-w-xs bg-card p-4 border-l border-border h-full flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2 font-bold text-primary">
                <Sliders className="size-5" />
                <span>لوحة التحكم للمزود</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = tab === item.value;
                return (
                  <button
                    key={item.value}
                    onClick={() => {
                      handleTabChange(item.value);
                      setMobileOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all w-full text-right cursor-pointer justify-start ${
                      isActive ? "bg-primary/10 text-primary font-bold" : ""
                    }`}
                  >
                    <Icon className="size-5" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>

          </aside>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile / Desktop Header */}
        <header className="flex h-16 items-center border-b border-border bg-card px-6 justify-between shrink-0">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              className="md:hidden ml-3"
            >
              <Menu className="size-6" />
            </Button>
            <div className="font-bold text-lg text-primary flex items-center gap-2">
              <Sliders className="size-5 lg:hidden md:inline-block hidden" />
              <span>لوحة التحكم للمزود</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              تابع أعمالك، أرباحك، وخدماتك من مكان واحد بكل سهولة
            </p>
          </div>
        </header>

        {/* Content Scrollable Area */}
        <main className="flex-grow overflow-y-auto p-6">
          {/* OVERVIEW TAB */}
          {tab === "overview" && (
            <div className="space-y-8 animate-in fade-in-50 duration-200">
              {isOrdersLoading ? (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))}
                  </div>
                  <Skeleton className="h-64 w-full rounded-xl" />
                </div>
              ) : (
                <>
                  {/* Stats Cards */}
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                    <Card className="border border-border shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">
                          إجمالي الطلبات
                        </CardTitle>
                        <ClipboardList className="size-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                      </CardContent>
                    </Card>

                    <Card className="border border-border shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">
                          الطلبات النشطة
                        </CardTitle>
                        <Hourglass className="size-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{activeOrders}</div>
                      </CardContent>
                    </Card>

                    <Card className="border border-border shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">
                          الطلبات المكتملة
                        </CardTitle>
                        <CheckCircle className="size-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{completedOrders}</div>
                      </CardContent>
                    </Card>

                    <Card className="border border-border shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">
                          إجمالي الأرباح
                        </CardTitle>
                        <TrendingUp className="size-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-primary">
                          {formatPrice(totalEarnings)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Orders Table */}
                  <Card className="border border-border shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                      <div>
                        <CardTitle className="text-lg font-bold">
                          آخر طلبات العملاء المستلمة
                        </CardTitle>
                      </div>
                      <Button onClick={() => handleTabChange("orders")} size="sm" variant="outline">
                        عرض وإدارة الطلبات
                      </Button>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {orders?.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          لم تستلم أي طلبات بعد.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-right">
                            <thead>
                              <tr className="border-b border-border text-sm font-medium text-muted-foreground">
                                <th className="pb-3">رقم الطلب</th>
                                <th className="pb-3">الخدمة</th>
                                <th className="pb-3">العميل</th>
                                <th className="pb-3">تاريخ الطلب</th>
                                <th className="pb-3">السعر</th>
                                <th className="pb-3 text-left">الحالة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-sm">
                              {orders?.slice(0, 5).map((ord) => (
                                <tr key={ord.id} className="transition-colors hover:bg-muted/30">
                                  <td className="py-4 font-mono">#{ord.id}</td>
                                  <td className="py-4 font-bold">{ord.serviceTitle}</td>
                                  <td className="py-4">{ord.clientName}</td>
                                  <td className="py-4">
                                    {new Date(ord.createdAt).toLocaleDateString("ar")}
                                  </td>
                                  <td className="py-4 font-semibold">
                                    {ord.amount ? formatPrice(ord.amount) : "طلب تسعير"}
                                  </td>
                                  <td className="py-4 text-left">
                                    <Badge
                                      className={`${STATUS_COLOR_CLASSES[ord.status]}`}
                                      variant="outline"
                                    >
                                      {STATUS_LABELS[ord.status]}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* SERVICES TAB */}
          {tab === "services" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">إدارة خدماتي المعروضة</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    أضف خدمات جديدة، عدل الأسعار، وتصفح ما تقدمه
                  </p>
                </div>
                <Button onClick={handleOpenCreateDialog} className="font-semibold">
                  <Plus className="ml-1 size-4" />
                  إضافة خدمة جديدة
                </Button>
              </div>

              {isServicesLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full rounded-xl" />
                  ))}
                </div>
              ) : services?.length === 0 ? (
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
                        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                          {svc.description}
                        </p>
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
                              {svc.isActive ? (
                                <EyeOff className="size-4" />
                              ) : (
                                <Eye className="size-4" />
                              )}
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

                    <Button
                      type="submit"
                      className="mt-4 w-full font-bold cursor-pointer"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "جاري الحفظ..." : "حفظ الخدمة"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ORDERS TAB */}
          {tab === "orders" && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">طلبات العملاء المستلمة</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  أرسل تسعيرات لطلبات التسعير الجديدة وحدث حالة الطلبات الجاري تنفيذها
                </p>
              </div>

              {isOrdersLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-xl" />
                  ))}
                </div>
              ) : orders?.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center">
                  <ClipboardList className="mx-auto mb-4 size-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">لا توجد طلبات مستلمة بعد</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ستظهر الطلبات هنا عندما يطلب أحد العملاء خدماتك.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders?.map((ord) => (
                    <Card key={ord.id} className="border border-border bg-card p-6 shadow-sm">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs text-muted-foreground">
                              # {ord.id}
                            </span>
                            <Badge
                              className={`font-medium ${STATUS_COLOR_CLASSES[ord.status]}`}
                              variant="outline"
                            >
                              {STATUS_LABELS[ord.status]}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-bold text-foreground">{ord.serviceTitle}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span>
                              العميل:{" "}
                              <span className="font-semibold text-foreground">{ord.clientName}</span>
                            </span>
                            <span>•</span>
                            <span>
                              تاريخ الطلب: {new Date(ord.createdAt).toLocaleDateString("ar")}
                            </span>
                          </div>
                          {ord.details && (
                            <div className="mt-2 flex max-w-xl items-start gap-2 rounded-md bg-secondary/30 p-3 text-sm text-muted-foreground">
                              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                              <p>{ord.details}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-start justify-between gap-3 sm:items-end">
                          <div className="text-right">
                            <span className="block text-xs text-muted-foreground">
                              القيمة المتفق عليها
                            </span>
                            <span className="text-xl font-extrabold text-primary">
                              {ord.amount ? formatPrice(ord.amount) : "قيد التسعير"}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2 sm:mt-0">
                            <Button asChild size="sm" variant="outline">
                              <Link to="/orders/$id" params={{ id: String(ord.id) }}>
                                عرض التفاصيل
                              </Link>
                            </Button>
                            {/* Quote pricing response button */}
                            {ord.status === "pending" && !ord.amount && (
                              <Dialog
                                open={quoteDialogOpen && quoteOrderId === ord.id}
                                onOpenChange={(open) => {
                                  setQuoteDialogOpen(open);
                                  if (open) setQuoteOrderId(ord.id);
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button size="sm" className="font-semibold cursor-pointer">
                                    تقديم عرض سعر
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="text-right" dir="rtl">
                                  <DialogHeader className="text-right">
                                    <DialogTitle>تقديم عرض سعر للعميل</DialogTitle>
                                    <DialogDescription>
                                      حدد التكلفة الإجمالية للخدمة بناءً على التفاصيل المطلوبة من
                                      العميل.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">
                                        السعر المقترح (شيكل)
                                      </label>
                                      <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={quotedPrice}
                                        onChange={(e) => setQuotedPrice(e.target.value)}
                                        className="text-right"
                                        required
                                      />
                                    </div>
                                    <Button
                                      onClick={handleSendQuote}
                                      className="w-full font-semibold cursor-pointer"
                                      disabled={isSubmittingQuote}
                                    >
                                      {isSubmittingQuote ? "جاري الإرسال..." : "إرسال عرض السعر"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}

                            {/* Provider accepts a pending order that has an amount */}
                            {ord.status === "pending" && ord.amount && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(ord.id, "accepted")}
                                className="bg-emerald-600 font-semibold hover:bg-emerald-700 text-white cursor-pointer"
                              >
                                قبول الطلب
                              </Button>
                            )}

                            {/* State transitions managed by provider */}
                            {ord.status === "accepted" && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(ord.id, "in_progress")}
                                className="bg-orange-600 font-semibold hover:bg-orange-700 text-white cursor-pointer"
                              >
                                البدء في التنفيذ
                              </Button>
                            )}

                            {ord.status === "in_progress" && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(ord.id, "completed")}
                                className="bg-emerald-600 font-semibold hover:bg-emerald-700 text-white cursor-pointer"
                              >
                                إكمال التنفيذ وتسليم العمل
                              </Button>
                            )}

                            {/* Cancel order action for provider */}
                            {["pending", "quoted"].includes(ord.status) && (
                              <Dialog
                                open={cancelDialogOpen && cancelOrderId === ord.id}
                                onOpenChange={(open) => {
                                  setCancelDialogOpen(open);
                                  if (open) setCancelOrderId(ord.id);
                                }}
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="font-semibold cursor-pointer"
                                  >
                                    إلغاء الطلب
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="text-right" dir="rtl">
                                  <DialogHeader className="text-right">
                                    <DialogTitle>هل أنت متأكد من إلغاء الطلب؟</DialogTitle>
                                    <DialogDescription>
                                      سيتم إلغاء الطلب نهائياً ولا يمكن التراجع عن هذا الإجراء.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="mt-4 flex justify-end gap-3">
                                    <Button
                                      variant="ghost"
                                      onClick={() => setCancelDialogOpen(false)}
                                      className="cursor-pointer"
                                    >
                                      تراجع
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={handleCancelOrder}
                                      disabled={isCancelling}
                                      className="cursor-pointer"
                                    >
                                      {isCancelling ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
