"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateGlobalSettings } from "@/actions/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  isActive: boolean;
}

export function SettingsClient({
  settings,
  plans,
}: {
  settings: Record<string, unknown>;
  plans: Plan[];
}) {
  const [form, setForm] = useState({
    platform_name: (settings.platform_name as string) || "SkolMatrixa",
    maintenance_mode: (settings.maintenance_mode as boolean) || false,
    default_plan: (settings.default_plan as string) || "FREE",
    support_email: (settings.support_email as string) || "",
    max_login_attempts: Number(settings.max_login_attempts) || 5,
    session_timeout_hours: Number(settings.session_timeout_hours) || 24,
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const result = await updateGlobalSettings(form);
      if (result.success) {
        toast.success("Settings saved");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Platform Name</Label>
            <Input
              value={form.platform_name}
              onChange={(e) => setForm({ ...form, platform_name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label>Support Email</Label>
            <Input
              type="email"
              value={form.support_email}
              onChange={(e) => setForm({ ...form, support_email: e.target.value })}
              placeholder="support@skolmatrixa.com"
            />
          </div>
          <div className="grid gap-2">
            <Label>Default Plan for New Tenants</Label>
            <Select value={form.default_plan} onValueChange={(v) => v && setForm({ ...form, default_plan: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plans
                  .filter((p) => p.isActive)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Max Login Attempts</Label>
              <Input
                type="number"
                value={form.max_login_attempts}
                onChange={(e) => setForm({ ...form, max_login_attempts: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Session Timeout (hours)</Label>
              <Input
                type="number"
                value={form.session_timeout_hours}
                onChange={(e) => setForm({ ...form, session_timeout_hours: Number(e.target.value) })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">
                When enabled, only Super Admins can access the platform
              </p>
            </div>
            <Switch
              checked={form.maintenance_mode}
              onCheckedChange={(checked) => setForm({ ...form, maintenance_mode: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-fit">
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
