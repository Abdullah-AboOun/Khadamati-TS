import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, ClipboardList, CheckCircle2, Sparkles, Heart, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/about")({
  component: AboutComponent,
});

function AboutComponent() {
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 space-y-16" dir="rtl">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
          <Sparkles className="size-4" />
          قصتنا ورؤيتنا
        </span>
        <h1 className="text-4xl font-extrabold sm:text-5xl tracking-tight leading-tight">
          نبسّط الخدمات المحلية والمستقلة
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          منصة "خدماتي" ولدت من رؤية واضحة: تسهيل العثور على مقدمي الخدمات المهرة في منطقتك
          الجغرافية وتمكين أصحاب المهن الحرة من كسب عيشهم بكرامة وأمان.
        </p>
      </section>

      {/* Mission & Vision cards */}
      <section className="grid gap-8 md:grid-cols-2">
        <Card className="border border-border p-8 bg-card shadow-sm text-right space-y-4">
          <div className="rounded-xl bg-primary/10 p-3 text-primary w-fit">
            <Heart className="size-6" />
          </div>
          <h2 className="text-2xl font-bold">رسالتنا</h2>
          <p className="text-muted-foreground leading-relaxed">
            نسعى إلى تمكين المجتمعات المحلية من خلال بناء بيئة تقنية متكاملة وموثوقة تربط بين طالبي
            الخدمات ومقدميها، مع ضمان التميز المهني، النزاهة المالية، والسرعة الفائقة في التنفيذ.
          </p>
        </Card>

        <Card className="border border-border p-8 bg-card shadow-sm text-right space-y-4">
          <div className="rounded-xl bg-primary/10 p-3 text-primary w-fit">
            <ShieldCheck className="size-6" />
          </div>
          <h2 className="text-2xl font-bold">رؤيتنا</h2>
          <p className="text-muted-foreground leading-relaxed">
            أن نصبح المنصة الريادية والأولى في تقديم وتسهيل الخدمات المحلية والمهنية الحرة، مع تعزيز
            الابتكار والتحول الرقمي لتمكين الخبراء ودعم الاقتصاد المحلي.
          </p>
        </Card>
      </section>

      {/* How it works section */}
      <section className="space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">كيف تعمل المنصة؟</h2>
          <p className="text-muted-foreground">ثلاث خطوات بسيطة تفصلك عن إنجاز خدماتك</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 relative">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            <div className="rounded-full bg-primary/15 p-6 text-primary border-4 border-background ring-4 ring-primary/10">
              <Search className="size-8" />
            </div>
            <h3 className="text-xl font-bold">1. ابحث عن الخدمة</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              تصفح الخدمات المتنوعة أو ابحث عن فني محدد، وقم بتصفية النتائج بناءً على مدينتك ونوع
              السعر.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            <div className="rounded-full bg-primary/15 p-6 text-primary border-4 border-background ring-4 ring-primary/10">
              <ClipboardList className="size-8" />
            </div>
            <h3 className="text-xl font-bold">2. اطلب وقدم التفاصيل</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              أرسل طلبك للمزود مع التفاصيل والملاحظات. إذا كانت الخدمة تتطلب تسعيرًا، فستتلقى عرض سعر
              سريع للموافقة عليه.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            <div className="rounded-full bg-primary/15 p-6 text-primary border-4 border-background ring-4 ring-primary/10">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="text-xl font-bold">3. استلم عملك وقيّم</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              يتابع المزود التنفيذ ويسلّم الطلب عند اكتماله. بعد الدفع والتأكيد، يمكنك ترك تقييم
              حقيقي لمساعدة الآخرين.
            </p>
          </div>
        </div>
      </section>

      {/* Team/CTA Section */}
      <section className="rounded-3xl bg-muted/40 border border-border p-8 sm:p-12 text-center space-y-6 max-w-4xl mx-auto shadow-xs">
        <h2 className="text-3xl font-bold">ابدأ تجربتك مع خدماتي اليوم</h2>
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
          سواء كنت تبحث عن فني موثوق، مصمم محترف، أو ترغب في تقديم خدماتك وزيادة دخلك، منصتنا هي
          الخيار الأمثل.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Button asChild size="lg" className="px-8 font-bold cursor-pointer">
            <Link to="/services">تصفح الخدمات</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="px-8 font-bold cursor-pointer">
            <Link to="/register">إنشاء حساب جديد</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
