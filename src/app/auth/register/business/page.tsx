'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { BARANGAYS, BUSINESS_TYPES, DOCUMENT_REQUIREMENTS } from '@/lib/constants';
import {
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { must, requireSignedIn, saveProfile, uploadDocument } from '@/lib/registration';
import { SignupSetupWarning, SETUP_BLOCKED_MESSAGE, useEmailConfirmationOn } from '@/components/auth/signup-setup-warning';

const STEPS = ['Personal Info', 'Business Details', 'Documents'];

export default function BusinessRegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const confirmationOn = useEmailConfirmationOn();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    businessName: '',
    businessType: 'carinderia',
    description: '',
    businessAddress: '',
    barangay: '',
    businessPhone: '',
  });

  const [files, setFiles] = useState<Record<string, File | null>>({
    business_permit: null,
    barangay_clearance: null,
    store_photo: null,
    government_id: null,
  });

  const [previews, setPreviews] = useState<Record<string, string | null>>({
    business_permit: null,
    barangay_clearance: null,
    store_photo: null,
    government_id: null,
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

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.fullName.trim()) e.fullName = 'Required';
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
      if (form.password.length < 8) e.password = 'Min. 8 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
      if (!form.phone.trim()) e.phone = 'Required';
    }
    if (s === 1) {
      if (!form.businessName.trim()) e.businessName = 'Required';
      if (!form.businessAddress.trim()) e.businessAddress = 'Required';
      if (!form.barangay) e.barangay = 'Required';
    }
    if (s === 2) {
      for (const doc of DOCUMENT_REQUIREMENTS.business) {
        if (doc.required && !files[doc.type]) e[doc.type] = `${doc.label} is required`;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => { if (validateStep(step)) setStep((s) => Math.min(s + 1, 2)); };
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(2)) return;
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
            data: { full_name: form.fullName, role: 'business' },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
      );
      const userId = requireSignedIn(authData);

      await saveProfile(supabase, userId, {
        phone: form.phone,
        barangay: form.barangay,
        address: form.businessAddress,
      });

      const slug = slugify(form.businessName) + '-' + Date.now().toString(36);
      const { data: bizData } = await must(
        'Creating business',
        supabase.from('businesses').insert({
          owner_id: userId,
          name: form.businessName,
          slug,
          description: form.description,
          business_type: form.businessType,
          phone: form.businessPhone || form.phone,
          email: form.email,
          address: form.businessAddress,
          barangay: form.barangay,
        }).select('id').single()
      );
      if (!bizData) throw new Error('Creating business: nothing was returned');

      for (const [type, file] of Object.entries(files)) {
        if (!file) continue;
        const fileUrl = await uploadDocument(supabase, userId, type, file);
        const record = { document_type: type, file_url: fileUrl, file_name: file.name };
        if (type === 'government_id') {
          await must('Saving document record', supabase.from('user_documents').insert({ user_id: userId, ...record }));
        } else {
          await must('Saving document record', supabase.from('business_documents').insert({ business_id: bizData.id, ...record }));
        }
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
          <h2 className="text-xl font-bold text-slate-900 mb-2">Business Registration Submitted!</h2>
          <p className="text-slate-500 text-sm mb-2">Your account is ready. You can log in now.</p>
          <p className="text-slate-500 text-sm mb-6">An admin will review your business documents. You&rsquo;ll be notified once approved.</p>
          <Link href="/auth/login"><Button variant="primary" className="w-full">Go to Login</Button></Link>
        </div>
      </div>
    );
  }

  const barangayOptions = BARANGAYS.map((b) => ({ value: b, label: b }));
  const businessTypeOptions = BUSINESS_TYPES.map((t) => ({ value: t.value, label: t.label }));

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/auth/register" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <ArrowLeftIcon className="h-4 w-4" />Back
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <SignupSetupWarning show={confirmationOn} />
          <div className="bg-gradient-to-r from-accent-500 to-accent-600 px-6 py-6 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <BuildingStorefrontIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Business Registration</h1>
                <p className="text-white/80 text-sm">Register your business to start receiving orders</p>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="px-6 sm:px-8 pt-6">
            <div className="flex items-center gap-2">
              {STEPS.map((label, i) => (
                <div key={label} className="flex-1">
                  <div className={`h-1.5 rounded-full transition-colors ${i <= step ? 'bg-accent-500' : 'bg-slate-200'}`} />
                  <p className={`text-xs mt-1.5 ${i <= step ? 'text-accent-600 font-medium' : 'text-slate-400'}`}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {step === 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Personal Information</h3>
                <Input id="fullName" label="Full Name" placeholder="Juan Dela Cruz" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} error={errors.fullName} icon={<UserIcon className="h-5 w-5" />} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input id="email" label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} icon={<EnvelopeIcon className="h-5 w-5" />} />
                  <Input id="phone" label="Phone" type="tel" placeholder="09XX XXX XXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={errors.phone} icon={<PhoneIcon className="h-5 w-5" />} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input id="password" label="Password" type="password" placeholder="Min. 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} icon={<LockClosedIcon className="h-5 w-5" />} />
                  <Input id="confirmPassword" label="Confirm Password" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} error={errors.confirmPassword} icon={<LockClosedIcon className="h-5 w-5" />} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Business Details</h3>
                <Input id="businessName" label="Business Name" placeholder="e.g. Maria's Karinderya" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} error={errors.businessName} icon={<BuildingStorefrontIcon className="h-5 w-5" />} />
                <Select id="businessType" label="Business Type" options={businessTypeOptions} value={form.businessType} onChange={(e) => setForm({ ...form, businessType: e.target.value })} />
                <Textarea id="description" label="Description (optional)" placeholder="Tell customers about your business..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Select id="barangay" label="Barangay" options={barangayOptions} placeholder="Select barangay" value={form.barangay} onChange={(e) => setForm({ ...form, barangay: e.target.value })} error={errors.barangay} />
                  <Input id="businessAddress" label="Complete Address" placeholder="Street, Purok" value={form.businessAddress} onChange={(e) => setForm({ ...form, businessAddress: e.target.value })} error={errors.businessAddress} icon={<MapPinIcon className="h-5 w-5" />} />
                </div>
                <Input id="businessPhone" label="Business Phone (optional)" type="tel" placeholder="Different from personal phone?" value={form.businessPhone} onChange={(e) => setForm({ ...form, businessPhone: e.target.value })} icon={<PhoneIcon className="h-5 w-5" />} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-1">Verification Documents</h3>
                <p className="text-xs text-slate-500 mb-3">Upload clear photos of the required documents.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {DOCUMENT_REQUIREMENTS.business.map((doc) => (
                    <FileUpload key={doc.type} label={doc.label} onFileSelect={(f) => handleFileSelect(doc.type, f)} preview={previews[doc.type]} onClear={() => handleFileClear(doc.type)} error={errors[doc.type]} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              {step > 0 ? (
                <Button type="button" variant="secondary" onClick={prevStep}>Back</Button>
              ) : <div />}
              {step < 2 ? (
                <Button type="button" onClick={nextStep}>
                  Continue <ArrowRightIcon className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" loading={loading}>Submit Registration</Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
