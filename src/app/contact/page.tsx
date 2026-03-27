"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Send,
  Loader2,
  MessageSquare,
  Clock,
  Headphones,
} from "lucide-react";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Simulate form submission — replace with your actual contact form handler
    await new Promise((r) => setTimeout(r, 1500));
    setSuccess(true);
    setLoading(false);
  }

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
      <section className="relative overflow-hidden pt-36 pb-20 bg-[#FAFAF8]">
        <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-teal-400/[0.08] blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-400/[0.06] blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-5 py-2 text-sm font-semibold text-teal-700">
            <MessageSquare className="h-3.5 w-3.5 text-teal-500" />
            Get in Touch
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-[family-name:var(--font-display)] sm:text-5xl lg:text-6xl">
            Contact Us
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-500">
            Have questions about SkolMatrixa? Want a demo? Need support? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      {/* ── Contact Info + Form ── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-5">

            {/* Left — Info */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-display)] mb-6">Let&apos;s Connect</h2>
              <p className="text-slate-500 leading-relaxed mb-10">
                Whether you&apos;re a school looking to modernize operations, or a coaching institute seeking better
                management tools — we&apos;re here to help.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 border border-teal-100">
                    <Mail className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Email</p>
                    <p className="mt-0.5 text-sm text-slate-500">support@skolmatrixa.com</p>
                    <p className="text-sm text-slate-500">sales@skolmatrixa.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 border border-teal-100">
                    <Phone className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Phone</p>
                    <p className="mt-0.5 text-sm text-slate-500">+91 98765 43210</p>
                    <p className="text-sm text-slate-500">Mon - Sat, 9:00 AM - 7:00 PM IST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 border border-teal-100">
                    <MapPin className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Office</p>
                    <p className="mt-0.5 text-sm text-slate-500">123, Tech Park<br />Bengaluru, Karnataka 560001<br />India</p>
                  </div>
                </div>
              </div>

              {/* Quick links */}
              <div className="mt-10 grid grid-cols-2 gap-3">
                {[
                  { icon: Headphones, label: "Support", desc: "24/7 help desk" },
                  { icon: Clock, label: "Response Time", desc: "Within 2 hours" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-4 card-lift">
                    <Icon className="h-5 w-5 text-teal-600 mb-2" />
                    <p className="text-sm font-bold text-slate-900">{label}</p>
                    <p className="text-xs text-slate-500">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Form */}
            <div className="lg:col-span-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
                {success ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                      <Send className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-display)]">Message Sent!</h3>
                    <p className="mt-3 max-w-sm text-slate-500">
                      Thank you for reaching out. We&apos;ll get back to you within 2 business hours.
                    </p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="mt-6 rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:border-teal-200 hover:text-teal-700 hover:bg-teal-50"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold text-slate-900 font-[family-name:var(--font-display)] mb-6">Send us a Message</h3>
                    <form onSubmit={onSubmit} className="space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name *</label>
                          <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="John Doe"
                            required
                            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address *</label>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone</label>
                          <input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="+91 98765 43210"
                            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="institution" className="text-sm font-medium text-slate-700">Institution Name</label>
                          <input
                            id="institution"
                            name="institution"
                            type="text"
                            placeholder="Your School / Institute"
                            className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="subject" className="text-sm font-medium text-slate-700">Subject *</label>
                        <select
                          id="subject"
                          name="subject"
                          required
                          className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
                        >
                          <option value="">Select a topic...</option>
                          <option value="demo">Request a Demo</option>
                          <option value="pricing">Pricing Inquiry</option>
                          <option value="support">Technical Support</option>
                          <option value="partnership">Partnership / Reseller</option>
                          <option value="feedback">Feedback / Suggestion</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="message" className="text-sm font-medium text-slate-700">Message *</label>
                        <textarea
                          id="message"
                          name="message"
                          rows={5}
                          placeholder="Tell us how we can help..."
                          required
                          className="flex w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition-all hover:brightness-105 disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Map / Location ── */}
      <section className="bg-[#FAFAF8] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex h-80 items-center justify-center bg-slate-50">
              <div className="text-center">
                <MapPin className="mx-auto h-10 w-10 text-teal-300 mb-3" />
                <p className="text-sm text-slate-400">Map placeholder — Embed your Google Maps here</p>
                <p className="text-xs text-slate-400 mt-1">123, Tech Park, Bengaluru, Karnataka 560001</p>
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
            <Link href="/terms" className="text-slate-400 hover:text-teal-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
