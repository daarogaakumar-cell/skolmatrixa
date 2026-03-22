import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  console.log("🌱 Seeding database...");

  // 1. Create Super Admin
  const adminPassword = await bcrypt.hash("Admin@123", 12);
  const existingAdmin = await prisma.user.findFirst({
    where: { email: "admin@edumanage.com", role: "SUPER_ADMIN" },
  });
  const superAdmin = existingAdmin ?? await prisma.user.create({
    data: {
      email: "admin@edumanage.com",
      passwordHash: adminPassword,
      name: "Super Admin",
      role: "SUPER_ADMIN",
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // 2. Create Subscription Plans
  const plans = [
    {
      name: "FREE",
      maxStudents: 50,
      maxStaff: 5,
      maxStorageMb: 500,
      priceMonthly: 0,
      priceYearly: 0,
      features: ["Up to 50 students", "Up to 5 staff", "Basic attendance", "Basic exams"],
      isActive: true,
    },
    {
      name: "BASIC",
      maxStudents: 200,
      maxStaff: 20,
      maxStorageMb: 2000,
      priceMonthly: 499,
      priceYearly: 4999,
      features: ["Up to 200 students", "Up to 20 staff", "Full attendance", "Fee management", "Homework module", "Email notifications"],
      isActive: true,
    },
    {
      name: "PRO",
      maxStudents: 1000,
      maxStaff: 100,
      maxStorageMb: 10000,
      priceMonthly: 1499,
      priceYearly: 14999,
      features: ["Up to 1000 students", "Up to 100 staff", "Everything in Basic", "Advanced reports", "Priority support", "Custom branding"],
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
    console.log(`✅ Plan created: ${plan.name}`);
  }

  // 3. Create Global Settings
  const settings = [
    { key: "platform_name", value: "EduManage" },
    { key: "maintenance_mode", value: false },
    { key: "default_plan", value: "FREE" },
  ];

  for (const setting of settings) {
    await prisma.globalSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: { key: setting.key, value: setting.value },
    });
    console.log(`✅ Setting created: ${setting.key}`);
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log("📧 Super Admin: admin@edumanage.com / Admin@123");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
