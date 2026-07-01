import { Link } from "@tanstack/react-router";
import { FacebookIcon } from "@/components/ui/svgs/facebookIcon";
import { X } from "@/components/ui/svgs/x";
import { XDark } from "@/components/ui/svgs/xDark";
import { InstagramIcon } from "@/components/ui/svgs/instagramIcon";
import { WhatsappIcon } from "@/components/ui/svgs/whatsappIcon";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card pt-10 pb-6 text-muted-foreground">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4 text-right">
            <h3 className="text-xl font-bold text-foreground">خدماتي</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              منصتك الموثوقة للخدمات المحلية والمستقلة. نربطك بنخبة من المحترفين لإنجاز أعمالك بسهولة
              وأمان.
            </p>
            <div className="flex gap-6 justify-start items-center">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="transition-transform duration-200 hover:scale-110"
                aria-label="Facebook"
              >
                <FacebookIcon className="size-7" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="transition-transform duration-200 hover:scale-110"
                aria-label="Twitter"
              >
                <X className="size-6 dark:hidden" />
                <XDark className="size-6 hidden dark:block" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="transition-transform duration-200 hover:scale-110"
                aria-label="Instagram"
              >
                <InstagramIcon className="size-6" />
              </a>
              <a
                href="https://wa.me/123456789"
                target="_blank"
                rel="noreferrer"
                className="transition-transform duration-200 hover:scale-110"
                aria-label="WhatsApp"
              >
                <WhatsappIcon className="size-6" />
              </a>
            </div>
          </div>

          {/* Column 1: Services */}
          <div className="text-right">
            <h4 className="font-semibold text-foreground mb-4">الخدمات</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/services" className="hover:text-foreground transition-colors">
                  تصفح جميع الخدمات
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  search={{ categoryId: 1 }}
                  className="hover:text-foreground transition-colors"
                >
                  خدمات الصيانة والمنزل
                </Link>
              </li>
              <li>
                <Link
                  to="/services"
                  search={{ categoryId: 2 }}
                  className="hover:text-foreground transition-colors"
                >
                  الخدمات الرقمية والبرمجة
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Platform */}
          <div className="text-right">
            <h4 className="font-semibold text-foreground mb-4">المنصة</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-foreground transition-colors">
                  من نحن
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-foreground transition-colors">
                  الأسئلة الشائعة
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground transition-colors">
                  اتصل بنا
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="text-right">
            <h4 className="font-semibold text-foreground mb-4">القانونية</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  سياسة الخصوصية
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  الشروط والأحكام
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 border-t border-border pt-4 text-center text-xs">
          <p>© {new Date().getFullYear()} خدماتي. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
