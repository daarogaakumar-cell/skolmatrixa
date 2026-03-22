import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SetupWizardClient } from "@/components/dashboard/setup-wizard-client";

export default async function SetupPage() {
  const session = await auth();

  if (!session?.user || !session.user.tenantId) {
    redirect("/login");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: {
      id: true,
      name: true,
      type: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      pincode: true,
      website: true,
      logoUrl: true,
      settings: true,
      setupCompleted: true,
    },
  });

  if (!tenant) {
    redirect("/login");
  }

  if (tenant.setupCompleted) {
    redirect("/dashboard");
  }

  return <SetupWizardClient tenant={tenant} />;
}
