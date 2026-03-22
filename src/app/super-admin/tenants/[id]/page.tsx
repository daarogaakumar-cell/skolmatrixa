import { notFound } from "next/navigation";
import { getTenantById } from "@/actions/tenant";
import { TenantDetailClient } from "@/components/super-admin/tenant-detail-client";

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getTenantById(id);

  if (!tenant) {
    notFound();
  }

  return <TenantDetailClient tenant={tenant} />;
}
