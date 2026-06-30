import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useState } from "react"
import { Plus, Minus, HelpCircle, ArrowLeft } from "lucide-react"

export const Route = createFileRoute("/faq")({
  component: FAQComponent,
})

interface FAQItem {
  question: string;
  answer: string;
  category: "general" | "client" | "provider";
}

const FAQ_DATA: FAQItem[] = [
  {
    category: "general",
    question: "ما هي منصة خدماتي؟",
    answer: "منصة خدماتي هي سوق إلكتروني يربط بين العملاء الذين يبحثون عن خدمات محلية أو رقمية متنوعة، وبين مزودي الخدمات والخبراء المحترفين القريبين جغرافياً أو المستقلين لإتمام الأعمال بسهولة وأمان.",
  },
  {
    category: "client",
    question: "كيف يمكنني طلب خدمة من المنصة؟",
    answer: "الأمر بسيط! تصفح الخدمات المتاحة، واختر الخدمة المطلوبة. إذا كان سعر الخدمة ثابتاً، يمكنك الضغط على 'طلب الخدمة' والتوجه للدفع. أما إذا كانت الخدمة تتطلب تسعيرًا، فيمكنك تقديم وصف للمشكلة أو المهمة المطلوبة، وانتظار قيام المزود بتقديم عرض سعر لتوافق عليه وتبدأ العمل.",
  },
  {
    category: "client",
    question: "كيف أضمن جودة العمل وحقوقي المالية؟",
    answer: "توفر منصة خدماتي نظام دفع آمن لحماية حقوقك. عند قبول الخدمة ودفع التكلفة، تظل الأموال معلقة لدى المنصة ولا يتم إيداعها في حساب مزود الخدمة إلا بعد انتهاء العمل بنجاح وتأكيدك على تسليم الخدمة.",
  },
  {
    category: "client",
    question: "هل يمكنني إلغاء الطلب واسترداد أموالي؟",
    answer: "نعم، يمكنك إلغاء الطلب بحرية إذا كان لا يزال في حالة 'قيد الانتظار' (Pending) أو 'تم التسعير' (Quoted) قبل بدء مزود الخدمة بالعمل الفعلي وقبول الاتفاق. بمجرد بدء العمل أو اكتماله، سيتطلب الإلغاء التواصل مع الدعم الفني.",
  },
  {
    category: "provider",
    question: "كيف يمكنني التسجيل وتقديم خدماتي على المنصة؟",
    answer: "انقر على زر 'إنشاء حساب' في القائمة العلوية، ثم اختر دورك كـ 'مزود خدمة' واملأ بياناتك والمدينة التي تعمل بها. بعد التسجيل، يمكنك التوجه إلى لوحة التحكم الخاصة بالمزود، والبدء بإضافة خدماتك وتحديد أسعارها وعرض مهاراتك.",
  },
  {
    category: "provider",
    question: "ما هي نسبة عمولة المنصة لمزودي الخدمات؟",
    answer: "التسجيل في منصة خدماتي مجاني بالكامل. يتم اقتطاع عمولة إدارية بسيطة من قيمة كل طلب مكتمل وناجح. يتم تحديد هذه النسبة في لوحة الإدارة (افتراضياً 10%) وتُخصم تلقائياً عند تسوية الطلب.",
  },
  {
    category: "provider",
    question: "كيف يتم إرسال عروض الأسعار لطلبات العملاء؟",
    answer: "عندما يطلب العميل خدمة تتطلب تسعيرًا، يظهر الطلب في صفحة 'طلبات العملاء' بلوحة التحكم الخاصة بك. يمكنك مراجعة التفاصيل والصور المرفقة، ثم إدخال التكلفة المقترحة وإرسالها للعميل. إذا وافق العميل وقام بالدفع، فستتلقى إشعاراً للبدء بالعمل.",
  },
  {
    category: "general",
    question: "كيف يمكنني التواصل مع الدعم الفني في حال واجهت مشكلة؟",
    answer: "نحن هنا لمساعدتك دائماً. يمكنك زيارة صفحة 'اتصل بنا' وإرسال رسالة تشرح مشكلتك، وسيقوم فريق الدعم الفني بمراجعتها والتواصل معك عبر البريد الإلكتروني أو الهاتف في أقرب وقت ممكن.",
  },
  {
    category: "general",
    question: "ما هي المدن التي تغطيها خدماتي؟",
    answer: "تغطي المنصة مختلف المدن والمناطق الرئيسية بما في ذلك القدس، غزة، رام الله، نابلس، الخليل، جنين، وغيرها. يمكنك تحديد مدينتك أثناء البحث لعرض مقدمي الخدمات الأقرب إليك.",
  },
]

function FAQComponent() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "client" | "provider">("all")

  const filteredFaq = FAQ_DATA.filter(
    (item) => activeTab === "all" || item.category === activeTab || item.category === "general"
  )

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 max-w-4xl space-y-10" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-3">
        <HelpCircle className="size-12 text-primary mx-auto" />
        <h1 className="text-3xl font-bold sm:text-4xl tracking-tight">الأسئلة الشائعة</h1>
        <p className="text-muted-foreground">
          اعثر على إجابات سريعة للأسئلة الأكثر تكراراً حول استخدام منصة خدماتي
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 border-b border-border pb-4">
        <Button
          variant={activeTab === "all" ? "default" : "outline"}
          onClick={() => {
            setActiveTab("all")
            setOpenIndex(null)
          }}
          className="cursor-pointer"
        >
          الكل
        </Button>
        <Button
          variant={activeTab === "client" ? "default" : "outline"}
          onClick={() => {
            setActiveTab("client")
            setOpenIndex(null)
          }}
          className="cursor-pointer"
        >
          للعملاء
        </Button>
        <Button
          variant={activeTab === "provider" ? "default" : "outline"}
          onClick={() => {
            setActiveTab("provider")
            setOpenIndex(null)
          }}
          className="cursor-pointer"
        >
          لمزودي الخدمات
        </Button>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {filteredFaq.map((item, index) => {
          const isOpen = openIndex === index
          return (
            <Card
              key={index}
              className="border border-border bg-card overflow-hidden shadow-xs transition-all duration-200"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-right font-semibold text-lg hover:bg-muted/30 transition-colors focus:outline-hidden cursor-pointer"
              >
                <span className="text-foreground">{item.question}</span>
                <span className="text-muted-foreground shrink-0 mr-4">
                  {isOpen ? <Minus className="size-5 text-primary" /> : <Plus className="size-5" />}
                </span>
              </button>

              <div
                className={`transition-all duration-300 ease-in-out ${
                  isOpen ? "max-h-[500px] border-t border-border" : "max-h-0"
                } overflow-hidden bg-muted/10`}
              >
                <p className="p-6 text-sm text-muted-foreground leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Still need help */}
      <Card className="p-8 text-center border border-border bg-muted/20 space-y-4">
        <h3 className="text-xl font-bold">هل لا تزال بحاجة للمساعدة؟</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          إذا لم تجد الإجابة التي تبحث عنها هنا، يرجى التوجه لصفحة التواصل لإرسال استفسارك مباشرة لفريقنا.
        </p>
        <Button asChild className="cursor-pointer">
          <Link to="/contact" className="flex items-center gap-1">
            <span>تواصل معنا الآن</span>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      </Card>
    </div>
  )
}
