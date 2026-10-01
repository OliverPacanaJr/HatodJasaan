'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  TruckIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  BoltIcon,
  HeartIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const steps = [
  {
    icon: MagnifyingGlassIcon,
    title: 'Browse',
    desc: 'Explore local karinderyas, lechon manok, bakeries, and more in Jasaan.',
  },
  {
    icon: ShoppingBagIcon,
    title: 'Order',
    desc: 'Pick your favorite dishes, add to cart, and place your order in seconds.',
  },
  {
    icon: TruckIcon,
    title: 'Receive',
    desc: 'A local rider picks it up and delivers straight to your doorstep.',
  },
];

const features = [
  {
    icon: CurrencyDollarIcon,
    title: 'Lowest Fees',
    desc: 'Way cheaper than big delivery apps. Keep more money in the community.',
  },
  {
    icon: MapPinIcon,
    title: 'Hyper-Local',
    desc: 'Built exclusively for Jasaan, Misamis Oriental. We know every barangay.',
  },
  {
    icon: BoltIcon,
    title: 'Fast Delivery',
    desc: 'Local riders mean faster pickups and shorter routes to your door.',
  },
  {
    icon: HeartIcon,
    title: 'Support Local',
    desc: 'Every order supports a Jasaan family business and a local rider.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Verified & Safe',
    desc: 'All businesses and riders are verified with IDs and documents.',
  },
  {
    icon: ClockIcon,
    title: 'Real-Time Tracking',
    desc: 'Track your order from preparation to delivery, every step of the way.',
  },
];

const stats = [
  { value: '14+', label: 'Barangays Served' },
  { value: '₱25', label: 'Starting Delivery Fee' },
  { value: '30min', label: 'Avg. Delivery Time' },
  { value: '100%', label: 'Local Riders' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-sm">
                <TruckIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                Hatod<span className="text-brand-500">Jasaan</span>
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How It Works</a>
              <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
              <a href="#join" className="hover:text-brand-600 transition-colors">Join Us</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-sm font-semibold text-slate-700 hover:text-brand-600 transition-colors px-3 py-2">
                Log In
              </Link>
              <Link href="/auth/register" className="btn-primary text-sm !px-5 !py-2.5 !rounded-xl">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-[0.03]" />
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-brand-200 rounded-full blur-[128px] opacity-30" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-200 rounded-full blur-[128px] opacity-20" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium mb-6">
              <MapPinIcon className="h-4 w-4" />
              Jasaan, Misamis Oriental
            </motion.div>

            <motion.h1 variants={fadeUp} custom={1} className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              Ihatod sa imong{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-600">
                pultahan!
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              The local delivery platform for Jasaan. Order from your favorite karinderya, lechon manok, bakery, and more — delivered by local riders at the lowest fees.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/browse" className="btn-primary text-base !px-8 !py-4 !rounded-2xl shadow-lg shadow-brand-500/25 hover:shadow-xl hover:shadow-brand-500/30">
                <MagnifyingGlassIcon className="h-5 w-5" />
                Browse Eateries
              </Link>
              <Link href="/auth/register" className="btn-secondary text-base !px-8 !py-4 !rounded-2xl">
                Create Account
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} custom={4} className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-brand-600 uppercase tracking-wider">
              Simple & Easy
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2">
              How It Works
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-slate-600 mt-3 max-w-xl mx-auto">
              Getting your favorite food delivered is as easy as 1-2-3.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeUp}
                custom={i}
                className="relative bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center group hover:shadow-lg hover:border-brand-200 transition-all duration-300"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-brand-500 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-brand-500/30">
                  {i + 1}
                </div>
                <div className="mt-4 mb-4 inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-brand-50 text-brand-600 group-hover:bg-brand-100 transition-colors">
                  <step.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-brand-600 uppercase tracking-wider">
              Why HatodJasaan
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold text-slate-900 mt-2">
              Built for Jasaan, by Jasaan
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-slate-600 mt-3 max-w-xl mx-auto">
              We&rsquo;re not a big corporation. We&rsquo;re your neighbors building something that works for our town.
            </motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={fadeUp}
                custom={i}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-300"
              >
                <div className="h-11 w-11 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                  <feat.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">{feat.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Join Us CTA */}
      <section id="join" className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* For Businesses */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
              custom={0}
              className="relative bg-gradient-to-br from-brand-500 to-brand-600 rounded-3xl p-8 sm:p-10 text-white overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <BuildingStorefrontIcon className="h-10 w-10 mb-4 opacity-90" />
              <h3 className="text-2xl font-bold mb-2">Own a Business?</h3>
              <p className="text-white/80 mb-6 leading-relaxed">
                Register your karinderya, lechon manok, bakery, or any local business.
                Reach more customers without the heavy fees of big platforms.
              </p>
              <Link href="/auth/register/business" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-600 font-semibold rounded-xl hover:bg-brand-50 transition-colors shadow-lg">
                Register Your Business
              </Link>
            </motion.div>

            {/* For Riders */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeUp}
              custom={1}
              className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 sm:p-10 text-white overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <TruckIcon className="h-10 w-10 mb-4 opacity-90" />
              <h3 className="text-2xl font-bold mb-2">Become a Rider</h3>
              <p className="text-white/70 mb-6 leading-relaxed">
                Earn money delivering in your own barangay. Flexible hours, fair pay.
                All you need is a motorcycle and a valid license.
              </p>
              <Link href="/auth/register/rider" className="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 text-white font-semibold rounded-xl hover:bg-accent-600 transition-colors shadow-lg">
                Apply as Rider
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                  <TruckIcon className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-lg font-bold text-slate-900">HatodJasaan</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">
                The local delivery platform for Jasaan, Misamis Oriental. Supporting local businesses and riders.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Platform</h4>
              <div className="space-y-2">
                <Link href="/browse" className="block text-sm text-slate-500 hover:text-brand-600 transition-colors">Browse Eateries</Link>
                <Link href="/auth/register/business" className="block text-sm text-slate-500 hover:text-brand-600 transition-colors">Register Business</Link>
                <Link href="/auth/register/rider" className="block text-sm text-slate-500 hover:text-brand-600 transition-colors">Become a Rider</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Account</h4>
              <div className="space-y-2">
                <Link href="/auth/login" className="block text-sm text-slate-500 hover:text-brand-600 transition-colors">Log In</Link>
                <Link href="/auth/register" className="block text-sm text-slate-500 hover:text-brand-600 transition-colors">Sign Up</Link>
                <Link href="/dashboard" className="block text-sm text-slate-500 hover:text-brand-600 transition-colors">Dashboard</Link>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-3">About</h4>
              <div className="space-y-2">
                <p className="text-sm text-slate-500">Jasaan, Misamis Oriental</p>
                <p className="text-sm text-slate-500">Philippines 9003</p>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-400">
              &copy; {new Date().getFullYear()} HatodJasaan. All rights reserved. Made with ❤️ in Jasaan.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
