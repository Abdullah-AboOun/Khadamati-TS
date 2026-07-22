import { router, protectedProcedure } from "../trpc";
import { db, schema } from "../db";
import { initiateJawwalPaySchema, jawwalPayWebhookSchema } from "../../shared/schemas";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createHmac } from "node:crypto";

export const JAWWAL_PAY_SECRET =
  process.env.JAWWAL_PAY_SECRET || "mock_jawwal_pay_secret_key_2026";

export function generateJawwalPaySignature(
  orderId: number,
  amount: number,
  gatewayTxId: string,
): string {
  const payload = `${orderId}:${amount}:${gatewayTxId}`;
  return createHmac("sha256", JAWWAL_PAY_SECRET).update(payload).digest("hex");
}

export const jawwalPayRouter = router({
  initiateSession: protectedProcedure
    .input(initiateJawwalPaySchema)
    .mutation(async ({ ctx, input }) => {
      const [order] = await db
        .select()
        .from(schema.order)
        .where(eq(schema.order.id, input.orderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود" });
      }

      if (order.clientId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "غير مصرح لك بإجراء عملية الدفع لهذا الطلب" });
      }

      const amount = order.amount ?? 0;
      if (amount <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "مبلغ الطلب غير صالح للدفع" });
      }

      const randomNum = Math.floor(1000000 + Math.random() * 9000000);
      const gatewayTxId = `JP-${randomNum}`;
      const sessionId = `JP-SESS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const paymentToken = `JP-TOK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const signature = generateJawwalPaySignature(order.id, amount, gatewayTxId);

      return {
        sessionId,
        paymentToken,
        gatewayTxId,
        orderId: order.id,
        amount,
        phone: input.phone,
        signature,
        merchantName: "Khadamati Services - خدماتي",
      };
    }),

  simulateWebhook: protectedProcedure
    .input(jawwalPayWebhookSchema)
    .mutation(async ({ input }) => {
      const expectedSignature = generateJawwalPaySignature(
        input.orderId,
        input.amount,
        input.gatewayTxId,
      );

      if (input.signature !== expectedSignature) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "فشل التحقق من التوقيع الرقمي لبوابة جوال باي (Invalid Webhook Signature)",
        });
      }

      const [order] = await db
        .select()
        .from(schema.order)
        .where(eq(schema.order.id, input.orderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "الطلب غير موجود" });
      }

      if (input.status === "SUCCESS") {
        const [updatedOrder] = await db
          .update(schema.order)
          .set({
            status: "accepted",
            paymentStatus: "completed",
            paymentMethod: "jawwal_pay",
            paymentProof: `بوابة جوال باي التفاعلية (Merchant API) - رقم العملية: ${input.gatewayTxId} - محفظة: ${input.phone}`,
            accountNumber: input.phone,
            gatewayTxId: input.gatewayTxId,
            updatedAt: new Date(),
          })
          .where(eq(schema.order.id, input.orderId))
          .returning();

        return {
          success: true,
          message: "تم تأكيد عملية الدفع وتحديث حالة الطلب إلى مقبول بنجاح",
          order: updatedOrder,
        };
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "فشلت عملية الدفع في بوابة جوال باي",
        });
      }
    }),
});
