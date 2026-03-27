import Link from "next/link";
import { BookOpen, ArrowRight, Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | SkolMatrixa — School Management ERP",
  description: "Privacy Policy for SkolMatrixa school management platform. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#FAFAF8]">

      {/* ── Header ── */}
      <header className="fixed top-0 z-50 w-full glass-header border-b border-slate-200/60">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20 transition-transform group-hover:scale-105">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)]">
              Skol<span className="text-gradient-teal">Matrixa</span>
            </span>
          </Link>
          <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition-all hover:brightness-105">
            Get Started Free
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-16 bg-[#FAFAF8]">
        <div className="absolute -top-32 left-1/3 h-[400px] w-[400px] rounded-full bg-teal-400/[0.08] blur-[120px]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-5 py-2 text-sm font-semibold text-teal-700">
            <Shield className="h-3.5 w-3.5 text-teal-500" />
            Privacy Policy
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-[family-name:var(--font-display)] sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-slate-500">
            Last updated: January 1, 2026
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Introduction</h2>
              <p className="text-slate-500 leading-relaxed">
                SkolMatrixa (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting the privacy and security of your personal
                information. This Privacy Policy describes how we collect, use, disclose, and safeguard your information
                when you use our school management platform and related services.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Information We Collect</h2>
              <p className="text-slate-500 leading-relaxed mb-3">We collect the following types of information:</p>
              <ul className="space-y-2 text-slate-500">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  <span><strong className="text-slate-900">Account Information:</strong> Name, email, phone number, institution name, and role when you register.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  <span><strong className="text-slate-900">Student & Staff Data:</strong> Information entered by institution administrators including student profiles, attendance records, exam scores, and fee records.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  <span><strong className="text-slate-900">Usage Data:</strong> Browser type, IP address, pages visited, and interaction patterns for analytics and improvement purposes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                  <span><strong className="text-slate-900">Payment Information:</strong> Payment details processed through secure third-party payment gateways. We do not store credit card numbers.</span>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. How We Use Your Information</h2>
              <ul className="space-y-2 text-slate-500">
                {[
                  "To provide, maintain, and improve our school management services",
                  "To process registrations and manage your institution account",
                  "To send service-related communications, including updates and security alerts",
                  "To generate analytics and reports within your institution's dashboard",
                  "To respond to customer support requests and inquiries",
                  "To comply with legal obligations and enforce our terms of service",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Data Security</h2>
              <p className="text-slate-500 leading-relaxed">
                We implement industry-standard security measures to protect your data, including TLS/SSL encryption
                for data in transit, AES-256 encryption for data at rest, role-based access controls, and regular
                security audits. All data is hosted on secure cloud infrastructure with automated backups and
                disaster recovery capabilities.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Multi-Tenant Data Isolation</h2>
              <p className="text-slate-500 leading-relaxed">
                SkolMatrixa operates on a multi-tenant architecture with complete data isolation between institutions.
                Each institution&apos;s data is logically separated, ensuring that no institution can access another
                institution&apos;s data under any circumstances.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">6. Data Sharing & Third Parties</h2>
              <p className="text-slate-500 leading-relaxed">
                We do not sell, trade, or rent your personal information to third parties. We may share data with
                trusted service providers (e.g., cloud hosting, email delivery, payment processing) solely to operate
                and improve our services. All third-party providers are bound by data processing agreements.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">7. Data Retention</h2>
              <p className="text-slate-500 leading-relaxed">
                We retain your data for as long as your account is active or as needed to provide services. If you
                request account deletion, we will remove your data within 30 days, except where retention is required
                by law or for legitimate business purposes (e.g., audit logs).
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">8. Your Rights</h2>
              <p className="text-slate-500 leading-relaxed mb-3">You have the right to:</p>
              <ul className="space-y-2 text-slate-500">
                {[
                  "Access and review the personal data we hold about you",
                  "Request correction of inaccurate or incomplete data",
                  "Request deletion of your account and associated data",
                  "Export your data in a machine-readable format",
                  "Withdraw consent for optional data processing activities",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">9. Cookies</h2>
              <p className="text-slate-500 leading-relaxed">
                We use essential cookies for authentication and session management. We may also use analytics cookies
                to understand how users interact with our platform. You can control cookie preferences through your
                browser settings.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">10. Children&apos;s Privacy</h2>
              <p className="text-slate-500 leading-relaxed">
                While our platform manages student data for educational institutions, we do not directly collect
                personal information from children. All student data is entered and managed by authorized institution
                administrators who are responsible for obtaining appropriate consent.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">11. Changes to This Policy</h2>
              <p className="text-slate-500 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting
                the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. Continued use of the platform
                after changes constitutes acceptance of the updated policy.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">12. Contact Us</h2>
              <p className="text-slate-500 leading-relaxed">
                If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us:
              </p>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2 text-slate-500 text-sm">
                <p><strong className="text-slate-900">Email:</strong> privacy@skolmatrixa.com</p>
                <p><strong className="text-slate-900">Phone:</strong> +91 98765 43210</p>
                <p><strong className="text-slate-900">Address:</strong> 123, Tech Park, Bengaluru, Karnataka 560001, India</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 bg-slate-900 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-slate-400">© 2026 SkolMatrixa. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/about" className="text-slate-400 hover:text-teal-400 transition-colors">About</Link>
            <Link href="/terms" className="text-slate-400 hover:text-teal-400 transition-colors">Terms of Service</Link>
            <Link href="/contact" className="text-slate-400 hover:text-teal-400 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
