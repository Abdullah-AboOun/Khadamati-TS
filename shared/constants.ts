// ─── User Roles ──────────────────────────────────────────

export const USER_ROLES = ["client", "provider", "admin"] as const
export type UserRole = (typeof USER_ROLES)[number]

export const ROLE_LABELS: Record<UserRole, string> = {
  client: "عميل",
  provider: "مزود خدمة",
  admin: "مدير",
}

// ─── Order Statuses ──────────────────────────────────────

export const ORDER_STATUSES = [
  "pending",
  "quoted",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "قيد الانتظار",
  quoted: "تم التسعير",
  accepted: "مقبول",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
}

// ─── Pricing ─────────────────────────────────────────────

export const PRICING_TYPES = ["fixed", "quote"] as const
export type PricingType = (typeof PRICING_TYPES)[number]

export const PRICING_LABELS: Record<PricingType, string> = {
  fixed: "سعر ثابت",
  quote: "طلب تسعير",
}

export function formatPrice(amount: number): string {
  return `${amount.toLocaleString("ar")} ₪`
}

// ─── Cities ──────────────────────────────────────────────

export const CITIES = [
  "القدس",
  "غزة",
  "رام الله",
  "نابلس",
  "الخليل",
  "بيت لحم",
  "جنين",
  "طولكرم",
  "قلقيلية",
  "أريحا",
  "سلفيت",
  "طوباس",
  "خانيونس",
  "رفح",
  "دير البلح",
  "جباليا",
  "بيت حانون",
] as const

// ─── Default Categories ─────────────────────────────────

export const DEFAULT_CATEGORIES = [
  { name: "كهرباء", slug: "electrical", icon: "Zap" },
  { name: "سباكة", slug: "plumbing", icon: "Droplets" },
  { name: "تنظيف وتعقيم", slug: "cleaning", icon: "SprayCan" },
  { name: "نجارة", slug: "carpentry", icon: "Hammer" },
  { name: "تكييف وتبريد", slug: "ac", icon: "Snowflake" },
  { name: "تصميم جرافيك", slug: "graphic-design", icon: "Palette" },
  { name: "برمجة وتطوير مواقع", slug: "programming", icon: "Code" },
  { name: "مونتاج فيديو", slug: "video-editing", icon: "Video" },
  { name: "كتابة وترجمة", slug: "writing", icon: "PenTool" },
  { name: "تسويق إلكتروني", slug: "digital-marketing", icon: "Megaphone" },
] as const
