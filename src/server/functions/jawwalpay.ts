import { createServerFn } from "@tanstack/react-start";
import { db, schema } from "../../../server/db";
import { requireAuth } from "../auth.server";
import { initiateJawwalPaySchema, jawwalPayWebhookSchema } from "../../../shared/schemas";
import { eq } from "drizzle-orm";
import { createHmac } from "node:crypto";

export const JAWWAL_PAY_SECRET = process.env.JAWWAL_PAY_SECRET || "mock_jawwal_pay_secret_key_2026";

export function generateJawwalPaySignature(
  orderId: number,
  amount: number,
  gatewayTxId: string,
): string {
  const payload = `${orderId}:${amount}:${gatewayTxId}`;
  return createHmac("sha256", JAWWAL_PAY_SECRET).update(payload).digest("hex");
}

export const initiateJawwalPaySessionFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => initiateJawwalPaySchema.parse(input))
  .handler(async ({ data: input }) => {
    const session = await requireAuth();

    const [order] = await db
      .select()
      .from(schema.order)
      .where(eq(schema.order.id, input.orderId))
      .limit(1);

    if (!order) {
      throw new Error("الطلب غير موجود");
    }

    if (order.clientId !== session.user.id) {
      throw new Error("غير مصرح لك بالدفع لهذا الطلب");
    }

    if (!order.amount || order.amount <= 0) {
      throw new Error("لم يتم تحديد سعر لهذا الطلب بعد");
    }

    const sessionId = `jwp_sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const gatewayTxId = `tx_jwp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const paymentToken = `tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const signature = generateJawwalPaySignature(order.id, order.amount, gatewayTxId);
    const redirectUrl = `/checkout/${order.id}?session_id=${sessionId}&provider=jawwalpay`;

    return {
      sessionId,
      orderId: order.id,
      amount: order.amount,
      currency: "ILS" as const,
      redirectUrl,
      merchantName: "منصة خدماتي فلسطين",
      gatewayTxId,
      paymentToken,
      signature,
    };
  });

export const simulateJawwalPayWebhookFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => jawwalPayWebhookSchema.parse(input))
  .handler(async ({ data: input }) => {
    const session = await requireAuth();

    const { sessionId, orderId, amount, phone, status, gatewayTxId, signature } = input;

    const expectedSignature = generateJawwalPaySignature(orderId, amount, gatewayTxId);
    if (signature !== expectedSignature) {
      throw new Error("التوقيع الرقمي للإشعار غير صحيح (HMAC Mismatch)");
    }

    const [order] = await db
      .select()
      .from(schema.order)
      .where(eq(schema.order.id, orderId))
      .limit(1);

    if (!order) {
      throw new Error("الطلب غير موجود في النظام");
    }

    if (order.clientId !== session.user.id && session.user.role !== "admin") {
      throw new Error("غير مصرح لك بإجراء محاكاة الدفع لهذا الطلب");
    }

    if (status === "SUCCESS") {
      await db
        .update(schema.order)
        .set({
          status: "accepted",
          paymentStatus: "completed",
          paymentMethod: "jawwal_pay",
          paymentProof: `بوابة جوال باي التفاعلية (Merchant API) - رقم العملية: ${gatewayTxId} - محفظة: ${phone}`,
          accountNumber: phone,
          gatewayTxId: gatewayTxId,
          updatedAt: new Date(),
        })
        .where(eq(schema.order.id, orderId));

      return {
        success: true,
        message: "تم تأكيد الدفع التفاعلي عبر محفظة جوال باي بنجاح",
        orderId,
        gatewayTxId,
        sessionId,
      };
    } else {
      throw new Error("فشلت عملية الدفع في بوابة جوال باي");
    }
  });
