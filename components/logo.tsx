import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
}

export function Logo({ className = '', showTagline = false }: LogoProps) {
  return (
    <Link href="/" className={`group flex items-center gap-2.5 transition-opacity hover:opacity-95 ${className}`}>
      {/* Rwandan Sun & Rolling Hills Hospitality Emblem */}
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#b94726] to-[#9e3b1e] text-white shadow-md shadow-[#b94726]/20">
        <svg viewBox="0 0 40 40" className="h-6 w-6 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
          {/* Sun */}
          <circle cx="20" cy="13" r="4" fill="currentColor" fillOpacity="0.9" />
          {/* Rolling Hills (Land of a Thousand Hills) */}
          <path d="M6 31 C 12 21, 18 21, 24 31" fill="none" strokeWidth="2.5" />
          <path d="M16 31 C 22 23, 28 23, 34 31" fill="none" strokeWidth="2.5" strokeOpacity="0.7" />
          {/* Roof crest for hospitality / home */}
          <path d="M14 17 L20 12 L26 17" strokeWidth="2" strokeOpacity="0.9" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="font-serif text-2xl font-bold tracking-tight text-[#18191b] group-hover:text-[#b94726] transition-colors">
            Memento
          </span>
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#b94726]"></span>
        </div>
        {showTagline && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
            Rwanda Accommodation
          </span>
        )}
      </div>
    </Link>
  );
}

