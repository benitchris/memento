'use client';

import React from 'react';
import {
  Hotel,
  Building2,
  Home,
  DoorClosed,
  Mountain,
  Compass,
  Tent,
  Castle,
  Bed,
  Sparkles,
  TreePine,
  Coffee,
} from 'lucide-react';
import { PropertyType } from '@/lib/types';

export interface CategoryItem {
  type: PropertyType | 'all';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

export const CATEGORIES: CategoryItem[] = [
  { type: 'all', label: 'All Stays', icon: Sparkles, description: 'Every verified stay in Rwanda' },
  { type: 'hotel', label: 'Hotels', icon: Hotel, description: 'Boutique hotels & luxury chains' },
  { type: 'apartment', label: 'Apartments', icon: Building2, description: 'Serviced lofts & flats' },
  { type: 'lodge', label: 'Lodges', icon: TreePine, description: 'Volcano & safari retreats' },
  { type: 'private_room', label: 'Private Rooms', icon: DoorClosed, description: 'Bedrooms in local homes' },
  { type: 'entire_home', label: 'Entire Homes', icon: Home, description: 'Complete residences for groups' },
  { type: 'villa', label: 'Villas', icon: Castle, description: 'Luxury estates with pools' },
  { type: 'guesthouse', label: 'Guesthouses', icon: Coffee, description: 'Bed & breakfasts with local charm' },
  { type: 'resort', label: 'Resorts', icon: Mountain, description: 'Lakefront & wellness resorts' },
  { type: 'cottage', label: 'Cottages', icon: Compass, description: 'Rustic lakeside & forest chalets' },
  { type: 'homestay', label: 'Homestays', icon: Bed, description: 'Living with welcoming Rwandan hosts' },
  { type: 'campsite', label: 'Campsites', icon: Tent, description: 'Lake Kivu and Akagera camping' },
];

interface CategoryBarProps {
  selectedType: string;
  onSelect: (type: string) => void;
  className?: string;
}

export function CategoryBar({ selectedType = 'all', onSelect, className = '' }: CategoryBarProps) {
  return (
    <div className={`w-full overflow-x-auto no-scrollbar py-3 border-b border-stone-200/60 bg-white ${className}`}>
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8 min-w-max">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedType === cat.type;
          return (
            <button
              key={cat.type}
              onClick={() => onSelect(cat.type)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl px-4 py-2.5 text-xs transition-all ${
                isSelected
                  ? 'border-b-2 border-[#b94726] text-[#b94726] font-semibold bg-[#b94726]/5'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50 border-b-2 border-transparent'
              }`}
            >
              <Icon className={`h-5 w-5 ${isSelected ? 'text-[#b94726]' : 'text-stone-500'}`} />
              <span className="whitespace-nowrap">{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

