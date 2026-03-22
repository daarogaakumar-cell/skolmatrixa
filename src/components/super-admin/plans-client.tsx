"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan } from "@/actions/tenant";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Users, GraduationCap, HardDrive, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  maxStudents: number;
  maxStaff: number;
  maxStorageMb: number;
  priceMonthly: string | number;
  priceYearly: string | number;
  features: string[];
  isActive: boolean;
  createdAt: string;
}

const defaultPlan = {
  name: "",
  maxStudents: 100,
  maxStaff: 10,
  maxStorageMb: 1024,
  priceMonthly: 0,
  priceYearly: 0,
  features: [] as string[],
  isActive: true,
};

export function PlansClient({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState(defaultPlan);
  const [featureInput, setFeatureInput] = useState("");

  function openCreate() {
    setEditing(null);
    setForm(defaultPlan);
    setFeatureInput("");
    setOpen(true);
  }

  function openEdit(plan: Plan) {
    setEditing(plan);
    setForm({
      name: plan.name,
      maxStudents: plan.maxStudents,
      maxStaff: plan.maxStaff,
      maxStorageMb: plan.maxStorageMb,
      priceMonthly: Number(plan.priceMonthly),
      priceYearly: Number(plan.priceYearly),
      features: Array.isArray(plan.features) ? plan.features : [],
      isActive: plan.isActive,
    });
    setFeatureInput("");
    setOpen(true);
  }

  function addFeature() {
    const trimmed = featureInput.trim();
    if (trimmed && !form.features.includes(trimmed)) {
      setForm({ ...form, features: [...form.features, trimmed] });
      setFeatureInput("");
    }
  }

  function removeFeature(f: string) {
    setForm({ ...form, features: form.features.filter((x) => x !== f) });
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Plan name is required");
      return;
    }

    if (editing) {
      const result = await updateSubscriptionPlan(editing.id, {
        ...form,
        priceMonthly: Number(form.priceMonthly),
        priceYearly: Number(form.priceYearly),
      });
      if (result.success) {
        toast.success("Plan updated");
        setOpen(false);
        router.refresh();
      }
    } else {
      const result = await createSubscriptionPlan({
        ...form,
        priceMonthly: Number(form.priceMonthly),
        priceYearly: Number(form.priceYearly),
      });
      if (result.success) {
        toast.success("Plan created");
        setOpen(false);
        router.refresh();
      }
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteSubscriptionPlan(id);
    if (result.success) {
      toast.success("Plan deleted");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete plan");
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className={cn(buttonVariants())} onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Add Plan
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Plan" : "Create Plan"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. BASIC" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Max Students</Label>
                  <Input type="number" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label>Max Staff</Label>
                  <Input type="number" value={form.maxStaff} onChange={(e) => setForm({ ...form, maxStaff: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Price Monthly (₹)</Label>
                  <Input type="number" step="0.01" value={form.priceMonthly} onChange={(e) => setForm({ ...form, priceMonthly: Number(e.target.value) })} />
                </div>
                <div className="grid gap-2">
                  <Label>Price Yearly (₹)</Label>
                  <Input type="number" step="0.01" value={form.priceYearly} onChange={(e) => setForm({ ...form, priceYearly: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Storage (MB)</Label>
                <Input type="number" value={form.maxStorageMb} onChange={(e) => setForm({ ...form, maxStorageMb: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Features</Label>
                <div className="flex gap-2">
                  <Input
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                    placeholder="Add a feature and press Enter"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addFeature}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {form.features.map((f) => (
                    <Badge key={f} variant="secondary" className="cursor-pointer" onClick={() => removeFeature(f)}>
                      {f} ×
                    </Badge>
                  ))}
                </div>
              </div>
              {editing && (
                <div className="flex items-center gap-2">
                  <Switch checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked })} />
                  <Label>Active</Label>
                </div>
              )}
              <Button onClick={handleSubmit}>{editing ? "Update" : "Create"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={!plan.isActive ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex gap-1">
                  {!plan.isActive && <Badge variant="secondary">Inactive</Badge>}
                </div>
              </div>
              <p className="text-2xl font-bold">
                ₹{Number(plan.priceMonthly).toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">/mo</span>
              </p>
              <p className="text-sm text-muted-foreground">
                ₹{Number(plan.priceYearly).toLocaleString()}/year
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span>{plan.maxStudents} Students</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{plan.maxStaff} Staff</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span>{(plan.maxStorageMb / 1024).toFixed(1)} GB Storage</span>
              </div>
              {Array.isArray(plan.features) && plan.features.length > 0 && (
                <div className="space-y-1 pt-2 border-t">
                  {plan.features.map((f: string) => (
                    <div key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-3.5 w-3.5 text-green-600" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => openEdit(plan)}>
                <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {plan.name} plan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. Tenants on this plan will not be affected.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(plan.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
