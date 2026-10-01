'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnvelopeIcon, ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Enter your email address.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <ArrowLeftIcon className="h-4 w-4" />Back to login
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {sent ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-brand-100 text-brand-600 mb-4">
                <PaperAirplaneIcon className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
              <p className="text-sm text-slate-500 mb-6">
                We sent a password reset link to <strong className="text-slate-700">{email}</strong>. Click the link in the email to reset your password.
              </p>
              <Link href="/auth/login"><Button variant="secondary" className="w-full">Back to Login</Button></Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900">Reset your password</h1>
                <p className="text-sm text-slate-500 mt-1">Enter the email address associated with your account.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input id="email" label="Email address" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} icon={<EnvelopeIcon className="h-5 w-5" />} required />
                <Button type="submit" loading={loading} className="w-full" size="lg">Send Reset Link</Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
