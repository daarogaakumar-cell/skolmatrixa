"use server";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { generateSlug, isSlugAvailable } from "@/lib/tenant";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function registerTenant(formData: FormData) {
  const raw = {
    institutionName: formData.get("institutionName") as string,
    type: formData.get("type") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    city: (formData.get("city") as string) || undefined,
    state: (formData.get("state") as string) || undefined,
    pincode: (formData.get("pincode") as string) || undefined,
    adminName: formData.get("adminName") as string,
    adminEmail: formData.get("adminEmail") as string,
    adminPassword: formData.get("adminPassword") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const validated = registerSchema.safeParse(raw);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Validation failed",
    };
  }

  const data = validated.data;

  try {
    // Check if admin email already used as super admin
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { email: data.adminEmail, role: "SUPER_ADMIN" },
    });
    if (existingSuperAdmin) {
      return { success: false, error: "This email is already registered" };
    }

    // Generate unique slug
    let slug = generateSlug(data.institutionName);
    let slugAvailable = await isSlugAvailable(slug);
    let attempt = 0;
    while (!slugAvailable && attempt < 5) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
      slugAvailable = await isSlugAvailable(slug);
      attempt++;
    }

    if (!slugAvailable) {
      return { success: false, error: "Could not generate a unique URL for your institution. Try a different name." };
    }

    const passwordHash = await bcrypt.hash(data.adminPassword, 12);

    // Collect type-specific settings from raw FormData (optional fields not in core schema)
    const initSettings: Record<string, string> = {};
    const schoolLevel = formData.get("schoolLevel") as string | null;
    const boardAffiliation = formData.get("boardAffiliation") as string | null;
    const coachingFocus = formData.get("coachingFocus") as string | null;
    const teachingMode = formData.get("teachingMode") as string | null;
    const libraryType = formData.get("libraryType") as string | null;
    const librarySpec = formData.get("librarySpec") as string | null;
    if (schoolLevel) initSettings.schoolLevel = schoolLevel;
    if (boardAffiliation) initSettings.boardAffiliation = boardAffiliation;
    if (coachingFocus) initSettings.coachingFocus = coachingFocus;
    if (teachingMode) initSettings.teachingMode = teachingMode;
    if (libraryType) initSettings.libraryType = libraryType;
    if (librarySpec) initSettings.librarySpec = librarySpec;

    // Create tenant and admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.institutionName,
          slug,
          type: data.type as "SCHOOL" | "COACHING_INSTITUTE" | "LIBRARY",
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          status: "PENDING",
          settings: Object.keys(initSettings).length > 0 ? initSettings : undefined,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.adminEmail,
          passwordHash,
          name: data.adminName,
          role: "TENANT_ADMIN",
        },
      });

      return { tenant, user };
    });

    return {
      success: true,
      message: "Registration submitted successfully! Your account is pending admin approval.",
      tenantSlug: result.tenant.slug,
    };
  } catch (error: unknown) {
    console.error("Registration error:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "An institution with this email already exists" };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Invalid email or password" };
        default:
          return { success: false, error: "Something went wrong" };
      }
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirect: false });
}

export async function forgotPasswordAction(email: string) {
  if (!email) {
    return { success: false, error: "Email is required" };
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email, isActive: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true, message: "If an account exists with this email, you will receive a password reset link." };
    }

    // Generate a reset token (store in GlobalSetting as simple approach for MVP)
    const token = crypto.randomUUID();
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.globalSetting.upsert({
      where: { key: `reset_token_${token}` },
      update: { value: { userId: user.id, email: user.email, expiry: expiry.toISOString() } },
      create: { key: `reset_token_${token}`, value: { userId: user.id, email: user.email, expiry: expiry.toISOString() } },
    });

    // Send reset email — use AUTH_URL first, fall back to NEXT_PUBLIC_APP_URL
    const appUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    const { sendEmail } = await import("@/lib/email");
    const emailResult = await sendEmail({
      to: user.email,
      subject: "Reset your SkolMatrixa password",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>Hi ${user.name},</p>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
          <p style="margin-top: 16px; color: #6b7280; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    if (!emailResult.success) {
      console.error("Forgot password email failed to send:", emailResult.error);
      // Token is saved — log the reset URL server-side so admin can assist if needed
      console.log(`[RESET_LINK] ${user.email} → ${resetUrl}`);
    }

    return { success: true, message: "If an account exists with this email, you will receive a password reset link." };
  } catch (error) {
    console.error("Forgot password error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function resetPasswordAction(token: string, newPassword: string) {
  if (!token || !newPassword) {
    return { success: false, error: "Invalid request" };
  }

  if (newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  try {
    const setting = await prisma.globalSetting.findUnique({
      where: { key: `reset_token_${token}` },
    });

    if (!setting) {
      return { success: false, error: "Invalid or expired reset link" };
    }

    const tokenData = setting.value as { userId: string; email: string; expiry: string };
    if (new Date(tokenData.expiry) < new Date()) {
      await prisma.globalSetting.delete({ where: { key: `reset_token_${token}` } });
      return { success: false, error: "Reset link has expired" };
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: tokenData.userId },
      data: { passwordHash },
    });

    // Clean up token
    await prisma.globalSetting.delete({ where: { key: `reset_token_${token}` } });

    return { success: true, message: "Password reset successfully. You can now log in with your new password." };
  } catch (error) {
    console.error("Reset password error:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
