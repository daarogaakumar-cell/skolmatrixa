import { Suspense } from "react";
import { getSubscriptionPlans } from "@/actions/tenant";
import { PlansClient } from "@/components/super-admin/plans-client";
import { Skeleton } from "@/components/ui/skeleton";

async function PlansLoader() {
  const plans = await getSubscriptionPlans();
  return <PlansClient plans={JSON.parse(JSON.stringify(plans))} />;
}

export default function SubscriptionPlansPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <p className="text-muted-foreground">Manage pricing tiers and feature limits</p>
      </div>
      <Suspense fallback={<div className="grid gap-4 md:grid-cols-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}</div>}>
        <PlansLoader />
      </Suspense>
    </div>
  );
}
