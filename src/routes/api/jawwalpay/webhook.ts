import { createFileRoute } from "@tanstack/react-router";
import "@tanstack/react-start";
import { db, schema } from "../../../../server/db";
import { jawwalPayWebhookSchema } from "../../../../shared/schemas";
import { generateJawwalPaySignature } from "../../../server/functions/jawwalpay";
import { eq } from "drizzle-orm";

export const Route = createFileRoute("/api/jawwalpay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const parseResult = jawwalPayWebhookSchema.safeParse(body);

          if (!parseResult.success) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "بيانات الإشعار غير صالحة (Invalid payload)",
                details: parseResult.error.flatten(),
              }),
              { status: 400, headers: { "Content-Type": "application/json" } },
            );
          }

          const { sessionId, orderId, amount, phone, status, gatewayTxId, signature } =
            parseResult.data;

          const headerSignature = request.headers.get("X-JawwalPay-Signature");
          const signatureToVerify = headerSignature || signature;

          const expectedSignature = generateJawwalPaySignature(orderId, amount, gatewayTxId);

          if (signatureToVerify !== expectedSignature) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "التوقيع الرقمي للإشعار غير صحيح (Invalid HMAC signature)",
              }),
              { status: 401, headers: { "Content-Type": "application/json" } },
            );
          }

          const [order] = await db
            .select()
            .from(schema.order)
            .where(eq(schema.order.id, orderId))
            .limit(1);

          if (!order) {
            return new Response(JSON.stringify({ success: false, error: "الطلب غير موجود" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
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

            return new Response(
              JSON.stringify({
                success: true,
                message: "تم معالجة الإشعار وتأكيد العملية بنجاح",
                orderId,
                gatewayTxId,
                sessionId,
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            );
          } else {
            return new Response(
              JSON.stringify({ success: false, error: "حالة العملية غير ناجحة" }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }
        } catch (error) {
          console.error("Error processing Jawwal Pay Webhook:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error: "حدث خطأ داخلي أثناء معالجة الإشعار",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
