'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FileUpload } from '@/components/ui/file-upload';
import { Skeleton } from '@/components/ui/skeleton';
import { getApprovalStatusColor } from '@/lib/utils';
import type { Business, BusinessDocument } from '@/lib/types';
import toast from 'react-hot-toast';

export default function BusinessProfile() {
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const [business, setBusiness] = useState<Business | null>(null);
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', address: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setForm({ full_name: profile.full_name, phone: profile.phone || '', address: profile.address || '' });
    setAvatarPreview(profile.avatar_url);

    const [bizRes, docsRes] = await Promise.all([
      supabase.from('businesses').select('*').eq('owner_id', profile.id).single(),
      supabase.from('business_documents').select('*').eq('business_id', (await supabase.from('businesses').select('id').eq('owner_id', profile.id).single()).data?.id || ''),
    ]);
    setBusiness(bizRes.data);
    setDocuments(docsRes.data || []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    let avatar_url = profile.avatar_url;
    if (avatarFile) {
      const path = `${profile.id}/avatar-${Date.now()}.${avatarFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('avatars').upload(path, avatarFile);
      if (!error) avatar_url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name, phone: form.phone || null, address: form.address || null, avatar_url,
    }).eq('id', profile.id);
    setSaving(false);
    if (error) { toast.error('Failed to update profile'); return; }
    toast.success('Profile updated');
    refreshProfile();
  };

  if (loading) return <div className="space-y-6 max-w-2xl"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-2xl" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>

      {business && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Business Status</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getApprovalStatusColor(business.status)}`}>
              {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            {business.status === 'pending' && 'Your business is awaiting admin approval. You will be notified once reviewed.'}
            {business.status === 'approved' && 'Your business is approved and visible to customers.'}
            {business.status === 'rejected' && 'Your business application was not approved. Contact support for details.'}
            {business.status === 'suspended' && 'Your business has been temporarily suspended. Contact support.'}
          </p>
        </Card>
      )}

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar src={avatarPreview} name={form.full_name || 'U'} size="xl" />
            <FileUpload
              label="Change Avatar"
              preview={null}
              onFileSelect={f => { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }}
              hint="JPG or PNG, max 5MB"
            />
          </div>
          <Input label="Full Name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          <Input label="Phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} loading={saving}>Save Profile</Button>
          </div>
        </div>
      </Card>

      {documents.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Submitted Documents</h2>
          <div className="space-y-3">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-900 capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-500">{doc.file_name || 'Document'}</p>
                </div>
                <Badge variant={doc.verified ? 'success' : 'warning'}>{doc.verified ? 'Verified' : 'Pending'}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
