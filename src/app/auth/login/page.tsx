'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TruckIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success('Welcome back!');
    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative items-center justify-center p-12">
        <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-10" />
        <div className="relative text-white max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <TruckIcon className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold">HatodJasaan</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Ihatod sa imong pultahan!
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            Order from your favorite local eateries in Jasaan — delivered fast by your neighbors, at the lowest fees.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
              <TruckIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">
              Hatod<span className="text-brand-500">Jasaan</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              id="email"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<EnvelopeIcon className="h-5 w-5" />}
              autoComplete="email"
              required
            />

            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<LockClosedIcon className="h-5 w-5" />}
              autoComplete="current-password"
              required
            />

            <div className="flex items-center justify-end">
              <Link href="/auth/forgot-password" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign In
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don&rsquo;t have an account?{' '}
            <Link href="/auth/register" className="text-brand-600 hover:text-brand-700 font-semibold">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
