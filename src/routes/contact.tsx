import { createFileRoute } from "@tanstack/react-router";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, Send, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/contact")({
  component: ContactComponent,
});

function ContactComponent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // tRPC mutation
  const submitContactMutation = trpc.contact.submit.useMutation();

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Basic frontend validation
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setValidationError("الرجاء تعبئة جميع الحقول المطلوبة.");
      return;
    }
    if (name.length < 2) {
      setValidationError("الاسم يجب أن يكون حرفين على الأقل.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError("البريد الإلكتروني المدخل غير صالح.");
      return;
    }
    if (subject.length < 3) {
      setValidationError("موضوع الرسالة قصير جداً.");
      return;
    }
    if (message.length < 10) {
      setValidationError("محتوى الرسالة يجب أن يكون 10 أحرف على الأقل.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitContactMutation.mutateAsync({
        name,
        email,
        subject,
        message,
      });
      toast.success("تم إرسال رسالتك بنجاح! شكراً لك للتواصل معنا.");

      // Clear form
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء إرسال الرسالة، الرجاء المحاولة لاحقاً.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 max-w-5xl space-y-12" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold sm:text-4xl tracking-tight">كيف يمكننا مساعدتك اليوم؟</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          يسعدنا الرد على استفساراتك واقتراحاتك. املأ النموذج أدناه وسيتواصل معك فريقنا في أقرب وقت.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        {/* Contact Info Sidebar */}
        <div className="md:col-span-5 space-y-6">
          <Card className="border border-border bg-card p-6 shadow-xs">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-xl">معلومات الاتصال</CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-6 pt-4">
              {/* Phone */}
              <div className="flex items-center gap-4 text-right">
                <div className="rounded-xl bg-primary/10 p-3 text-primary shrink-0">
                  <Phone className="size-5" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">رقم الهاتف</span>
                  <span className="text-sm font-bold text-foreground" dir="ltr">
                    +970 2-224-5678
                  </span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4 text-right">
                <div className="rounded-xl bg-primary/10 p-3 text-primary shrink-0">
                  <Mail className="size-5" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">البريد الإلكتروني</span>
                  <span className="text-sm font-bold text-foreground">support@khadamati.ps</span>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center gap-4 text-right">
                <div className="rounded-xl bg-primary/10 p-3 text-primary shrink-0">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">العنوان</span>
                  <span className="text-sm font-bold text-foreground">
                    فلسطين، رام الله، حي الإرسال، عمارة الإتقان
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Hours Card */}
          <Card className="border border-border bg-card p-6 shadow-xs text-right">
            <h3 className="font-bold text-lg mb-2">أوقات العمل الرسمي</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              نستقبل رسائلكم على مدار الساعة، ويقوم فريق الدعم الفني بالرد المباشر خلال أيام العمل من
              السبت إلى الخميس، من الساعة 9:00 صباحاً وحتى 5:00 مساءً.
            </p>
          </Card>
        </div>

        {/* Contact Form Column */}
        <div className="md:col-span-7">
          <Card className="border border-border bg-card p-6 shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">إرسال استفسار</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {validationError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="contact-name">
                      الاسم بالكامل <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="contact-name"
                      placeholder="مثال: أحمد محمد"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSubmitting}
                      className="text-right"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium" htmlFor="contact-email">
                      البريد الإلكتروني <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="example@mail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="text-right"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="contact-subject">
                    الموضوع <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="contact-subject"
                    placeholder="مثال: استفسار حول تسوية الحساب"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={isSubmitting}
                    className="text-right"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="contact-message">
                    محتوى الرسالة <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    placeholder="اكتب رسالتك أو استفسارك بالتفصيل هنا..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-right min-h-[150px]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="size-4" />
                  {isSubmitting ? "جاري إرسال الرسالة..." : "إرسال الرسالة"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
