'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { Skeleton } from '@/components/ui/skeleton';
import { BUSINESS_TYPES, PAYMENT_MODES } from '@/lib/constants';
import type { Business } from '@/lib/types';
import toast from 'react-hot-toast';

export default function BusinessSettings() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', business_type: 'carinderia', address: '', phone: '', email: '',
    opening_time: '06:00', closing_time: '21:00', min_order_amount: '0', avg_prep_time_mins: '30',
    payment_modes: ['cash'] as string[],
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const fetchBusiness = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase.from('businesses').select('*').eq('owner_id', profile.id).single();
    if (data) {
      setBusiness(data);
      setForm({
        name: data.name, description: data.description || '', business_type: data.business_type,
        address: data.address, phone: data.phone || '', email: data.email || '',
        opening_time: data.opening_time || '06:00', closing_time: data.closing_time || '21:00',
        min_order_amount: String(data.min_order_amount || 0), avg_prep_time_mins: String(data.avg_prep_time_mins || 30),
        payment_modes: data.payment_modes || ['cash'],
      });
      setLogoPreview(data.logo_url);
      setCoverPreview(data.cover_url);
    }
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => { fetchBusiness(); }, [fetchBusiness]);

  const togglePaymentMode = (mode: string) => {
    setForm(f => ({
      ...f,
      payment_modes: f.payment_modes.includes(mode) ? f.payment_modes.filter(m => m !== mode) : [...f.payment_modes, mode],
    }));
  };

  const handleSave = async () => {
    if (!business) return;
    setSaving(true);
    let logo_url = business.logo_url;
    let cover_url = business.cover_url;

    if (logoFile) {
      const path = `${business.id}/logo-${Date.now()}.${logoFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('businesses').upload(path, logoFile);
      if (!error) logo_url = supabase.storage.from('businesses').getPublicUrl(path).data.publicUrl;
    }
    if (coverFile) {
      const path = `${business.id}/cover-${Date.now()}.${coverFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('businesses').upload(path, coverFile);
      if (!error) cover_url = supabase.storage.from('businesses').getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase.from('businesses').update({
      name: form.name, description: form.description || null, business_type: form.business_type as any,
      address: form.address, phone: form.phone || null, email: form.email || null,
      opening_time: form.opening_time, closing_time: form.closing_time,
      min_order_amount: parseFloat(form.min_order_amount) || 0,
      avg_prep_time_mins: parseInt(form.avg_prep_time_mins) || 30,
      payment_modes: form.payment_modes, logo_url, cover_url,
    }).eq('id', business.id);

    setSaving(false);
    if (error) { toast.error('Failed to save settings'); return; }
    toast.success('Settings saved successfully');
    fetchBusiness();
  };

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-48" />{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>;

  if (!business) return <p className="text-slate-500">No business registered.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Business Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Update your business information and preferences</p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
        <div className="space-y-4">
          <Input label="Business Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe your business" />
          <div>
            <label className="label-field">Business Type</label>
            <select className="input-field" value={form.business_type} onChange={e => setForm(f => ({ ...f, business_type: e.target.value }))}>
              {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Operating Hours & Settings</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Opening Time" type="time" value={form.opening_time} onChange={e => setForm(f => ({ ...f, opening_time: e.target.value }))} />
            <Input label="Closing Time" type="time" value={form.closing_time} onChange={e => setForm(f => ({ ...f, closing_time: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Minimum Order Amount (PHP)" type="number" min="0" value={form.min_order_amount} onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))} />
            <Input label="Avg. Prep Time (minutes)" type="number" min="1" value={form.avg_prep_time_mins} onChange={e => setForm(f => ({ ...f, avg_prep_time_mins: e.target.value }))} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Accepted Payment Modes</h2>
        <div className="space-y-3">
          {PAYMENT_MODES.map(mode => (
            <label key={mode.value} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
              <input type="checkbox" checked={form.payment_modes.includes(mode.value)} onChange={() => togglePaymentMode(mode.value)} className="rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
              <span className="text-sm font-medium text-slate-700">{mode.label}</span>
              {mode.value === 'cash' && <span className="text-xs text-slate-400 ml-auto">Required for delivery fee</span>}
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Branding</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FileUpload label="Logo" preview={logoPreview} onFileSelect={f => { setLogoFile(f); setLogoPreview(URL.createObjectURL(f)); }} onClear={() => { setLogoFile(null); setLogoPreview(business.logo_url); }} />
          <FileUpload label="Cover Photo" preview={coverPreview} onFileSelect={f => { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }} onClear={() => { setCoverFile(null); setCoverPreview(business.cover_url); }} />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg">Save Changes</Button>
      </div>
    </div>
  );
}
