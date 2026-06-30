import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: window.location.origin,
})

export const { useSession, signIn, signUp, signOut } = authClient
export type UserSession = typeof authClient.$Infer.Session

export interface AuthUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image?: string | null
  createdAt: string | Date
  updatedAt: string | Date
  role: "client" | "provider" | "admin"
  phone?: string | null
  city?: string | null
  bio?: string | null
}
