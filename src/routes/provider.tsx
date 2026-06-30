import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router"
import { useSession, type AuthUser } from "@/lib/auth-client"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export const Route = createFileRoute("/provider")({
  component: ProviderLayout,
})

function ProviderLayout() {
  const { data: session, isPending } = useSession()
  const user = session?.user as AuthUser | null | undefined
  const navigate = useNavigate()

  useEffect(() => {
    if (!isPending) {
      if (!user) {
        navigate({ to: "/login" })
      } else if (user.role !== "provider" && user.role !== "admin") {
        toast.error("هذه الصفحة مخصصة لمزودي الخدمات فقط")
        navigate({ to: "/" })
      }
    }
  }, [user, isPending, navigate])

  if (isPending) {
    return (
      <div className="container mx-auto space-y-4 p-6">
        <Skeleton className="h-12 w-1/4 rounded-md" />
        <Skeleton className="h-48 w-full rounded-md" />
      </div>
    )
  }

  if (!user || (user.role !== "provider" && user.role !== "admin")) {
    return null
  }

  return <Outlet />
}
