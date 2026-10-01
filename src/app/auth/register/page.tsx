'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  UserIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

const roles = [
  {
    id: 'customer',
    title: 'Customer',
    description: 'Order food & goods from local eateries and businesses in Jasaan. Browse menus, place orders, and get it delivered.',
    icon: UserIcon,
    href: '/auth/register/customer',
    color: 'from-brand-500 to-brand-600',
    bgLight: 'bg-brand-50',
    textColor: 'text-brand-600',
  },
  {
    id: 'business',
    title: 'Business Owner',
    description: 'Register your karinderya, lechon manok, bakery, or any local business. Reach more customers and grow your sales.',
    icon: BuildingStorefrontIcon,
    href: '/auth/register/business',
    color: 'from-accent-500 to-accent-600',
    bgLight: 'bg-accent-50',
    textColor: 'text-accent-600',
  },
  {
    id: 'rider',
    title: 'Delivery Rider',
    description: 'Earn money by delivering orders around Jasaan. Flexible hours, fair pay. All you need is a motorcycle.',
    icon: TruckIcon,
    href: '/auth/register/rider',
    color: 'from-slate-700 to-slate-900',
    bgLight: 'bg-slate-100',
    textColor: 'text-slate-700',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-3xl">
        {/* Back link */}
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to login
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
              <TruckIcon className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">
              Hatod<span className="text-brand-500">Jasaan</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 mt-2">Choose how you want to use HatodJasaan</p>
        </div>

        {/* Role cards */}
        <div className="grid sm:grid-cols-3 gap-5">
          {roles.map((role, i) => (
            <motion.div key={role.id} initial="hidden" animate="visible" variants={fadeUp} custom={i}>
              <Link
                href={role.href}
                className="group block bg-white rounded-2xl border border-slate-200 p-6 text-center hover:shadow-xl hover:border-brand-300 hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className={`inline-flex items-center justify-center h-14 w-14 rounded-2xl ${role.bgLight} ${role.textColor} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <role.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{role.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{role.description}</p>
                <div className={`mt-5 inline-flex items-center justify-center w-full py-2.5 rounded-xl bg-gradient-to-r ${role.color} text-white text-sm font-semibold opacity-90 group-hover:opacity-100 transition-opacity`}>
                  Register as {role.title}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-600 hover:text-brand-700 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
