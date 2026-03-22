"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="w-full max-w-sm mx-auto text-center">
        <div className="mb-4 flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-red-50">
          <ShieldCheck className="h-7 w-7 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Invalid Reset Link</h1>
        <p className="mt-2 text-sm text-gray-500">
          This link is invalid or has expired. Please request a new password reset.
        </p>
        <Link
          href="/forgot-password"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-linear-to-r from-amber-500 to-orange-500 px-6 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 transition-all"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }

    try {
      const result = await resetPasswordAction(token, password);
      if (result.success) {
        router.push("/login?reset=true");
      } else {
        setError(result.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Reset Password
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Enter your new password below
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">New Password</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min 8 characters"
              required
              minLength={8}
              className="h-11 pl-10 bg-white border-gray-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm Password</Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter password"
              required
              className="h-11 pl-10 bg-white border-gray-200 focus-visible:border-amber-400 focus-visible:ring-amber-400/20"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-11 w-full bg-linear-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg shadow-amber-500/20 hover:from-amber-600 hover:to-orange-600 hover:shadow-amber-500/30 transition-all duration-200"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Reset Password
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="font-semibold text-amber-600 hover:text-amber-700 transition-colors">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
