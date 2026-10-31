'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MockStore } from '@/lib/data/mock-store';
import { useMemento } from '@/lib/context/memento-context';
import { isSupabaseConfigured } from '@/lib/data/service';
import { createClient } from '@/lib/supabase/client';
import { PropertyType, BookableUnit, Property, PropertyImage } from '@/lib/types';
import { PropertyPhotoManager } from '@/components/property-photo-manager';
import { formatRWF } from '@/lib/utils/format';
import {
  Check,
  Building,
  User,
  Plus,
  Trash2,
  Upload,
  ShieldCheck,
  Home,
  Layers,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  ImagePlus,
} from 'lucide-react';

export default function BecomeAHostPage() {
  const router = useRouter();
  const { currentUser, supabaseUser, refresh } = useMemento();

  // Wizard Steps: 1: Host Profile, 2: Property Basics, 3: Bookable Units, 4: Verification & Photos, 5: Review & Submit
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State: Step 1 Host Info
  const [hostType, setHostType] = useState<'individual' | 'business'>('individual');
  const [hostFullName, setHostFullName] = useState(currentUser.full_name || '');
  const [hostEmail, setHostEmail] = useState(currentUser.email || '');
  const [hostPhone, setHostPhone] = useState('+250 788 000 111');
  const [businessName, setBusinessName] = useState('');
  const [nationalIdOrPassport, setNationalIdOrPassport] = useState('1199080012345678');

  // Step 2 Property Basics
  const [propertyTitle, setPropertyTitle] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('apartment');
  const [destinationId, setDestinationId] = useState('dest-kigali');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Kigali');
  const [province, setProvince] = useState('Kigali City');
  const [description, setDescription] = useState('');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('11:00');
  const [cancellationPolicy, setCancellationPolicy] = useState<'flexible' | 'moderate' | 'strict'>('flexible');
  const [instantBook, setInstantBook] = useState(false);

  // Step 3 Universal Bookable Units
  const [units, setUnits] = useState<Partial<BookableUnit>[]>([
    {
      name: 'Primary Guest Accommodation',
      unit_type: 'entire_place',
      is_entire_property: true,
      description: 'Main furnished living accommodation.',
      base_price_rwf: 60000,
      weekly_discount_rate: 0.1,
      monthly_discount_rate: 0.2,
      cleaning_fee_rwf: 5000,
      max_guests: 2,
      bedrooms: 1,
      beds: 1,
      bathrooms: 1,
      total_inventory: 1,
    },
  ]);

  // Step 4 Verification Docs & Photos
  const [documentType, setDocumentType] = useState('national_id');
  const [photos, setPhotos] = useState<PropertyImage[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const destinations = MockStore.getDestinations();

  const addUnit = () => {
    setUnits([
      ...units,
      {
        name: `Unit ${units.length + 1}`,
        unit_type: 'room',
        is_entire_property: false,
        description: 'Comfortable guest bedroom.',
        base_price_rwf: 35000,
        weekly_discount_rate: 0.1,
        monthly_discount_rate: 0.2,
        cleaning_fee_rwf: 0,
        max_guests: 2,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        total_inventory: 1,
      },
    ]);
  };

  const removeUnit = (index: number) => {
    if (units.length <= 1) return;
    setUnits(units.filter((_, i) => i !== index));
  };

  const updateUnitField = (index: number, field: keyof BookableUnit, value: any) => {
    const updated = [...units];
    updated[index] = { ...updated[index], [field]: value };
    setUnits(updated);
  };

  const addSamplePhoto = (url: string, label: string) => {
    setPhotos((current) => {
      if (current.some((photo) => photo.image_url === url)) return current;

      return [
        ...current,
        {
          id: `sample-${Date.now()}-${current.length}`,
          property_id: '',
          image_url: url,
          caption: label,
          display_order: current.length + 1,
          is_primary: current.length === 0,
        },
      ];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!propertyTitle.trim()) {
      setSubmitError('Add a property title before submitting.');
      setCurrentStep(2);
      return;
    }

    if (photos.length === 0) {
      setSubmitError('Add at least one property photo before submitting.');
      setCurrentStep(4);
      return;
    }

    if (isUploadingPhotos) {
      setSubmitError('Please wait for your photos to finish uploading.');
      return;
    }

    setIsSubmitting(true);

    try {
      const publicName =
        hostType === 'business' && businessName.trim()
          ? businessName.trim()
          : hostFullName.trim() || currentUser.full_name;

      const hostProfile = {
        ...currentUser,
        id: supabaseUser?.id || currentUser.id,
        email: hostEmail || supabaseUser?.email || currentUser.email,
        full_name: publicName,
        phone_number: hostPhone,
        role: (currentUser.role === 'admin' ? 'admin' : 'host') as 'host' | 'admin' | 'traveller',
      };

      // Create property in state with status 'under_review'
      const newProp = MockStore.createProperty(
        {
          title: propertyTitle.trim(),
          property_type: propertyType,
          destination_id: destinationId,
          address: address || 'Kigali, Rwanda',
          city: city || 'Kigali',
          province: province || 'Kigali City',
          description: description || 'Beautiful newly listed accommodation in Rwanda.',
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          cancellation_policy: cancellationPolicy,
          instant_book: instantBook,
          images: photos,
        },
        units,
        hostProfile
      );

      // A traveller account becomes a host once their first listing is
      // submitted. Never downgrade an administrator in the process.
      if (isSupabaseConfigured() && supabaseUser && currentUser.role === 'traveller') {
        const supabase = createClient();
        const { error } = await supabase
          .from('profiles')
          .update({ role: 'host' })
          .eq('id', supabaseUser.id);

        if (error) {
          console.error('Could not update host role', error);
        }

        await refresh();
      }

      router.push(`/host?submitted=${newProp.id}`);
    } catch (err) {
      console.error(err);
      setSubmitError(
        err instanceof Error ? err.message : 'Could not submit your listing. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Wizard Header */}
      <div className="text-center">
        <span className="inline-block rounded-full bg-[#b94726]/10 px-3 py-1 text-xs font-semibold text-[#b94726] uppercase tracking-wider">
          Host Onboarding
        </span>
        <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold font-serif text-stone-900">
          List your accommodation on Memento
        </h1>
        <p className="mt-2 text-sm text-stone-500 max-w-xl mx-auto">
          Whether you have a single spare bedroom in Kigali or a 50-room gorilla lodge in Musanze, Memento gives you one universal system.
        </p>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4 text-xs font-bold">
        {[
          { step: 1, label: 'Host Profile' },
          { step: 2, label: 'Property Details' },
          { step: 3, label: 'Bookable Units' },
          { step: 4, label: 'Verification & Photos' },
          { step: 5, label: 'Review & Submit' },
        ].map((s) => (
          <button
            key={s.step}
            onClick={() => s.step < currentStep && setCurrentStep(s.step)}
            className={`flex items-center gap-1.5 transition-colors ${
              currentStep === s.step
                ? 'text-[#b94726]'
                : currentStep > s.step
                ? 'text-emerald-700'
                : 'text-stone-400'
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                currentStep === s.step
                  ? 'bg-[#b94726] text-white'
                  : currentStep > s.step
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-stone-200 text-stone-600'
              }`}
            >
              {currentStep > s.step ? <Check className="h-3 w-3" /> : s.step}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-10 shadow-sm">
        {/* STEP 1: HOST PROFILE */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-bold font-serif text-stone-900">
              Step 1: Host Registration & Identity
            </h2>
            <p className="text-xs text-stone-500">
              Are you registering as an individual homeowner or a registered Rwandan hospitality business?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setHostType('individual')}
                className={`flex flex-col items-start rounded-2xl border p-5 text-left transition-all ${
                  hostType === 'individual'
                    ? 'border-[#b94726] bg-[#b94726]/5 ring-2 ring-[#b94726]/20'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <User className="h-6 w-6 text-[#b94726] mb-2" />
                <span className="font-bold text-stone-900 text-sm">Individual Host</span>
                <span className="mt-1 text-xs text-stone-500">
                  Renting out a spare bedroom, private guesthouse, family villa or home.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setHostType('business')}
                className={`flex flex-col items-start rounded-2xl border p-5 text-left transition-all ${
                  hostType === 'business'
                    ? 'border-[#b94726] bg-[#b94726]/5 ring-2 ring-[#b94726]/20'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <Building className="h-6 w-6 text-[#1f4e3d] mb-2" />
                <span className="font-bold text-stone-900 text-sm">Hospitality Business / Hotel</span>
                <span className="mt-1 text-xs text-stone-500">
                  Registered hotel, safari lodge, serviced apartment company or resort.
                </span>
              </button>
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Host Full Name
                  </label>
                  <input
                    type="text"
                    value={hostFullName}
                    onChange={(e) => setHostFullName(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Phone Number (Rwandan +250)
                  </label>
                  <input
                    type="text"
                    value={hostPhone}
                    onChange={(e) => setHostPhone(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900"
                  />
                </div>
              </div>

              {hostType === 'business' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Registered Business / Hotel Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    placeholder="e.g. Virunga Horizon Lodges Ltd"
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Rwandan National ID (NID) or Passport Number
                  </label>
                  <input
                    type="text"
                    value={nationalIdOrPassport}
                    onChange={(e) => setNationalIdOrPassport(e.target.value)}
                    placeholder="16-digit Rwandan NID number"
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900 font-mono"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-2 rounded-2xl bg-[#b94726] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#9e3b1e]"
              >
                <span>Continue to Property Details</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PROPERTY DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-bold font-serif text-stone-900">
              Step 2: Property Information
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Property Title / Establishment Name
                </label>
                <input
                  type="text"
                  value={propertyTitle}
                  placeholder="e.g. Kivu Panorama Guesthouse or Kiyovu Executive Suites"
                  onChange={(e) => setPropertyTitle(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Accommodation Category
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900 capitalize"
                  >
                    <option value="apartment">Apartment / Serviced Flat</option>
                    <option value="hotel">Hotel / Boutique Hotel</option>
                    <option value="lodge">Lodge / Safari Retreat</option>
                    <option value="entire_home">Entire House / Villa</option>
                    <option value="private_room">Private Room in Home</option>
                    <option value="guesthouse">Guesthouse / Bed & Breakfast</option>
                    <option value="cottage">Cottage / Chalet</option>
                    <option value="homestay">Homestay</option>
                    <option value="resort">Resort</option>
                    <option value="campsite">Campsite</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Rwandan Destination / District
                  </label>
                  <select
                    value={destinationId}
                    onChange={(e) => {
                      setDestinationId(e.target.value);
                      const d = destinations.find((dest) => dest.id === e.target.value);
                      if (d) {
                        setCity(d.name);
                        setProvince(d.province);
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900"
                  >
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.province})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Street Address & Sector / Cell
                </label>
                <input
                  type="text"
                  value={address}
                  placeholder="e.g. KG 9 Avenue, Nyarutarama, Gasabo"
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Property Description
                </label>
                <textarea
                  value={description}
                  rows={4}
                  placeholder="Describe your accommodation, surroundings, views, transportation and guest amenities..."
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Check-In Time
                  </label>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Check-Out Time
                  </label>
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 rounded-2xl border border-stone-300 px-5 py-2.5 text-xs font-semibold text-stone-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 rounded-2xl bg-[#b94726] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#9e3b1e]"
              >
                <span>Continue to Bookable Units</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: CRITICAL SECTION 4 UNIVERSAL BOOKABLE UNITS */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl font-bold font-serif text-stone-900">
                Step 3: Universal Bookable Units & Pricing
              </h2>
              <p className="mt-1 text-xs text-stone-500">
                A property holds bookable units. Configure individual bedrooms, entire house options, or hotel room inventory quantities.
              </p>
            </div>

            <div className="space-y-4">
              {units.map((unit, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-stone-200 bg-stone-50/60 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                    <span className="text-sm font-bold text-stone-900">
                      Unit #{idx + 1}: {unit.name || 'Unnamed Unit'}
                    </span>
                    {units.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUnit(idx)}
                        className="text-stone-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Unit Name
                      </label>
                      <input
                        type="text"
                        value={unit.name}
                        placeholder="e.g. Standard Room, Lake Suite, Entire Villa"
                        onChange={(e) => updateUnitField(idx, 'name', e.target.value)}
                        className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-2 text-xs text-stone-900 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Base Price (RWF / night)
                      </label>
                      <input
                        type="number"
                        step={5000}
                        value={unit.base_price_rwf}
                        onChange={(e) => updateUnitField(idx, 'base_price_rwf', Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-2 text-xs text-stone-900 font-bold"
                      />
                    </div>
                  </div>

                  {/* Entire Property Checkbox */}
                  <div className="rounded-xl bg-white p-3 border border-stone-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={unit.is_entire_property}
                        onChange={(e) => updateUnitField(idx, 'is_entire_property', e.target.checked)}
                        className="rounded text-[#b94726] focus:ring-[#b94726]"
                      />
                      <span className="text-xs font-bold text-stone-800">
                        This unit reserves the entire property
                      </span>
                    </label>
                    <p className="mt-1 text-[11px] text-stone-500">
                      If checked, when a guest books this unit, the universal availability engine will automatically block all other individual rooms for those dates.
                    </p>
                  </div>

                  {/* Capacity & Inventory */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase">
                        Max Guests
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={unit.max_guests}
                        onChange={(e) => updateUnitField(idx, 'max_guests', Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-2 text-xs text-stone-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase">
                        Bedrooms
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={unit.bedrooms}
                        onChange={(e) => updateUnitField(idx, 'bedrooms', Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-2 text-xs text-stone-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase">
                        Bathrooms
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={unit.bathrooms}
                        onChange={(e) => updateUnitField(idx, 'bathrooms', Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-2 text-xs text-stone-900 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase">
                        Inventory Quantity
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={unit.total_inventory}
                        onChange={(e) => updateUnitField(idx, 'total_inventory', Number(e.target.value))}
                        className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-2 text-xs text-stone-900 font-bold"
                        title="For hotels with multiple identical rooms"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addUnit}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 p-3 text-xs font-bold text-stone-700 hover:border-[#b94726] hover:text-[#b94726] transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Another Bookable Unit Option</span>
              </button>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 rounded-2xl border border-stone-300 px-5 py-2.5 text-xs font-semibold text-stone-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-2 rounded-2xl bg-[#b94726] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#9e3b1e]"
              >
                <span>Continue to Verification</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: VERIFICATION & PHOTOS */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-bold font-serif text-stone-900">
              Step 4: Property Photos & Verification
            </h2>
            <p className="text-xs text-stone-500">
              Upload the real photos travellers will see first. Clear photos of the rooms,
              exterior and views help your listing get approved and booked faster.
            </p>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                    Property Photos <span className="text-[#b94726]">*</span>
                  </label>
                  {photos.length > 0 && (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                      {photos.length} photo{photos.length === 1 ? '' : 's'} added
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <PropertyPhotoManager
                    images={photos}
                    onChange={setPhotos}
                    ownerId={supabaseUser?.id}
                    maxPhotos={8}
                    onBusyChange={setIsUploadingPhotos}
                  />
                </div>

                <p className="mt-2 text-[11px] text-stone-500">
                  At least one photo is required. The cover photo appears on search results.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Or start with a demonstration photo
                </label>
                <p className="text-[11px] text-stone-500">
                  For testing only. You can remove these before submitting.
                </p>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  {[
                    { url: '/images/kigali-loft.png', label: 'Kigali Loft / Urban' },
                    { url: '/images/musanze-lodge.png', label: 'Musanze Mountain Lodge' },
                    { url: '/images/hero-rwanda.png', label: 'Lake Kivu Shore' },
                  ].map((p) => {
                    const selected = photos.some((photo) => photo.image_url === p.url);
                    const limitReached = photos.length >= 8;

                    return (
                      <button
                        type="button"
                        key={p.url}
                        onClick={() => addSamplePhoto(p.url, p.label)}
                        disabled={selected || limitReached}
                        className={`group overflow-hidden rounded-2xl border-2 bg-white text-left transition-all ${
                          selected
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'border-stone-200 hover:border-[#b94726] disabled:cursor-not-allowed disabled:opacity-50'
                        }`}
                      >
                        <div className="relative aspect-[4/3] bg-stone-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.url} alt={p.label} className="h-full w-full object-cover" />
                          <span
                            className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shadow-sm ${
                              selected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white/90 text-stone-700 group-hover:bg-[#b94726] group-hover:text-white'
                            }`}
                          >
                            {selected ? <Check className="h-3 w-3" /> : <ImagePlus className="h-3 w-3" />}
                          </span>
                        </div>
                        <div className="p-2 text-center text-[11px] font-semibold text-stone-800">
                          {p.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Verification Document Type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-300 p-2.5 text-xs text-stone-900"
                >
                  <option value="national_id">Rwandan National ID (Front & Back)</option>
                  <option value="passport">International Passport</option>
                  <option value="business_rdb_cert">RDB Business Registration Certificate</option>
                  <option value="rdb_tourism_license">RDB Tourism Operating License</option>
                  <option value="title_deed_or_lease">Land Title Deed (UPI) or Lease Agreement</option>
                </select>
                <p className="mt-1 text-[11px] text-stone-500">
                  Select the document you will provide to the Memento verification team.
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Verification Status: Under Review</span>
                  <p className="mt-0.5 text-amber-800 text-[11px]">
                    In accordance with Memento platform rules, listings must be verified and approved by the Memento administrative team before they become publicly bookable.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-1.5 rounded-2xl border border-stone-300 px-5 py-2.5 text-xs font-semibold text-stone-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-3">
                {photos.length === 0 && (
                  <span className="text-[11px] font-medium text-stone-400">
                    Add at least one photo to continue
                  </span>
                )}
                <button
                  type="button"
                  disabled={photos.length === 0 || isUploadingPhotos}
                  onClick={() => setCurrentStep(5)}
                  className="flex items-center gap-2 rounded-2xl bg-[#b94726] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#9e3b1e] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>{isUploadingPhotos ? 'Uploading photos…' : 'Review Application'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & SUBMIT */}
        {currentStep === 5 && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-bold font-serif text-stone-900">
              Step 5: Final Review & Submission
            </h2>

            {submitError && (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="rounded-2xl bg-stone-50 p-5 space-y-4 text-xs">
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="font-bold text-stone-500 uppercase">Host</span>
                <span className="font-semibold text-stone-900">
                  {hostType === 'business' && businessName ? businessName : hostFullName} ({hostType})
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="font-bold text-stone-500 uppercase">Property Title</span>
                <span className="font-semibold text-stone-900">{propertyTitle || 'Unnamed Stay'}</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="font-bold text-stone-500 uppercase">Location</span>
                <span className="font-semibold text-stone-900">
                  {city}, {province}, Rwanda
                </span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="font-bold text-stone-500 uppercase">Bookable Units</span>
                <span className="font-bold text-[#b94726]">{units.length} Unit(s) configured</span>
              </div>
              <div className="flex justify-between border-b border-stone-200 pb-2">
                <span className="font-bold text-stone-500 uppercase">Property Photos</span>
                <span className="font-bold text-stone-900">
                  {photos.length} photo{photos.length === 1 ? '' : 's'} uploaded
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-stone-500 uppercase">Initial Status</span>
                <span className="rounded bg-amber-100 px-2 py-0.5 font-bold text-amber-800">
                  Under Review (Draft verification)
                </span>
              </div>
            </div>

            {photos.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Photo Preview
                </span>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {photos.slice(0, 4).map((photo, index) => (
                    <div
                      key={photo.id}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.image_url}
                        alt={photo.caption || `Property photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      {photo.is_primary && (
                        <span className="absolute left-1 top-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[8px] font-bold uppercase text-stone-900 shadow-sm">
                          Cover
                        </span>
                      )}
                      {index === 3 && photos.length > 4 && (
                        <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-sm font-bold text-white">
                          +{photos.length - 4}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex items-center gap-1.5 rounded-2xl border border-stone-300 px-5 py-2.5 text-xs font-semibold text-stone-700"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploadingPhotos || photos.length === 0}
                className="flex items-center gap-2 rounded-2xl bg-[#b94726] px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#9e3b1e] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  {isUploadingPhotos
                    ? 'Uploading photos…'
                    : isSubmitting
                    ? 'Submitting...'
                    : 'Submit Host Application'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

