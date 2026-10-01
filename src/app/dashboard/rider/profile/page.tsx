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
import { StarRating } from '@/components/ui/star-rating';
import { getApprovalStatusColor } from '@/lib/utils';
import type { RiderProfile, UserDocument } from '@/lib/types';
import toast from 'react-hot-toast';

export default function RiderProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', address: '' });
  const [riderForm, setRiderForm] = useState({ license_number: '', motorcycle_model: '', motorcycle_plate: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    setForm({ full_name: profile.full_name, phone: profile.phone || '', address: profile.address || '' });
    setAvatarPreview(profile.avatar_url);

    const [rpRes, docsRes] = await Promise.all([
      supabase.from('rider_profiles').select('*').eq('user_id', profile.id).single(),
      supabase.from('user_documents').select('*').eq('user_id', profile.id),
    ]);
    if (rpRes.data) {
      setRiderProfile(rpRes.data);
      setRiderForm({
        license_number: rpRes.data.license_number || '',
        motorcycle_model: rpRes.data.motorcycle_model || '',
        motorcycle_plate: rpRes.data.motorcycle_plate || '',
      });
    }
    setDocuments(docsRes.data || []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleAvailability = async () => {
    if (!riderProfile) return;
    const { error } = await supabase.from('rider_profiles').update({ is_available: !riderProfile.is_available }).eq('user_id', profile!.id);
    if (error) { toast.error('Failed to update'); return; }
    setRiderProfile({ ...riderProfile, is_available: !riderProfile.is_available });
    toast.success(riderProfile.is_available ? 'You are now offline' : 'You are now available');
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    let avatar_url = profile.avatar_url;
    if (avatarFile) {
      const path = `${profile.id}/avatar-${Date.now()}.${avatarFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('avatars').upload(path, avatarFile);
      if (!error) avatar_url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    }
    await supabase.from('profiles').update({
      full_name: form.full_name, phone: form.phone || null, address: form.address || null, avatar_url,
    }).eq('id', profile.id);

    if (riderProfile) {
      await supabase.from('rider_profiles').update({
        license_number: riderForm.license_number || null,
        motorcycle_model: riderForm.motorcycle_model || null,
        motorcycle_plate: riderForm.motorcycle_plate || null,
      }).eq('user_id', profile.id);
    }

    setSaving(false);
    toast.success('Profile updated');
    refreshProfile();
  };

  if (loading) return <div className="space-y-6 max-w-2xl"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 rounded-2xl" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Rider Profile</h1>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Status</h2>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${getApprovalStatusColor(profile?.status || 'pending')}`}>
              Account: {profile?.status}
            </span>
          </div>
          <Button variant={riderProfile?.is_available ? 'primary' : 'secondary'} size="sm" onClick={toggleAvailability}>
            {riderProfile?.is_available ? '🟢 Available' : '🔴 Offline'}
          </Button>
        </div>
        {riderProfile && (
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{riderProfile.total_deliveries}</p>
              <p className="text-xs text-slate-500">Deliveries</p>
            </div>
            <div className="text-center">
              <StarRating rating={Number(riderProfile.rating)} size="sm" showValue />
              <p className="text-xs text-slate-500 mt-1">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{riderProfile.total_ratings}</p>
              <p className="text-xs text-slate-500">Reviews</p>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar src={avatarPreview} name={form.full_name || 'R'} size="xl" />
            <FileUpload label="Change Avatar" preview={null} onFileSelect={f => { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }} hint="JPG or PNG, max 5MB" />
          </div>
          <Input label="Full Name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          <Input label="Phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Vehicle Information</h2>
        <div className="space-y-4">
          <Input label="License Number" value={riderForm.license_number} onChange={e => setRiderForm(f => ({ ...f, license_number: e.target.value }))} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Motorcycle Model" value={riderForm.motorcycle_model} onChange={e => setRiderForm(f => ({ ...f, motorcycle_model: e.target.value }))} />
            <Input label="Plate Number" value={riderForm.motorcycle_plate} onChange={e => setRiderForm(f => ({ ...f, motorcycle_plate: e.target.value }))} />
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

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg">Save Profile</Button>
      </div>
    </div>
  );
}
