import Link from "next/link";
import { BookOpen, ArrowRight, FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | SkolMatrixa — School Management ERP",
  description: "Terms of Service for SkolMatrixa school management platform. Read our terms, conditions, and refund policy.",
};

export default function TermsOfServicePage() {
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
        <div className="absolute -top-32 right-1/3 h-[400px] w-[400px] rounded-full bg-teal-400/[0.08] blur-[120px]" />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-5 py-2 text-sm font-semibold text-teal-700">
            <FileText className="h-3.5 w-3.5 text-teal-500" />
            Terms of Service
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-[family-name:var(--font-display)] sm:text-5xl">
            Terms of Service
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
              <h2 className="text-xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-500 leading-relaxed">
                By accessing or using SkolMatrixa (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
                If you do not agree to these terms, you may not use the Platform. These terms apply to all users,
                including institution administrators, teachers, staff, and any other authorized users.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">2. Description of Service</h2>
              <p className="text-slate-500 leading-relaxed">
                SkolMatrixa provides a cloud-based school management ERP platform that includes student management,
                attendance tracking, fee management, exam and report card generation, staff management, timetable
                scheduling, communication tools, analytics, and other educational institution management features.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">3. Account Registration</h2>
              <ul className="space-y-2 text-slate-500">
                {[
                  "You must provide accurate and complete information during registration.",
                  "Each institution receives a separate tenant with isolated data.",
                  "You are responsible for maintaining the confidentiality of your account credentials.",
                  "You must notify us immediately of any unauthorized access to your account.",
                  "New registrations are subject to admin approval before activation.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">4. Acceptable Use</h2>
              <p className="text-slate-500 leading-relaxed mb-3">You agree not to:</p>
              <ul className="space-y-2 text-slate-500">
                {[
                  "Use the Platform for any unlawful purpose or in violation of any applicable laws",
                  "Attempt to access other institutions' data or bypass security measures",
                  "Upload malicious code, viruses, or any harmful content",
                  "Interfere with or disrupt the Platform's infrastructure",
                  "Resell, sublicense, or redistribute the Platform without written consent",
                  "Use the Platform to send spam or unauthorized communications",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">5. Subscription & Pricing</h2>
              <p className="text-slate-500 leading-relaxed">
                SkolMatrixa offers free and paid subscription plans. Paid plans are billed monthly or annually as
                selected. Prices are subject to change with 30 days&apos; advance notice. You may upgrade or downgrade
                your plan at any time. Downgrades take effect at the end of the current billing cycle.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">6. Payment Terms</h2>
              <ul className="space-y-2 text-slate-500">
                {[
                  "All fees are quoted in Indian Rupees (INR) unless otherwise stated.",
                  "Payment is due at the start of each billing period.",
                  "Failed payments may result in service suspension after a 7-day grace period.",
                  "All payments are processed through secure third-party payment gateways.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div id="refund">
              <h2 className="text-xl font-bold text-slate-900 mb-4">7. Refund Policy</h2>
              <p className="text-slate-500 leading-relaxed mb-3">
                We want you to be completely satisfied with SkolMatrixa. Our refund policy is as follows:
              </p>
              <ul className="space-y-2 text-slate-500">
                {[
                  "Monthly plans: Full refund if requested within 7 days of payment.",
                  "Annual plans: Pro-rated refund if requested within 30 days of payment.",
                  "No refunds after the applicable refund period.",
                  "Free plan users are not eligible for refunds as no payment is involved.",
                  "Refunds are processed within 7-10 business days to the original payment method.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">8. Data Ownership</h2>
              <p className="text-slate-500 leading-relaxed">
                You retain full ownership of all data you enter into the Platform. SkolMatrixa does not claim
                ownership of your institution&apos;s data. We act only as a data processor on your behalf. Upon
                account termination, you may request a complete export of your data.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">9. Service Availability</h2>
              <p className="text-slate-500 leading-relaxed">
                We strive to maintain 99.9% uptime for our Platform. However, we may occasionally perform scheduled
                maintenance, during which the service may be temporarily unavailable. We will provide advance notice
                for planned maintenance whenever possible. We are not liable for downtime caused by factors beyond
                our control.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">10. Intellectual Property</h2>
              <p className="text-slate-500 leading-relaxed">
                The Platform, including its design, code, features, and documentation, is the intellectual property
                of SkolMatrixa. You are granted a limited, non-exclusive, non-transferable license to use the Platform
                for its intended purpose during your subscription period.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">11. Limitation of Liability</h2>
              <p className="text-slate-500 leading-relaxed">
                To the maximum extent permitted by applicable law, SkolMatrixa shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages resulting from your use of the Platform. Our
                total liability shall not exceed the amount paid by you in the 12 months preceding the claim.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">12. Termination</h2>
              <p className="text-slate-500 leading-relaxed">
                Either party may terminate this agreement at any time. You may cancel your subscription through your
                account settings. We reserve the right to suspend or terminate accounts that violate these terms.
                Upon termination, your data will be retained for 30 days to allow for export, after which it will
                be permanently deleted.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">13. Governing Law</h2>
              <p className="text-slate-500 leading-relaxed">
                These Terms of Service are governed by and construed in accordance with the laws of India.
                Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the
                courts in Bengaluru, Karnataka, India.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">14. Changes to Terms</h2>
              <p className="text-slate-500 leading-relaxed">
                We reserve the right to modify these terms at any time. Material changes will be communicated via
                email and/or a prominent notice on the Platform. Your continued use of the Platform after changes
                constitutes acceptance of the updated terms.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">15. Contact</h2>
              <p className="text-slate-500 leading-relaxed">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-2 text-slate-500 text-sm">
                <p><strong className="text-slate-900">Email:</strong> legal@skolmatrixa.com</p>
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
            <Link href="/privacy" className="text-slate-400 hover:text-teal-400 transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="text-slate-400 hover:text-teal-400 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
