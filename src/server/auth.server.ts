import "@tanstack/react-start/server-only";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "../../server/auth";

export async function getServerSession() {
  const req = getRequest();
  if (!req) return null;
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return session;
}

export async function requireAuth() {
  const session = await getServerSession();
  if (!session || !session.user) {
    throw new Error("يجب تسجيل الدخول");
  }
  return session;
}

export async function requireProvider() {
  const session = await requireAuth();
  if (session.user.role !== "provider" && session.user.role !== "admin") {
    throw new Error("هذا الإجراء متاح لمزودي الخدمات فقط");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    throw new Error("هذا الإجراء متاح للمديرين فقط");
  }
  return session;
}
