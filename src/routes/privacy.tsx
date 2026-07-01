import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  component: PrivacyComponent,
});

function PrivacyComponent() {
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 max-w-4xl space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-3">
        <ShieldCheck className="size-12 text-primary mx-auto" />
        <h1 className="text-3xl font-bold sm:text-4xl tracking-tight">سياسة الخصوصية</h1>
        <p className="text-muted-foreground">تاريخ آخر تحديث: 30 حزيران 2026</p>
      </div>

      <Card className="border border-border bg-card p-6 sm:p-8 shadow-xs text-right space-y-6">
        <CardContent className="p-0 space-y-6 leading-relaxed text-sm sm:text-base">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">1. مقدمة ترحيبية</h2>
            <p className="text-muted-foreground">
              نحن في منصة "خدماتي" نلتزم بأقصى درجات حماية خصوصية بياناتك الشخصية. تشرح سياسة
              الخصوصية هذه كيفية جمع واستخدام وحفظ ومشاركة بياناتك عند استخدامك لموقعنا والخدمات
              المرتبطة به.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">2. البيانات التي نجمعها</h2>
            <p className="text-muted-foreground">
              عند تسجيلك في المنصة كعميل أو كمزود خدمة، نقوم بجمع بعض البيانات التي تساعدنا في تقديم
              وتطوير الخدمات وتسهيل التواصل وهي:
            </p>
            <ul className="list-disc list-inside mr-4 space-y-1.5 text-muted-foreground">
              <li>الاسم بالكامل والبريد الإلكتروني للتحقق والتوثيق.</li>
              <li>رقم الهاتف لتسهيل التواصل المباشر بين أطراف الطلب.</li>
              <li>المدينة الجغرافية لعرض الخدمات القريبة والمتاحة لك.</li>
              <li>الصورة الشخصية والنبذة التعريفية (خاص بمزودي الخدمات).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">3. كيف نستخدم بياناتك</h2>
            <p className="text-muted-foreground">
              نستخدم البيانات الشخصية التي نجمعها للأغراض التالية:
            </p>
            <ul className="list-disc list-inside mr-4 space-y-1.5 text-muted-foreground">
              <li>إنشاء وتفعيل وإدارة حسابك على المنصة.</li>
              <li>ربط العملاء بمزودي الخدمات المحليين المناسبين.</li>
              <li>إرسال الإشعارات وتحديثات الطلبات وفواتير الدفع والتقييمات.</li>
              <li>تحسين أداء المنصة وتقديم الدعم الفني وحل النزاعات.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">4. حماية البيانات ومشاركتها</h2>
            <p className="text-muted-foreground">
              نحن لا نبيع أو نؤجر بياناتك الشخصية لأي أطراف خارجية على الإطلاق. تتم مشاركة بيانات
              التواصل الخاصة بك (الاسم، الهاتف) فقط مع الطرف الآخر المعني بالطلب (العميل أو مزود
              الخدمة المعني) وذلك لتمكين إتمام وتنسيق العمل المطلوب.
            </p>
            <p className="text-muted-foreground">
              نطبق إجراءات أمنية تقنية وتنظيمية متطورة لحماية بياناتك من الوصول غير المصرح به أو
              التعديل أو الإتلاف.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">5. ملفات تعريف الارتباط (Cookies)</h2>
            <p className="text-muted-foreground">
              نستخدم ملفات تعريف الارتباط لتسجيل الدخول الآمن، وحفظ تفضيلاتك وتسهيل التصفح عبر صفحات
              المنصة. يمكنك تعطيل ملفات تعريف الارتباط من متصفحك، ولكن قد يؤثر ذلك على عمل بعض ميزات
              الموقع.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">6. حقوقك القانونية</h2>
            <p className="text-muted-foreground">
              لديك الحق الكامل في تعديل بياناتك الشخصية في أي وقت من خلال صفحة الملف الشخصي. كما
              يمكنك طلب حذف حسابك وبياناتك نهائياً من قاعدة بياناتنا من خلال مراسلة الدعم الفني وسنقوم
              بتلبية طلبك فوراً ما لم تكن هناك التزامات مالية معلقة.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">7. التغييرات على هذه السياسة</h2>
            <p className="text-muted-foreground">
              قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر لتعكس التغيرات التقنية أو التنظيمية.
              سنقوم بنشر أي تغييرات جديدة على هذه الصفحة مع تحديث تاريخ المراجعة في الأعلى.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
