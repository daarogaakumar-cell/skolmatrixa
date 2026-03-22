import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  tenantId: z.string().optional(),
});

export const registerSchema = z
  .object({
    institutionName: z.string().min(2, "Institution name must be at least 2 characters"),
    type: z.enum(["SCHOOL", "COACHING_INSTITUTE", "LIBRARY"]),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits").optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    adminName: z.string().min(2, "Name must be at least 2 characters"),
    adminEmail: z.string().email("Invalid admin email"),
    adminPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.adminPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
