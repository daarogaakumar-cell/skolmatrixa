"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-white/40">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const result = await signIn("credentials", {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-8 py-10 sm:px-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="font-display text-2xl font-bold text-white">Welcome back</h2>
        <p className="mt-1.5 text-sm text-white/40">
          Sign in to your institution dashboard
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-widest text-white/40">
            Email Address
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@institution.com"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-blue-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-white/40">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] text-blue-400/60 transition-colors hover:text-blue-400"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              name="password"
              type={showPw ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-3 pr-12 text-sm text-white placeholder:text-white/20 outline-none transition-all focus:border-blue-500/50 focus:bg-white/[0.08] focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              tabIndex={-1}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 transition-colors hover:text-white/55"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="group mt-1 flex w-full items-center justify-center gap-2.5 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2.5">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing in…
            </span>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Sign In to Dashboard
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-white/[0.06]" />
        <span className="text-[10px] uppercase tracking-widest text-white/20">or</span>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>

      <p className="text-center text-sm text-white/30">
        No account yet?{" "}
        <Link href="/register" className="font-semibold text-blue-400 transition-colors hover:text-blue-300">
          Register your institution
        </Link>
      </p>
    </div>
  );
}

