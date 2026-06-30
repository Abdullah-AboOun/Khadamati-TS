import { createFileRoute, Link } from "@tanstack/react-router"
import { signUp } from "@/lib/auth-client"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { toast } from "sonner"
import { User, Mail, Lock, Phone } from "lucide-react"
import { CITIES } from "../../shared/constants"

export const Route = createFileRoute("/register")({
  component: RegisterComponent,
})

function RegisterComponent() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"client" | "provider">("client")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error("الرجاء تعبئة الحقول الأساسية (الاسم، البريد، كلمة المرور)")
      return
    }

    setIsLoading(true)
    const { error } = await signUp.email({
      email,
      password,
      name,
      role,
      phone: phone || undefined,
      city: city || undefined,
      isActive: true,
    } as unknown as Parameters<typeof signUp.email>[0])

    setIsLoading(false)

    if (error) {
      toast.error(error.message || "حدث خطأ أثناء إنشاء الحساب")
    } else {
      toast.success("تم إنشاء الحساب بنجاح! جاري تسجيل الدخول...")
      window.location.href = "/"
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg border border-border shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">إنشاء حساب جديد</CardTitle>
          <CardDescription>
            انضم إلينا اليوم وابدأ باستخدام خدماتي
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="name">
                  الاسم الكامل
                </label>
                <div className="relative">
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pr-10 text-right"
                    required
                  />
                  <User className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

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
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  كلمة المرور
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 text-right"
                    required
                  />
                  <Lock className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="role">
                  نوع الحساب
                </label>
                <Select
                  value={role}
                  onValueChange={(val) => setRole(val as "client" | "provider")}
                >
                  <SelectTrigger className="flex w-full justify-between text-right">
                    <SelectValue placeholder="اختر نوع الحساب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="client"
                      className="flex justify-end text-right"
                    >
                      عميل (أبحث عن خدمات)
                    </SelectItem>
                    <SelectItem
                      value="provider"
                      className="flex justify-end text-right"
                    >
                      مزود خدمة (أريد تقديم خدمات)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="phone">
                  رقم الهاتف (اختياري)
                </label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pr-10 text-right"
                  />
                  <Phone className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="city">
                  المدينة (اختياري)
                </label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="flex w-full justify-between text-right">
                    <SelectValue placeholder="اختر المدينة" />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => (
                      <SelectItem
                        key={c}
                        value={c}
                        className="flex justify-end text-right"
                      >
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="mt-4 w-full font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center justify-center gap-2 border-t border-border pt-6">
          <span className="text-sm text-muted-foreground">
            لديك حساب بالفعل؟
          </span>
          <Link
            to="/login"
            className="text-sm font-semibold text-primary hover:underline"
          >
            تسجيل الدخول
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
