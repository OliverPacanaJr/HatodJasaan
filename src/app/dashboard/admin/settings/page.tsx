'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageSkeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

interface Settings {
  base_delivery_fee: string;
  per_km_fee: string;
  max_delivery_radius_km: string;
  platform_fee_percent: string;
  maintenance_mode: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('app_settings').select('*');
      if (data) {
        const map: Record<string, unknown> = {};
        data.forEach((row: { key: string; value: unknown }) => {
          let val = row.value;
          if (typeof val === 'string') {
            try { val = JSON.parse(val); } catch {}
          }
          map[row.key] = val;
        });
        setSettings({
          base_delivery_fee: String(map.base_delivery_fee ?? '25'),
          per_km_fee: String(map.per_km_fee ?? '5'),
          max_delivery_radius_km: String(map.max_delivery_radius_km ?? '10'),
          platform_fee_percent: String(map.platform_fee_percent ?? '5'),
          maintenance_mode: map.maintenance_mode === true || map.maintenance_mode === 'true',
        });
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const entries = [
      { key: 'base_delivery_fee', value: JSON.stringify(settings.base_delivery_fee) },
      { key: 'per_km_fee', value: JSON.stringify(settings.per_km_fee) },
      { key: 'max_delivery_radius_km', value: JSON.stringify(settings.max_delivery_radius_km) },
      { key: 'platform_fee_percent', value: JSON.stringify(settings.platform_fee_percent) },
      { key: 'maintenance_mode', value: JSON.stringify(settings.maintenance_mode) },
    ];

    for (const entry of entries) {
      await supabase.from('app_settings').update({ value: entry.value, updated_at: new Date().toISOString() }).eq('key', entry.key);
    }

    toast.success('Settings saved');
    setSaving(false);
  };

  if (loading || !settings) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure delivery fees, radius, and platform behavior</p>
      </div>

      <Card>
        <CardTitle>Delivery Fees</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <Input
            label="Base Delivery Fee (₱)"
            type="number"
            value={settings.base_delivery_fee}
            onChange={(e) => setSettings({ ...settings, base_delivery_fee: e.target.value })}
          />
          <Input
            label="Per Kilometer Fee (₱)"
            type="number"
            value={settings.per_km_fee}
            onChange={(e) => setSettings({ ...settings, per_km_fee: e.target.value })}
          />
          <Input
            label="Max Delivery Radius (km)"
            type="number"
            value={settings.max_delivery_radius_km}
            onChange={(e) => setSettings({ ...settings, max_delivery_radius_km: e.target.value })}
          />
          <Input
            label="Platform Fee (%)"
            type="number"
            value={settings.platform_fee_percent}
            onChange={(e) => setSettings({ ...settings, platform_fee_percent: e.target.value })}
          />
        </div>
      </Card>

      <Card>
        <CardTitle>System</CardTitle>
        <div className="mt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-brand-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Maintenance Mode</p>
              <p className="text-xs text-slate-500">When enabled, the platform is inaccessible to regular users</p>
            </div>
          </label>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
