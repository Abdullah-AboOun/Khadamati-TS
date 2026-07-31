import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "../../shared/constants";
import { useMutation } from "@tanstack/react-query";
import { initiateJawwalPaySessionFn } from "@/server/functions/jawwalpay";
import { toast } from "sonner";
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Lock,
  Building2,
  Sparkles,
} from "lucide-react";
import { JawwalPayLogo } from "@/components/jawwal-pay-logo";

interface JawwalPayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  amount: number;
  serviceTitle?: string | null;
  defaultPhone?: string;
  onSuccess: (gatewayTxId: string) => void;
}

export function JawwalPayModal({
  open,
  onOpenChange,
  orderId,
  amount,
  serviceTitle,
  defaultPhone = "",
  onSuccess,
}: JawwalPayModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [phone, setPhone] = useState(defaultPhone || "0599000000");
  const [otp, setOtp] = useState("123456");
  const [sessionData, setSessionData] = useState<{
    sessionId: string;
    paymentToken: string;
    gatewayTxId: string;
    signature: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const initiateMutation = useMutation({
    mutationFn: (data: { orderId: number; phone: string }) => initiateJawwalPaySessionFn({ data }),
  });

  const handleReset = () => {
    setStep(1);
    setIsLoading(false);
    setSessionData(null);
  };

  const handleModalClose = (val: boolean) => {
    if (!val && isLoading) return;
    if (!val) handleReset();
    onOpenChange(val);
  };

  // Step 1: Initiate Jawwal Pay session
  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 9) {
      toast.error("الرجاء إدخال رقم هاتف محفظة جوال باي صحيح");
      return;
    }

    setIsLoading(true);
    try {
      const res = await initiateMutation.mutateAsync({
        orderId,
        phone: phone.trim(),
      });
      setSessionData({
        sessionId: res.sessionId,
        paymentToken: res.paymentToken,
        gatewayTxId: res.gatewayTxId,
        signature: res.signature,
      });
      setStep(2);
      toast.success("تم إرسال رمز التحقق (OTP) إلى محفظة جوال باي");
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "فشل الاتصال ببوابة جوال باي");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 & 3: Confirm OTP & Trigger HTTP Webhook Callback
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionData) return;
    if (otp.trim() !== "123456") {
      toast.error("رمز التحقق غير صحيح! رمز الاختبار هو 123456");
      return;
    }

    setStep(3);
    setIsLoading(true);
    try {
      const webhookPayload = {
        sessionId: sessionData.sessionId,
        orderId,
        amount,
        phone: phone.trim(),
        status: "SUCCESS",
        gatewayTxId: sessionData.gatewayTxId,
        timestamp: Date.now(),
        signature: sessionData.signature,
      };

      const response = await fetch("/api/jawwalpay/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-JawwalPay-Signature": sessionData.signature,
        },
        body: JSON.stringify(webhookPayload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "فشلت معالجة الإشعار البرمجي الدفعة (Webhook Error)");
      }

      await new Promise((resolve) => setTimeout(resolve, 800));

      setStep(4);
      toast.success("تم الدفع بنجاح عبر بوابة جوال باي!");
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "حدث خطأ أثناء معالجة الدفع");
      setStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    if (sessionData) {
      onSuccess(sessionData.gatewayTxId);
    }
    handleModalClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent
        className="sm:max-w-md bg-card border border-emerald-500/20 shadow-2xl rounded-2xl overflow-hidden p-0 text-right"
        dir="rtl"
      >
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 size-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <JawwalPayLogo className="size-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg tracking-tight">
                  بوابة جوال باي Merchant API
                </h3>
                <p className="text-xs text-emerald-100/90 font-medium">
                  الدفع الإلكتروني المباشر الآمن
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-emerald-200">
              <ShieldCheck className="size-3.5 text-emerald-300" />
              <span>مشفر ومضمون</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  step >= i ? "bg-emerald-300 shadow-sm" : "bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-xl bg-secondary/30 border border-border/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Building2 className="size-3.5" /> التاجر المعتمَد:
              </span>
              <span className="font-bold text-foreground">منصة خدماتي (Khadamati)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">الخدمة المطلوبة:</span>
              <span className="font-semibold text-foreground truncate max-w-[200px]">
                {serviceTitle}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border/40 pt-2 text-sm">
              <span className="font-bold text-muted-foreground">المبلغ الإجمالي:</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-lg">
                {formatPrice(amount)}
              </span>
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={handleInitiate} className="space-y-4 animate-in fade-in duration-200">
              <DialogHeader className="p-0 text-right space-y-1">
                <DialogTitle className="text-base font-bold text-foreground">
                  أدخل رقم محفظة Jawwal Pay الخاصة بك
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  سيتم إنشاء جلسة دفع مشفرة وإرسال رمز التحقق المؤقت لتأكيد خصم المبلغ.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  رقم الهاتف (محفظة جوال باي)
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0599000000"
                    className="pr-10 text-right dir-ltr font-mono font-bold text-base bg-background"
                    required
                  />
                  <Smartphone className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Sparkles className="size-3 text-amber-500" />
                  <span>محاكاة تجريبية: يمكنك استخدام أي رقم هاتف فعال للتجربة.</span>
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer gap-2 h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>جاري الاتصال ببوابة Jawwal Pay...</span>
                  </>
                ) : (
                  <>
                    <Lock className="size-4" />
                    <span>بدء عملية الدفع المشفرة ({formatPrice(amount)})</span>
                  </>
                )}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
              <DialogHeader className="p-0 text-right space-y-1">
                <DialogTitle className="text-base font-bold text-foreground flex items-center justify-between">
                  <span>تأكيد رمز الدفع (OTP)</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    جلسة #{sessionData?.sessionId.slice(-6)}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  أدخل رمز الأمان المؤقت المرسل إلى الهاتف{" "}
                  <strong className="font-mono dir-ltr inline-block">{phone}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                  <span>رمز التحقق التجريبي للاختبار:</span>
                  <span className="font-mono text-sm px-2 py-0.5 bg-amber-200 dark:bg-amber-900 rounded font-black tracking-wider">
                    123456
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  في البيئة الحقيقية يتم إرسال الرمز مباشرة إلى تطبيق Jawwal Pay الخاص بالمستخدم.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">رمز OTP (6 أرقام)</label>
                <Input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="text-center font-mono text-xl tracking-widest font-black bg-background h-12"
                  placeholder="123456"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 cursor-pointer"
                  disabled={isLoading}
                >
                  <ArrowRight className="size-4 ml-1" />
                  <span>تعديل الرقم</span>
                </Button>
                <Button
                  type="submit"
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer gap-2 h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      <span>تأكيد الخصم والدفع</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="py-8 text-center space-y-4 animate-in fade-in duration-200">
              <div className="relative size-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-600 animate-spin" />
                <Smartphone className="size-8 text-emerald-600 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-base text-foreground">
                  إرسال إشعار الدفع الفوري (HTTP Webhook)...
                </h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  تتواصل خوادم Jawwal Pay مع خادم منصة خدماتي للتحقق من التوقيع الرقمي HMAC وتأكيد
                  العملية آلياً...
                </p>
              </div>
              <div className="inline-flex items-center gap-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900">
                <span>POST /api/jawwalpay/webhook</span>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="py-4 text-center space-y-5 animate-in zoom-in-95 duration-300">
              <div className="size-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="size-10" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-foreground">تمت عملية الدفع بنجاح!</h3>
                <p className="text-xs text-muted-foreground">
                  تم تأكيد المعاملة المالية عبر إشعار Jawwal Pay الفوري وتحديث حالة الطلب إلى مقبول
                  تلقائياً.
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 p-4 space-y-2 text-right">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    رقم العملية المعتمَد (Gateway Tx ID):
                  </span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {sessionData?.gatewayTxId}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">طريقة الدفع:</span>
                  <span className="font-semibold text-foreground">
                    بوابة جوال باي التفاعلية (Merchant API)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">رقم محفظة الدفع:</span>
                  <span className="font-mono font-semibold text-foreground dir-ltr">{phone}</span>
                </div>
                <div className="flex items-center justify-between border-t border-emerald-200/60 dark:border-emerald-900/60 pt-2 text-sm">
                  <span className="font-bold text-foreground">المبلغ المحوَّل:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {formatPrice(amount)}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleFinish}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer h-11"
              >
                متابعة تفاصيل الطلب
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
