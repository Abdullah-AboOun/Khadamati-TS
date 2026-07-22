import { Hono } from "hono";
import { db, schema } from "./db";
import { jawwalPayWebhookSchema } from "../shared/schemas";
import { generateJawwalPaySignature } from "./routers/jawwalpay";
import { eq } from "drizzle-orm";

export const jawwalPayWebhookApp = new Hono();

jawwalPayWebhookApp.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const parseResult = jawwalPayWebhookSchema.safeParse(body);

    if (!parseResult.success) {
      return c.json(
        {
          success: false,
          error: "بيانات الإشعار غير صالحة (Invalid payload)",
          details: parseResult.error.flatten(),
        },
        400,
      );
    }

    const { sessionId, orderId, amount, phone, status, gatewayTxId, signature } = parseResult.data;

    // Check header signature if provided, otherwise fallback to signature field in payload
    const headerSignature = c.req.header("X-JawwalPay-Signature");
    const signatureToVerify = headerSignature || signature;

    const expectedSignature = generateJawwalPaySignature(orderId, amount, gatewayTxId);

    if (signatureToVerify !== expectedSignature) {
      return c.json(
        {
          success: false,
          error: "التوقيع الرقمي للإشعار غير صحيح (Invalid HMAC signature)",
        },
        401,
      );
    }

    const [order] = await db
      .select()
      .from(schema.order)
      .where(eq(schema.order.id, orderId))
      .limit(1);

    if (!order) {
      return c.json({ success: false, error: "الطلب غير موجود" }, 404);
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

      return c.json(
        {
          success: true,
          message: "تم معالجة الإشعار وتأكيد العملية بنجاح",
          orderId,
          gatewayTxId,
          sessionId,
        },
        200,
      );
    } else {
      return c.json({ success: false, error: "حالة العملية غير ناجحة" }, 400);
    }
  } catch (error) {
    console.error("Error processing Jawwal Pay Webhook:", error);
    return c.json(
      {
        success: false,
        error: "حدث خطأ داخلي أثناء معالجة الإشعار",
      },
      500,
    );
  }
});
