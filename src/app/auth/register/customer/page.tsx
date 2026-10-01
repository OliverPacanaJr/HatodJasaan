'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FileUpload } from '@/components/ui/file-upload';
import { BARANGAYS, DOCUMENT_REQUIREMENTS } from '@/lib/constants';
import {
  ArrowLeftIcon,
  TruckIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function CustomerRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    barangay: '',
    address: '',
  });

  const [files, setFiles] = useState<Record<string, File | null>>({
    government_id: null,
    residency_proof: null,
    selfie: null,
  });

  const [previews, setPreviews] = useState<Record<string, string | null>>({
    government_id: null,
    residency_proof: null,
    selfie: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileSelect = useCallback((type: string, file: File) => {
    setFiles((prev) => ({ ...prev, [type]: file }));
    setPreviews((prev) => ({ ...prev, [type]: URL.createObjectURL(file) }));
  }, []);

  const handleFileClear = useCallback((type: string) => {
    setFiles((prev) => ({ ...prev, [type]: null }));
    setPreviews((prev) => ({ ...prev, [type]: null }));
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.barangay) e.barangay = 'Select your barangay';
    if (!form.address.trim()) e.address = 'Address is required';

    for (const doc of DOCUMENT_REQUIREMENTS.customer) {
      if (doc.required && !files[doc.type]) {
        e[doc.type] = `${doc.label} is required`;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName, role: 'customer' },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration failed');

      const userId = authData.user.id;

      // Update profile
      await supabase.from('profiles').update({
        phone: form.phone,
        barangay: form.barangay,
        address: form.address,
      }).eq('id', userId);

      // Upload documents
      for (const [type, file] of Object.entries(files)) {
        if (!file) continue;
        const ext = file.name.split('.').pop();
        const path = `${userId}/${type}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);

        await supabase.from('user_documents').insert({
          user_id: userId,
          document_type: type,
          file_url: urlData.publicUrl,
          file_name: file.name,
        });
      }

      setSuccess(true);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 mb-4">
            <CheckCircleIcon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Registration Submitted!</h2>
          <p className="text-slate-500 text-sm mb-2">
            Please check your email to verify your account.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            An admin will review your documents and approve your account. You&rsquo;ll be notified once approved.
          </p>
          <Link href="/auth/login">
            <Button variant="primary" className="w-full">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const barangayOptions = BARANGAYS.map((b) => ({ value: b, label: b }));

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/auth/register" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-6 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Customer Registration</h1>
                <p className="text-white/80 text-sm">Create your account to start ordering</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {/* Personal Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Personal Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Input id="fullName" label="Full Name" placeholder="Juan Dela Cruz" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} error={errors.fullName} icon={<UserIcon className="h-5 w-5" />} />
                </div>
                <Input id="email" label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} icon={<EnvelopeIcon className="h-5 w-5" />} />
                <Input id="phone" label="Phone Number" type="tel" placeholder="09XX XXX XXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} icon={<PhoneIcon className="h-5 w-5" />} />
                <Input id="password" label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} icon={<LockClosedIcon className="h-5 w-5" />} />
                <Input id="confirmPassword" label="Confirm Password" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} error={errors.confirmPassword} icon={<LockClosedIcon className="h-5 w-5" />} />
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Address</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <Select id="barangay" label="Barangay" options={barangayOptions} placeholder="Select your barangay" value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} error={errors.barangay} />
                <Input id="address" label="Complete Address" placeholder="House/Lot, Street, Purok" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} error={errors.address} icon={<MapPinIcon className="h-5 w-5" />} />
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-1">Verification Documents</h3>
              <p className="text-xs text-slate-500 mb-4">Upload clear photos for account verification.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {DOCUMENT_REQUIREMENTS.customer.map((doc) => (
                  <FileUpload
                    key={doc.type}
                    label={doc.label}
                    onFileSelect={(f) => handleFileSelect(doc.type, f)}
                    preview={previews[doc.type]}
                    onClear={() => handleFileClear(doc.type)}
                    error={errors[doc.type]}
                    hint="PNG, JPG up to 5MB"
                  />
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Create Account
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
