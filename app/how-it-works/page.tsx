import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HeartHandshake, Layers, Compass, Building, CheckCircle2, ArrowRight } from 'lucide-react';

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-16">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-block rounded-full bg-[#b94726]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#b94726]">
          Universal Platform
        </span>
        <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold font-serif text-stone-900 leading-tight">
          How Memento Works
        </h1>
        <p className="mt-4 text-sm sm:text-base text-stone-600 font-light leading-relaxed">
          Rwanda’s unified accommodation marketplace. Built with a universal property-to-unit architecture that powers single-bedroom hosts and multi-room hotels equally.
        </p>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#b94726]">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold font-serif text-stone-900">For Travellers</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Search across Kigali, Musanze, Lake Kivu, and all Rwandan provinces. Compare transparent RWF pricing, select your exact unit, and reserve instantly without upfront payment penalties.
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#1f4e3d]">
            <Building className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold font-serif text-stone-900">For Hosts</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Register your house or hotel establishment in minutes. Configure individual bedrooms, executive suites, or whole residences with independent inventory counts.
          </p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-[#d99b26]">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold font-serif text-stone-900">Universal Conflict Engine</h3>
          <p className="text-xs text-stone-600 leading-relaxed">
            Our PostgreSQL database engine guarantees zero double bookings. When a guest reserves an entire villa, all individual rooms become unavailable automatically.
          </p>
        </div>
      </div>

      {/* Booking Flow Step-by-Step */}
      <div className="rounded-3xl border border-stone-200 bg-white p-8 shadow-sm space-y-8">
        <h2 className="text-2xl font-bold font-serif text-stone-900 text-center">
          The 4-Step Booking Flow
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              num: '1',
              title: 'Discover & Filter',
              desc: 'Select destination, check-in dates, and filter by amenities like High-Speed Wi-Fi or Volcano Views.',
            },
            {
              num: '2',
              title: 'Choose Your Unit',
              desc: 'Pick between a private room, executive chalet, or the entire property with transparent RWF rates.',
            },
            {
              num: '3',
              title: 'Instant / Host Review',
              desc: 'Get instant confirmation for enabled properties or review within 24 hours with your Rwandan host.',
            },
            {
              num: '4',
              title: 'Check-In & Settle',
              desc: 'Arrive at your accommodation and pay with MTN MoMo, Airtel Money, or cash directly at the property.',
            },
          ].map((item) => (
            <div key={item.num} className="rounded-2xl bg-stone-50 p-5 space-y-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#b94726] text-white text-xs font-bold">
                {item.num}
              </span>
              <h4 className="text-sm font-bold text-stone-900">{item.title}</h4>
              <p className="text-xs text-stone-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="rounded-3xl bg-stone-900 p-8 sm:p-12 text-center text-white space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold font-serif">
          Ready to experience Memento?
        </h2>
        <p className="max-w-xl mx-auto text-xs sm:text-sm text-stone-300">
          Start exploring accommodations across Rwanda or register to become a host today.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/search"
            className="rounded-2xl bg-[#b94726] px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-[#9e3b1e]"
          >
            Explore Stays
          </Link>
          <Link
            href="/become-a-host"
            className="rounded-2xl border border-white/30 bg-white/10 px-6 py-3 text-xs font-bold text-white hover:bg-white/20"
          >
            Become a Host
          </Link>
        </div>
      </div>
    </div>
  );
}
