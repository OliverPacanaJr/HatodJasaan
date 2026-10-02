'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
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
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { must, requireSignedIn, saveProfile, uploadDocument } from '@/lib/registration';
import { SignupSetupWarning, SETUP_BLOCKED_MESSAGE, useEmailConfirmationOn } from '@/components/auth/signup-setup-warning';

export default function RiderRegisterPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const confirmationOn = useEmailConfirmationOn();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    barangay: '',
    address: '',
    licenseNumber: '',
    motorcycleModel: '',
    motorcyclePlate: '',
  });

  const [files, setFiles] = useState<Record<string, File | null>>({
    drivers_license: null,
    motorcycle_photo: null,
    selfie: null,
    government_id: null,
  });

  const [previews, setPreviews] = useState<Record<string, string | null>>({
    drivers_license: null,
    motorcycle_photo: null,
    selfie: null,
    government_id: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileSelect = useCallback((type: string, file: File) => {
    setFiles((p) => ({ ...p, [type]: file }));
    setPreviews((p) => ({ ...p, [type]: URL.createObjectURL(file) }));
  }, []);

  const handleFileClear = useCallback((type: string) => {
    setFiles((p) => ({ ...p, [type]: null }));
    setPreviews((p) => ({ ...p, [type]: null }));
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (form.password.length < 8) e.password = 'Min. 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.phone.trim()) e.phone = 'Required';
    if (!form.barangay) e.barangay = 'Required';
    if (!form.address.trim()) e.address = 'Required';
    if (!form.licenseNumber.trim()) e.licenseNumber = 'Required';
    if (!form.motorcycleModel.trim()) e.motorcycleModel = 'Required';
    if (!form.motorcyclePlate.trim()) e.motorcyclePlate = 'Required';
    for (const doc of DOCUMENT_REQUIREMENTS.rider) {
      if (doc.required && !files[doc.type]) e[doc.type] = `${doc.label} is required`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (confirmationOn) {
      toast.error(SETUP_BLOCKED_MESSAGE);
      return;
    }
    setLoading(true);

    try {
      const { data: authData } = await must(
        'Creating account',
        supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.fullName, role: 'rider' },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
      );
      const userId = requireSignedIn(authData);

      await saveProfile(supabase, userId, {
        phone: form.phone,
        barangay: form.barangay,
        address: form.address,
      });

      await must(
        'Saving rider details',
        supabase.from('rider_profiles').insert({
          user_id: userId,
          license_number: form.licenseNumber,
          motorcycle_model: form.motorcycleModel,
          motorcycle_plate: form.motorcyclePlate,
        })
      );

      for (const [type, file] of Object.entries(files)) {
        if (!file) continue;
        const fileUrl = await uploadDocument(supabase, userId, type, file);
        await must(
          'Saving document record',
          supabase.from('user_documents').insert({
            user_id: userId,
            document_type: type,
            file_url: fileUrl,
            file_name: file.name,
          })
        );
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Registration failed:', err);
      toast.error(err.message || 'Registration failed.');
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
          <h2 className="text-xl font-bold text-slate-900 mb-2">Rider Application Submitted!</h2>
          <p className="text-slate-500 text-sm mb-2">Your account is ready. You can log in now.</p>
          <p className="text-slate-500 text-sm mb-6">An admin will review your documents and license. You&rsquo;ll be notified once approved.</p>
          <Link href="/auth/login"><Button variant="primary" className="w-full">Go to Login</Button></Link>
        </div>
      </div>
    );
  }

  const barangayOptions = BARANGAYS.map((b) => ({ value: b, label: b }));

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/auth/register" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <ArrowLeftIcon className="h-4 w-4" />Back
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <SignupSetupWarning show={confirmationOn} />
          <div className="bg-gradient-to-r from-slate-700 to-slate-900 px-6 py-6 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <TruckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Rider Registration</h1>
                <p className="text-white/80 text-sm">Apply to become a delivery rider</p>
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
                <Input id="email" label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} icon={<EnvelopeIcon className="h-5 w-5" />} />
                <Input id="phone" label="Phone" type="tel" placeholder="09XX XXX XXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} icon={<PhoneIcon className="h-5 w-5" />} />
                <Input id="password" label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} icon={<LockClosedIcon className="h-5 w-5" />} />
                <Input id="confirmPassword" label="Confirm Password" type="password" placeholder="Re-enter" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} error={errors.confirmPassword} icon={<LockClosedIcon className="h-5 w-5" />} />
                <Select id="barangay" label="Barangay" options={barangayOptions} placeholder="Select" value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} error={errors.barangay} />
                <Input id="address" label="Complete Address" placeholder="Street, Purok" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} error={errors.address} icon={<MapPinIcon className="h-5 w-5" />} />
              </div>
            </div>

            {/* Rider Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Motorcycle & License</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <Input id="licenseNumber" label="License Number" placeholder="N00-00-000000" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} error={errors.licenseNumber} icon={<IdentificationIcon className="h-5 w-5" />} />
                <Input id="motorcycleModel" label="Motorcycle Model" placeholder="e.g. Honda Click 125i" value={form.motorcycleModel} onChange={(e) => setForm({ ...form, motorcycleModel: e.target.value })} error={errors.motorcycleModel} />
                <Input id="motorcyclePlate" label="Plate Number" placeholder="e.g. 1234-AB" value={form.motorcyclePlate} onChange={(e) => setForm({ ...form, motorcyclePlate: e.target.value })} error={errors.motorcyclePlate} />
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-1">Verification Documents</h3>
              <p className="text-xs text-slate-500 mb-4">Upload clear photos for verification.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {DOCUMENT_REQUIREMENTS.rider.map((doc) => (
                  <FileUpload key={doc.type} label={doc.label} onFileSelect={(f) => handleFileSelect(doc.type, f)} preview={previews[doc.type]} onClear={() => handleFileClear(doc.type)} error={errors[doc.type]} />
                ))}
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" loading={loading} className="w-full" size="lg">Submit Application</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
