import { createFileRoute, useParams } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { formatPrice, STATUS_LABELS } from "../../../shared/constants";

export const Route = createFileRoute("/admin/orders/$id/print")({
  component: OrderInvoicePrintComponent,
});

function OrderInvoicePrintComponent() {
  const { id } = useParams({ from: "/admin/orders/$id/print" });
  const orderId = parseInt(id);

  const { data: order, isLoading } = trpc.orders.getById.useQuery({ orderId });

  useEffect(() => {
    if (!isLoading && order) {
      // Auto-trigger window print after rendering
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, order]);

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-4 p-8 text-right" dir="rtl">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto p-8 text-center text-rose-600 font-bold" dir="rtl">
        عذراً، لم يتم العثور على الفاتورة المطلوبة.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 md:p-16 text-right text-black font-sans" dir="rtl">
      {/* CSS print stylesheet injection */}
      <style>{`
        @media print {
          /* Hide parent layout sidebars and headers */
          aside, header, nav, footer, button, .no-print {
            display: none !important;
          }
          /* Ensure main wrapper matches full width and has no default colors */
          body, html, main, #root, .min-h-screen {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Invoice Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-300 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800">فاتورة طلب الخدمة</h1>
          <span className="text-gray-500 block mt-1">منصة خدماتي المحلية</span>
        </div>
        <div className="text-left font-mono">
          <span className="font-bold text-gray-700 block">رقم الفاتورة: #{order.id}</span>
          <span className="text-sm text-gray-500 block mt-1">
            التاريخ: {new Date(order.createdAt).toLocaleDateString("ar")}
          </span>
          <span className="text-sm text-gray-500 block">الحالة: {STATUS_LABELS[order.status]}</span>
        </div>
      </div>

      {/* Bill To / Bill From section */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
          <h3 className="font-bold text-gray-700 border-b border-gray-200 pb-2 mb-3">
            صاحب الطلب (العميل)
          </h3>
          <div className="space-y-1.5 text-sm">
            <p>
              <span className="text-gray-500">الاسم:</span> {order.clientName}
            </p>
            <p>
              <span className="text-gray-500">رقم الهاتف:</span> {order.clientPhone || "-"}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
          <h3 className="font-bold text-gray-700 border-b border-gray-200 pb-2 mb-3">
            مزود الخدمة
          </h3>
          <div className="space-y-1.5 text-sm">
            <p>
              <span className="text-gray-500">الاسم:</span> {order.providerName}
            </p>
            <p>
              <span className="text-gray-500">رقم الهاتف:</span> {order.providerPhone || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* Service Details Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 border-b border-gray-200 font-bold">
              <th className="p-4">تفاصيل الخدمة المطلوبة</th>
              <th className="p-4 text-left w-32">السعر</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="p-4">
                <span className="font-bold text-base block text-gray-800">
                  {order.serviceTitle}
                </span>
                <span className="text-xs text-gray-500 mt-1 block">
                  التصنيف: {order.categoryName}
                </span>
                {order.details && (
                  <p className="text-xs text-gray-600 mt-2 italic bg-gray-50 p-2.5 rounded-md">
                    {order.details}
                  </p>
                )}
              </td>
              <td className="p-4 text-left font-bold font-mono">
                {order.amount ? formatPrice(order.amount) : "قيد التسعير"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Total Calculations */}
      <div className="w-full max-w-sm mr-auto space-y-3 bg-gray-50 p-5 rounded-lg border border-gray-200 text-left font-mono">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">المجموع الفرعي:</span>
          <span className="font-bold text-gray-700">
            {order.amount ? formatPrice(order.amount) : "0 ₪"}
          </span>
        </div>
        <div className="flex justify-between text-sm border-b border-gray-200 pb-3">
          <span className="text-gray-500">الضرائب ورسوم المنصة:</span>
          <span className="font-semibold text-emerald-600">0 ₪</span>
        </div>
        <div className="flex justify-between text-lg font-black pt-1">
          <span className="text-gray-800">المجموع الكلي:</span>
          <span className="text-primary">{order.amount ? formatPrice(order.amount) : "0 ₪"}</span>
        </div>
      </div>

      {/* Footer message */}
      <div className="text-center text-xs text-gray-400 mt-16 border-t border-gray-100 pt-6 no-print">
        شكراً لاستخدامكم منصة خدماتي المحلية. تم توليد هذه الفاتورة تلقائياً.
      </div>
    </div>
  );
}
