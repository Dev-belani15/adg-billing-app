'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Percent,
  CheckCircle2,
  Calendar,
  Award,
  X,
  Sparkles,
} from 'lucide-react';
import { formatINR } from '@/lib/formatters';

export default function LoyaltyPromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    title: '',
    discountType: 'FIXED_AMOUNT',
    value: '',
    minBillTotal: '',
    maxDiscount: '',
  });

  useEffect(() => {
    loadPromos();
  }, []);

  const loadPromos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/loyalty-promotions');
      const data = await res.json();
      if (data.promotions) setPromotions(data.promotions);
      if (data.topLoyaltyCustomers) setTopCustomers(data.topLoyaltyCustomers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/loyalty-promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({
          code: '',
          title: '',
          discountType: 'FIXED_AMOUNT',
          value: '',
          minBillTotal: '',
          maxDiscount: '',
        });
        loadPromos();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Tag className="w-6 h-6 text-indigo-600" />
            <span>Promotions, Coupons & Loyalty Programs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure POS billing coupons, percentage discounts, and loyalty reward redemption rules
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Promotions Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {promotions.map((p) => (
              <div
                key={p.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 dark:bg-slate-900 dark:border-slate-800"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-sm tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300">
                      {p.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      ACTIVE
                    </span>
                  </div>

                  <div className="font-bold text-xs text-slate-900 dark:text-slate-100 mt-3">
                    {p.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {p.discountType === 'PERCENTAGE'
                      ? `${p.value}% Off on cart`
                      : `Flat ${formatINR(p.value)} Off`}
                    {p.minBillTotal > 0 && ` on orders above ${formatINR(p.minBillTotal)}`}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
                  <span>Usage: {p.usageCount} checkouts</span>
                  <span className="text-indigo-600 font-semibold dark:text-indigo-400">POS Compatible</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Loyalty Customers Leaderboard */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
            <span>Top Loyalty Customers</span>
            <Award className="w-4 h-4 text-amber-500" />
          </h2>

          <div className="space-y-3">
            {topCustomers.map((c, idx) => (
              <div
                key={c.id}
                className="p-3 bg-slate-50 rounded-xl flex items-center justify-between dark:bg-slate-800/60 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{c.phone}</div>
                </div>
                <div className="font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  ⭐ {c.loyaltyPoints} pts
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 text-center">
            Points rule: 1 point earned per ₹100 spent
          </div>
        </div>
      </div>

      {/* Create Promo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center dark:border-slate-800">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">Create New Coupon</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Coupon Code (Uppercase) *</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. DIWALI20"
                  className="w-full p-2 border rounded-lg font-mono uppercase font-bold bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Diwali Mega Saver Offer"
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="FIXED_AMOUNT">Flat Amount (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Discount Value *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full p-2 border rounded-lg font-mono font-bold bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Min Bill Amount (₹)</label>
                <input
                  type="number"
                  value={form.minBillTotal}
                  onChange={(e) => setForm({ ...form, minBillTotal: e.target.value })}
                  placeholder="e.g. 499"
                  className="w-full p-2 border rounded-lg font-mono bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow"
                >
                  Create Promo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
