import React from 'react';
import Link from 'next/link';
import { Logo } from './logo';
import { ShieldCheck, HeartHandshake, Award } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-900 text-stone-300">
      {/* Rwandan Hospitality Guarantees */}
      <div className="border-b border-stone-800 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#b94726]/20 text-[#b94726]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-white">Universal Property Standards</h4>
                <p className="mt-1 text-sm text-stone-400">
                  Every listed accommodation—from a family guesthouse in Musanze to a five-star lakeside resort in Rubavu—is verified for guest safety and comfort.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <HeartHandshake className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-white">Genuine Rwandan Hospitality</h4>
                <p className="mt-1 text-sm text-stone-400">
                  Experience authentic cultural warmth. Single-room home hosts and boutique hotel managers share one platform with transparent RWF pricing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-white">Zero Double-Booking Guarantee</h4>
                <p className="mt-1 text-sm text-stone-400">
                  Universal hierarchy engine synchronizes whole-villa and individual-room availability atomically at the database level.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <Logo className="text-white" showTagline={true} />
            <p className="mt-4 max-w-sm text-sm text-stone-400 leading-relaxed">
              Memento is Rwanda&apos;s universal accommodation booking marketplace. Connecting travellers with authentic stays across the Land of a Thousand Hills.
            </p>
            <div className="mt-4 rounded-xl border border-stone-800 bg-stone-800/50 p-3 text-xs text-stone-400">
              <span className="font-semibold text-amber-400">Demonstration Notice:</span> All sample listings and reviews are labeled demo data prepared for testing and onboarding Rwanda hospitality partners.
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Destinations</h5>
            <ul className="mt-4 space-y-2.5 text-sm text-stone-400">
              <li><Link href="/search?destination=Kigali" className="hover:text-white transition-colors">Kigali City</Link></li>
              <li><Link href="/search?destination=Musanze" className="hover:text-white transition-colors">Musanze (Volcanoes)</Link></li>
              <li><Link href="/search?destination=Rubavu" className="hover:text-white transition-colors">Rubavu (Lake Kivu)</Link></li>
              <li><Link href="/search?destination=Karongi" className="hover:text-white transition-colors">Karongi (Kibuye)</Link></li>
              <li><Link href="/search?destination=Huye" className="hover:text-white transition-colors">Huye (Culture Hub)</Link></li>
              <li><Link href="/search?destination=Nyagatare" className="hover:text-white transition-colors">Nyagatare & Akagera</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Accommodation Types</h5>
            <ul className="mt-4 space-y-2.5 text-sm text-stone-400">
              <li><Link href="/search?type=hotel" className="hover:text-white transition-colors">Hotels & Boutique Inns</Link></li>
              <li><Link href="/search?type=lodge" className="hover:text-white transition-colors">Safari Lodges & Resorts</Link></li>
              <li><Link href="/search?type=apartment" className="hover:text-white transition-colors">Serviced City Lofts</Link></li>
              <li><Link href="/search?type=private_room" className="hover:text-white transition-colors">Private Home Bedrooms</Link></li>
              <li><Link href="/search?type=villa" className="hover:text-white transition-colors">Entire Villas & Houses</Link></li>
              <li><Link href="/search?type=homestay" className="hover:text-white transition-colors">Rural Cultural Homestays</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">Hosting & Legal</h5>
            <ul className="mt-4 space-y-2.5 text-sm text-stone-400">
              <li><Link href="/become-a-host" className="hover:text-white transition-colors">Become a Host</Link></li>
              <li><Link href="/host" className="hover:text-white transition-colors">Host Dashboard</Link></li>
              <li><Link href="/admin" className="hover:text-white transition-colors">Marketplace Admin</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><span className="text-stone-500">RDB Tourism Compliant</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between border-t border-stone-800 pt-8 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Memento Rwanda. All rights reserved.</p>
          <div className="mt-4 sm:mt-0 flex items-center gap-4">
            <span>Primary Currency: <strong className="text-stone-300">RWF (Rwandan Franc)</strong></span>
            <span>•</span>
            <span>Kigali, Rwanda</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

