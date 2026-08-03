import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { useSession, type AuthUser } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ClipboardList,
  Briefcase,
  Users,
  Landmark,
  Menu,
  Sliders,
  X,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { data: session, isPending } = useSession();
  const user = session?.user as AuthUser | null | undefined;
  const navigate = useNavigate();

  // Sidebar states
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isPending) {
      if (!user) {
        navigate({ to: "/login" });
      } else if (user.role !== "admin") {
        toast.error("هذه الصفحة مخصصة لمدير النظام فقط");
        navigate({ to: "/" });
      }
    }
  }, [user, isPending, navigate]);

  if (isPending) {
    return (
      <div className="container mx-auto space-y-4 p-6" dir="rtl">
        <Skeleton className="h-12 w-1/4 rounded-md" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const menuItems = [
    { label: "لوحة التحكم", path: "/admin", icon: LayoutDashboard },
    { label: "إدارة الطلبات", path: "/admin/orders", icon: ClipboardList },
    { label: "إدارة الخدمات", path: "/admin/services", icon: Briefcase },
    { label: "إدارة المستخدمين", path: "/admin/users", icon: Users },
    { label: "التقارير والعمولات", path: "/admin/finance", icon: Landmark },
  ];

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside
        className={`hidden md:flex flex-col border-l border-border bg-card transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Sidebar Header */}
        <div
          className={`flex h-16 items-center border-b border-border ${collapsed ? "justify-center" : "justify-start px-4"}`}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-primary hover:bg-primary/5 hover:text-primary"
            title={collapsed ? "توسيع القائمة" : "طي القائمة"}
          >
            <Sliders className="size-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 p-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-bold ${
                  collapsed ? "justify-center p-2.5 w-10 mx-auto" : "gap-3 px-3 py-2.5"
                }`}
                activeOptions={{ exact: item.path === "/admin" }}
              >
                <Icon className="size-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
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
                <span>إدارة النظام</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="size-5" />
              </Button>
            </div>

            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all [&.active]:bg-primary/10 [&.active]:text-primary [&.active]:font-bold"
                    activeOptions={{ exact: item.path === "/admin" }}
                  >
                    <Icon className="size-5" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="flex h-16 items-center border-b border-border/50 bg-card/80 backdrop-blur-md px-4 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="size-6" />
          </Button>
          <div className="mr-3 font-bold text-lg text-primary flex items-center gap-2">
            <Sliders className="size-5" />
            <span>لوحة الإدارة</span>
          </div>
        </header>

        {/* Outlet Scrollable Area */}
        <main className="flex-grow overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
