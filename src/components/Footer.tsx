import { Link } from "@tanstack/react-router"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card pt-10 pb-6 text-muted-foreground">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Column */}
          <div className="space-y-4 text-right">
            <h3 className="text-xl font-bold text-foreground">خدماتي</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              منصتك الموثوقة للخدمات المحلية والمستقلة. نربطك بنخبة من المحترفين لإنجاز أعمالك بسهولة وأمان.
            </p>
            <div className="flex gap-4 justify-start" dir="ltr">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-secondary p-2 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                aria-label="Facebook"
              >
                <svg className="size-5 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-secondary p-2 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                aria-label="Twitter"
              >
                <svg className="size-5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-secondary p-2 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                aria-label="Instagram"
              >
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://wa.me/123456789"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-secondary p-2 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                aria-label="WhatsApp"
              >
                <svg className="size-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.173 1.45 4.8 1.45 5.396 0 9.786-4.392 9.79-9.785.002-2.612-1.013-5.068-2.86-6.918A9.704 9.704 0 0 0 11.58 1.1c-5.395 0-9.786 4.391-9.79 9.784-.001 1.702.443 3.366 1.287 4.811L2.08 21.94l6.234-1.636z"/>
                </svg>
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
                <Link to="/services" search={{ categoryId: 1 }} className="hover:text-foreground transition-colors">
                  خدمات الصيانة والمنزل
                </Link>
              </li>
              <li>
                <Link to="/services" search={{ categoryId: 2 }} className="hover:text-foreground transition-colors">
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
  )
}
