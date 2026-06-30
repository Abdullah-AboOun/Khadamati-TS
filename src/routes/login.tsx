import { createFileRoute, Link } from "@tanstack/react-router"
import { signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "sonner"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"

export const Route = createFileRoute("/login")({
  component: LoginComponent,
})

function LoginComponent() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("الرجاء تعبئة جميع الحقول")
      return
    }

    setIsLoading(true)
    const { error } = await signIn.email({
      email,
      password,
    })

    setIsLoading(false)

    if (error) {
      toast.error(error.message || "حدث خطأ أثناء تسجيل الدخول")
    } else {
      toast.success("تم تسجيل الدخول بنجاح")
      window.location.href = "/"
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border border-border shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">تسجيل الدخول</CardTitle>
          <CardDescription>
            سجل دخولك للوصول إلى حسابك في خدماتي
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10 text-right"
                  required
                />
                <Mail className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                كلمة المرور
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-10 text-right"
                  required
                />
                <Lock className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 left-2 size-8 -translate-y-1/2 rounded-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-center gap-2 border-t border-border pt-6">
          <span className="text-sm text-muted-foreground">ليس لديك حساب؟</span>
          <Link
            to="/register"
            className="text-sm font-semibold text-primary hover:underline"
          >
            إنشاء حساب جديد
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
