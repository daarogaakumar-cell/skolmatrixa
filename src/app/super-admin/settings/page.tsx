import { Suspense } from "react";
import { getGlobalSettings, getSubscriptionPlans } from "@/actions/tenant";
import { SettingsClient } from "@/components/super-admin/settings-client";
import { Skeleton } from "@/components/ui/skeleton";

async function SettingsLoader() {
  const [settings, plans] = await Promise.all([getGlobalSettings(), getSubscriptionPlans()]);
  return <SettingsClient settings={settings} plans={JSON.parse(JSON.stringify(plans))} />;
}

export default function GlobalSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Global Settings</h1>
        <p className="text-muted-foreground">Configure platform-wide settings</p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <SettingsLoader />
      </Suspense>
    </div>
  );
}
