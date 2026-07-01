import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme-toggle";
import { Footer } from "@/components/Footer";
import { useSession, signOut, type AuthUser } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "sonner";
import { LogOut, User, Briefcase, ClipboardList, ShieldAlert, LayoutDashboard } from "lucide-react";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const { data: session, isPending } = useSession();
  const user = session?.user as AuthUser | null | undefined;

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground" dir="rtl">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">خدماتي</span>
            </Link>
            <nav className="hidden items-center gap-6 md:flex">
              <Link
                to="/"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:font-semibold [&.active]:text-primary"
              >
                الرئيسية
              </Link>
              <Link
                to="/services"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:font-semibold [&.active]:text-primary"
              >
                تصفح الخدمات
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />

            {isPending ? (
              <div className="size-8 animate-pulse rounded-full bg-muted" />
            ) : session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative size-8 rounded-full p-0">
                    <Avatar className="size-8">
                      <AvatarImage src={session.user.image || ""} alt={session.user.name} />
                      <AvatarFallback className="bg-primary/10 font-bold text-primary">
                        {session.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuLabel className="text-right font-semibold">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Client Roles Links */}
                  <DropdownMenuItem asChild className="justify-end text-right">
                    <Link to="/profile" className="flex w-full items-center justify-between">
                      <span>الملف الشخصي</span>
                      <User className="size-4 text-muted-foreground" />
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="justify-end text-right">
                    <Link to="/my-orders" className="flex w-full items-center justify-between">
                      <span>طلباتي</span>
                      <ClipboardList className="size-4 text-muted-foreground" />
                    </Link>
                  </DropdownMenuItem>

                  {/* Provider Role Links */}
                  {user && user.role === "provider" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-right text-xs font-semibold text-muted-foreground">
                        مزود الخدمة
                      </DropdownMenuLabel>
                      <DropdownMenuItem asChild className="justify-end text-right">
                        <Link
                          to="/provider/dashboard"
                          className="flex w-full items-center justify-between"
                        >
                          <span>لوحة التحكم للمزود</span>
                          <LayoutDashboard className="size-4 text-muted-foreground" />
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="justify-end text-right">
                        <Link
                          to="/provider/my-services"
                          className="flex w-full items-center justify-between"
                        >
                          <span>خدماتي المعروضة</span>
                          <Briefcase className="size-4 text-muted-foreground" />
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="justify-end text-right">
                        <Link
                          to="/provider/orders"
                          className="flex w-full items-center justify-between"
                        >
                          <span>طلبات العملاء</span>
                          <ClipboardList className="size-4 text-muted-foreground" />
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Admin Role Links */}
                  {user && user.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-right text-xs font-semibold text-muted-foreground">
                        الإدارة
                      </DropdownMenuLabel>
                      <DropdownMenuItem asChild className="justify-end text-right">
                        <Link to="/admin" className="flex w-full items-center justify-between">
                          <span>لوحة الإدارة</span>
                          <ShieldAlert className="size-4 text-muted-foreground" />
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer justify-end text-right font-medium text-destructive"
                    onClick={handleLogout}
                  >
                    <span className="flex w-full items-center justify-between">
                      <span>تسجيل الخروج</span>
                      <LogOut className="size-4 text-destructive" />
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" className="text-sm font-medium">
                  <Link to="/login">تسجيل الدخول</Link>
                </Button>
                <Button asChild className="text-sm font-medium">
                  <Link to="/register">إنشاء حساب</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Toasts */}
      <Toaster position="top-center" dir="rtl" />
    </div>
  );
}
