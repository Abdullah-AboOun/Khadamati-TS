import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.email({ message: "البريد الإلكتروني غير صالح" }),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100),
  email: z.email({ message: "البريد الإلكتروني غير صالح" }),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").max(128),
  role: z.enum(["client", "provider"]),
  phone: z.string().max(20).optional(),
  city: z.string().max(80).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  city: z.string().max(80).optional(),
  bio: z.string().max(500).optional(),
});

// ─── Services ────────────────────────────────────────────

export const createServiceSchema = z.object({
  title: z.string().min(3, "عنوان الخدمة قصير جداً").max(200),
  description: z.string().min(10, "وصف الخدمة قصير جداً").max(2000),
  categoryId: z.number().int().positive("يجب اختيار تصنيف"),
  pricingType: z.enum(["fixed", "quote"]),
  price: z.number().positive("السعر يجب أن يكون أكبر من صفر").nullable(),
  city: z.string().min(1, "يجب اختيار المدينة").max(80),
  images: z.array(z.string()).optional(),
});

export const updateServiceSchema = createServiceSchema.partial().extend({
  id: z.number().int().positive(),
  isActive: z.boolean().optional(),
});

export const serviceFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  city: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  pricingType: z.enum(["fixed", "quote"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(12),
});

// ─── Orders ──────────────────────────────────────────────

export const createOrderSchema = z.object({
  serviceId: z.number().int().positive(),
  details: z.string().max(1000).optional(),
  notes: z.string().max(500).optional(),
});

export const requestQuoteSchema = z.object({
  serviceId: z.number().int().positive(),
  description: z.string().min(10, "وصف الطلب قصير جداً").max(1000),
});

export const respondToQuoteSchema = z.object({
  orderId: z.number().int().positive(),
  quotedPrice: z.number().positive("السعر يجب أن يكون أكبر من صفر"),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.number().int().positive(),
  status: z.enum(["pending", "quoted", "accepted", "in_progress", "completed", "cancelled"]),
  paymentMethod: z.string().optional(),
  paymentProof: z.string().optional(),
  accountNumber: z.string().optional(),
  details: z.string().optional(),
  paymentStatus: z.string().optional(),
});

// ─── Reviews ─────────────────────────────────────────────

export const createReviewSchema = z.object({
  orderId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

// ─── Admin ───────────────────────────────────────────────

export const adminUpdateUserSchema = z.object({
  userId: z.string(),
  isActive: z.boolean().optional(),
  role: z.enum(["client", "provider", "admin"]).optional(),
});

export const adminUpdateSettingsSchema = z.object({
  commissionRate: z
    .number()
    .min(0, "نسبة العمولة يجب أن تكون 0 أو أكثر")
    .max(1, "نسبة العمولة يجب أن تكون أقل من 100%"),
});

export const createCategorySchema = z.object({
  name: z.string().min(2, "اسم التصنيف قصير جداً").max(100),
  slug: z.string().min(2).max(100),
  icon: z.string().max(50).optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.number().int().positive(),
});

export const contactFormSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100),
  email: z.email({ message: "البريد الإلكتروني غير صالح" }),
  subject: z.string().min(3, "الموضوع يجب أن يكون 3 أحرف على الأقل").max(200),
  message: z.string().min(10, "الرسالة يجب أن تكون 10 أحرف على الأقل").max(2000),
});

export const adminCreateUserSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100),
  email: z.email({ message: "البريد الإلكتروني غير صالح" }),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  role: z.enum(["client", "provider", "admin"]),
  phone: z.string().max(20).optional(),
  city: z.string().max(80).optional(),
});

export const adminEditUserSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100),
  email: z.email({ message: "البريد الإلكتروني غير صالح" }),
  role: z.enum(["client", "provider", "admin"]),
  phone: z.string().max(20).optional(),
  city: z.string().max(80).optional(),
  isActive: z.boolean(),
});

export const adminCreateServiceSchema = z.object({
  providerId: z.string(),
  title: z.string().min(3, "عنوان الخدمة قصير جداً").max(200),
  description: z.string().min(10, "وصف الخدمة قصير جداً").max(2000),
  categoryId: z.number().int().positive("يجب اختيار تصنيف"),
  pricingType: z.enum(["fixed", "quote"]),
  price: z.number().positive("السعر يجب أن يكون أكبر من صفر").nullable(),
  city: z.string().min(1, "يجب اختيار المدينة").max(80),
  images: z.array(z.string()).optional(),
});

export const adminEditServiceSchema = adminCreateServiceSchema.partial().extend({
  id: z.number().int().positive(),
  isActive: z.boolean().optional(),
});

// ─── Inferred Types ──────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceFilterInput = z.infer<typeof serviceFilterSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type RequestQuoteInput = z.infer<typeof requestQuoteSchema>;
export type RespondToQuoteInput = z.infer<typeof respondToQuoteSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type AdminUpdateSettingsInput = z.infer<typeof adminUpdateSettingsSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminEditUserInput = z.infer<typeof adminEditUserSchema>;
export type AdminCreateServiceInput = z.infer<typeof adminCreateServiceSchema>;
export type AdminEditServiceInput = z.infer<typeof adminEditServiceSchema>;
