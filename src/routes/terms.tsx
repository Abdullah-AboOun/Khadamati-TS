import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"

export const Route = createFileRoute("/terms")({
  component: TermsComponent,
})

function TermsComponent() {
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 max-w-4xl space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-3">
        <FileText className="size-12 text-primary mx-auto" />
        <h1 className="text-3xl font-bold sm:text-4xl tracking-tight">الشروط والأحكام</h1>
        <p className="text-muted-foreground">تاريخ آخر تحديث: 30 حزيران 2026</p>
      </div>

      <Card className="border border-border bg-card p-6 sm:p-8 shadow-xs text-right space-y-6">
        <CardContent className="p-0 space-y-6 leading-relaxed text-sm sm:text-base">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">1. قبول الشروط</h2>
            <p className="text-muted-foreground">
              بإنشائك حساباً أو استخدامك لمنصة "خدماتي" بأي شكل من الأشكال، فإنك توافق بالكامل على الالتزام بجميع هذه الشروط والأحكام. إذا كنت لا توافق عليها، يرجى التوقف عن استخدام المنصة فوراً.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">2. الحساب والتسجيل</h2>
            <p className="text-muted-foreground">
              يجب على المستخدم تقديم معلومات دقيقة وحقيقية وكاملة عند إنشاء حسابه وتحديثها دورياً. تقع على عاتق المستخدم كامل المسؤولية عن سرية معلومات حسابه وكلمة المرور وعن أي أنشطة تتم تحت حسابه.
            </p>
            <p className="text-muted-foreground">
              يُحظر تماماً إنشاء حسابات بأسماء وهمية أو انتحال شخصيات أفراد أو شركات أخرى.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">3. شروط استخدام خدمات العملاء</h2>
            <p className="text-muted-foreground">
              عند طلبك لخدمة معينة من المنصة، فإنك توافق على الالتزام بالتالي:
            </p>
            <ul className="list-disc list-inside mr-4 space-y-1.5 text-muted-foreground">
              <li>تقديم وصف واضح وكامل للعمل المطلوب لتمكين المزود من تسعيره بدقة.</li>
              <li>دفع تكلفة الخدمة المتفق عليها عبر قنوات الدفع المعتمدة بالكامل.</li>
              <li>مراجعة العمل المسلم وتأكيده خلال مدة أقصاها 3 أيام من استلامه.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">4. شروط تقديم خدمات الخبراء والمزودين</h2>
            <p className="text-muted-foreground">
              بصفتك مزود خدمة في المنصة، فإنك تتعهد وتلتزم بـ:
            </p>
            <ul className="list-disc list-inside mr-4 space-y-1.5 text-muted-foreground">
              <li>إنجاز الخدمات المطلوبة بأعلى مستويات الاحترافية والجودة والالتزام بالوقت المتفق عليه.</li>
              <li>عدم طلب أي مبالغ مالية إضافية خارج إطار الاتفاق الرسمي والمسجل بالمنصة.</li>
              <li>احترام العملاء وحفظ سرية تفاصيل الاتصالات والمعلومات الشخصية المستلمة لتنفيذ العمل.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">5. العمولات والمعاملات المالية</h2>
            <p className="text-muted-foreground">
              تحصل منصة خدماتي على عمولة إدارية وتطويرية محددة من كل طلب ناجح ومكتمل (نسبة محددة مسبقاً وتخصم تلقائياً). تتم تسوية المستحقات المالية لمزودي الخدمات وإتاحة سحبها فور إتمام العميل للطلب وتأكيده.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">6. إلغاء الطلبات والنزاعات</h2>
            <p className="text-muted-foreground">
              يمكن إلغاء الطلب بحرية قبل بدء العمل عليه. في حال نشوء خلاف بين العميل والمزود حول جودة التنفيذ أو التسليم، يقوم فريق التحكيم والدعم الفني بمراجعة تفاصيل ومراسلات الطلب المخزنة في المنصة وإصدار قرار نهائي ملزم للطرفين بخصوص تسوية التكلفة المالية.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-foreground">7. حدود المسؤولية</h2>
            <p className="text-muted-foreground">
              منصة خدماتي هي وسيط تقني يسهل التواصل وإتمام المعاملات. نحن نبذل قصارى جهدنا لتوثيق الحسابات، ولكننا لا نتحمل مسؤولية أي أضرار مباشرة أو غير مباشرة ناتجة عن تعاملات المستخدمين خارج إطار الإجراءات الرسمية والآمنة للمنصة.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
