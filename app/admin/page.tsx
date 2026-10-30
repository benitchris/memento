'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MockStore } from '@/lib/data/mock-store';
import { useMemento } from '@/lib/context/memento-context';
import { formatRWF, formatUSD, formatDate } from '@/lib/utils/format';
import { PropertyStatus } from '@/lib/types';
import {
  ShieldCheck,
  Building,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Sliders,
  Eye,
  Star,
  Check,
  Save,
  Lock,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { currentUser, switchRole, currency } = useMemento();
  const isAdmin = currentUser.role === 'admin';

  const [activeTab, setActiveTab] = useState<'approvals' | 'properties' | 'reservations' | 'settings'>('approvals');
  const [commissionRate, setCommissionRate] = useState<number>(8.0);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  const state = MockStore.getState();
  const allProperties = state.properties;
  const pendingApprovals = allProperties.filter(
    (p) => p.status === 'under_review' || p.status === 'submitted'
  );

  const allBookings = state.bookings;
  const totalGMV = allBookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.total_price_rwf, 0);

  const platformRevenue = allBookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + b.service_fee_rwf, 0);

  const handleUpdateStatus = (propertyId: string, status: PropertyStatus) => {
    MockStore.updatePropertyStatus(propertyId, status);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess(`Platform commission rate updated to ${commissionRate}%!`);
    setTimeout(() => setSettingsSuccess(null), 3000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Role Banner if visiting as non-admin */}
      {!isAdmin && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-rose-700" />
            <div>
              <span className="font-bold">Admin Portal Authorization Notice</span>
              <p className="text-rose-800">
                You are viewing as {currentUser.full_name}. Switch to Administrator (Diane Uwimana) to execute regulatory approvals.
              </p>
            </div>
          </div>
          <button
            onClick={() => switchRole('admin')}
            className="rounded-xl bg-[#1f4e3d] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#163a2d]"
          >
            Switch to Admin (Diane)
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#1f4e3d]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#1f4e3d]">
              Regulatory & Marketplace Administration
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Role Verified: Admin
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold font-serif text-stone-900">
            Memento Marketplace Control
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Oversee Rwandan accommodation listings, review host verification documents, and audit platform reservations.
          </p>
        </div>
      </div>

      {/* High-Level Platform Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total GMV</span>
            <DollarSign className="h-4 w-4 text-[#b94726]" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-stone-900">
            {formatRWF(totalGMV)}
          </div>
          <p className="mt-1 text-[11px] text-stone-400">Total gross transaction volume</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Take (8%)</span>
            <ShieldCheck className="h-4 w-4 text-[#1f4e3d]" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-emerald-800">
            {formatRWF(platformRevenue)}
          </div>
          <p className="mt-1 text-[11px] text-stone-400">Gross marketplace fee revenue</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-amber-600">
            {pendingApprovals.length}
          </div>
          <p className="mt-1 text-[11px] text-stone-400">Listings awaiting audit</p>
        </div>

        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Properties</span>
            <Building className="h-4 w-4 text-stone-600" />
          </div>
          <div className="mt-3 text-2xl font-extrabold text-stone-900">
            {allProperties.length}
          </div>
          <p className="mt-1 text-[11px] text-stone-400">Universal establishments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 space-x-6 text-xs font-bold">
        {[
          { id: 'approvals', label: `Pending Approvals Queue (${pendingApprovals.length})` },
          { id: 'properties', label: `All Properties (${allProperties.length})` },
          { id: 'reservations', label: `Platform Reservations (${allBookings.length})` },
          { id: 'settings', label: 'Financial & Commission Settings' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-[#b94726] text-[#b94726]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PENDING APPROVALS QUEUE */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center text-xs text-stone-400">
              <CheckCircle className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
              <span>All listing submissions are up to date. Zero pending reviews.</span>
            </div>
          ) : (
            pendingApprovals.map((prop) => (
              <div
                key={prop.id}
                className="rounded-3xl border border-amber-200 bg-white p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-stone-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 uppercase">
                        {prop.status}
                      </span>
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600 capitalize">
                        {prop.property_type.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold text-stone-900">{prop.title}</h3>
                    <p className="text-xs text-stone-500">
                      Location: {prop.address}, {prop.city}, {prop.province} • Host ID: {prop.host_id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(prop.id, 'approved')}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Approve & Make Live</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(prop.id, 'rejected')}
                      className="flex items-center gap-1.5 rounded-xl border border-stone-300 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>

                {/* Units configured in this property */}
                <div className="rounded-2xl bg-stone-50 p-4 space-y-2">
                  <span className="block text-[11px] font-bold text-stone-500 uppercase">
                    Configured Bookable Units ({prop.units?.length || 0})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {prop.units?.map((u) => (
                      <div key={u.id} className="rounded-xl bg-white p-2.5 border border-stone-200">
                        <span className="font-bold text-stone-900">{u.name}</span>
                        <div className="text-[11px] text-stone-500">
                          {formatRWF(u.base_price_rwf)} / night • Max {u.max_guests} guests {u.is_entire_property ? '(Entire Property)' : '(Room)'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ALL PROPERTIES */}
      {activeTab === 'properties' && (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 text-[10px] uppercase font-bold text-stone-400">
              <tr>
                <th className="pb-3">Title & Location</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Units</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {allProperties.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50">
                  <td className="py-3">
                    <div className="font-bold text-stone-900">{p.title}</div>
                    <div className="text-[11px] text-stone-500">{p.city}, {p.province}</div>
                  </td>
                  <td className="py-3 capitalize">{p.property_type.replace('_', ' ')}</td>
                  <td className="py-3 font-semibold">{p.units?.length || 0} units</td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        p.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'under_review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/properties/${p.id}`}
                        className="rounded-lg bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-200"
                      >
                        Preview
                      </Link>
                      {p.status === 'approved' ? (
                        <button
                          onClick={() => handleUpdateStatus(p.id, 'suspended')}
                          className="rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(p.id, 'approved')}
                          className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: PLATFORM RESERVATIONS */}
      {activeTab === 'reservations' && (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 text-[10px] uppercase font-bold text-stone-400">
              <tr>
                <th className="pb-3">Ref</th>
                <th className="pb-3">Accommodation</th>
                <th className="pb-3">Guest</th>
                <th className="pb-3">Stay Dates</th>
                <th className="pb-3">Total Amount</th>
                <th className="pb-3">Platform Fee</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {allBookings.map((b) => (
                <tr key={b.id} className="hover:bg-stone-50">
                  <td className="py-3 font-mono font-bold text-[#b94726]">{b.booking_ref}</td>
                  <td className="py-3 font-semibold text-stone-900">{b.property?.title}</td>
                  <td className="py-3 text-stone-700">{b.guest?.full_name}</td>
                  <td className="py-3 text-stone-600">
                    {formatDate(b.check_in_date)} — {formatDate(b.check_out_date)}
                  </td>
                  <td className="py-3 font-bold text-stone-900">{formatRWF(b.total_price_rwf)}</td>
                  <td className="py-3 font-bold text-emerald-800">{formatRWF(b.service_fee_rwf)}</td>
                  <td className="py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        b.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: SETTINGS (Section 14: Pricing & Future Revenue) */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold font-serif text-stone-900">
              Platform Monetization & Commission Configuration
            </h3>
            <p className="mt-1 text-xs text-stone-500">
              Configure marketplace commission rules without code redeployment.
            </p>
          </div>

          {settingsSuccess && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>{settingsSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                Marketplace Guest Service Fee (%)
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="number"
                  step={0.5}
                  min={0}
                  max={25}
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-32 rounded-xl border border-stone-300 p-2 text-sm font-bold text-stone-900"
                />
                <span className="text-xs text-stone-500">% per confirmed booking</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  Primary Market Currency
                </label>
                <input
                  type="text"
                  value="RWF (Rwandan Franc)"
                  disabled
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 p-2 text-xs font-bold text-stone-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                  USD Reference Exchange Rate
                </label>
                <input
                  type="text"
                  value="1 USD = 1,380 RWF"
                  disabled
                  className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 p-2 text-xs font-bold text-stone-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-2xl bg-[#b94726] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#9e3b1e]"
            >
              <Save className="h-4 w-4" />
              <span>Save Configuration</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
