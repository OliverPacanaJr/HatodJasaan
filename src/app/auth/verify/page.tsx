'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EnvelopeOpenIcon } from '@heroicons/react/24/outline';

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-brand-100 text-brand-600 mb-4">
          <EnvelopeOpenIcon className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Verify your email</h2>
        <p className="text-sm text-slate-500 mb-6">
          We&rsquo;ve sent a verification link to your email address. Please check your inbox (and spam folder) and click the link to activate your account.
        </p>
        <Link href="/auth/login">
          <Button variant="primary" className="w-full">Go to Login</Button>
        </Link>
      </div>
    </div>
  );
}
