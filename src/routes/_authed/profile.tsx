import { createFileRoute } from "@tanstack/react-router"
import { useSession, authClient, type AuthUser } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { User, Phone } from "lucide-react"
import { CITIES } from "../../../shared/constants"

export const Route = createFileRoute("/_authed/profile")({
  component: ProfileComponent,
})

function ProfileComponent() {
  const { data: session } = useSession()
  const user = session?.user as AuthUser | null | undefined

  const [name, setName] = useState(() => user?.name || "")
  const [phone, setPhone] = useState(() => user?.phone || "")
  const [city, setCity] = useState(() => user?.city || "")
  const [bio, setBio] = useState(() => user?.bio || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("الاسم الكامل مطلوب")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await authClient.updateUser({
        name,
        phone: phone || null,
        city: city || null,
        bio: bio || null,
      } as unknown as Parameters<typeof authClient.updateUser>[0])

      if (error) {
        toast.error(error.message || "حدث خطأ أثناء تعديل الحساب")
      } else {
        toast.success("تم تحديث معلومات الحساب بنجاح!")
      }
    } catch {
      toast.error("حدث خطأ غير متوقع")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      key={user?.id ?? "loading"}
      className="container mx-auto max-w-xl px-4 py-8 sm:px-6"
    >
      <Card className="border border-border shadow-md">
        <CardHeader className="text-right">
          <CardTitle className="text-2xl font-bold">الملف الشخصي</CardTitle>
          <CardDescription>
            تعديل بيانات حسابك الشخصية وبيانات التواصل
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الاسم الكامل</label>
              <div className="relative">
                <Input
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
              <label className="text-sm font-medium">
                البريد الإلكتروني (غير قابل للتعديل)
              </label>
              <Input
                type="email"
                value={session?.user?.email || ""}
                disabled
                className="cursor-not-allowed bg-secondary/40 text-right text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">رقم الهاتف</label>
              <div className="relative">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pr-10 text-right"
                />
                <Phone className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">المدينة</label>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">نبذة عنك (Bio)</label>
              <div className="relative">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-right text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                  rows={3}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="mt-4 w-full font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
