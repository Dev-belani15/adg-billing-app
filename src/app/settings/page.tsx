'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  FileSpreadsheet,
  Percent,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Lock,
} from 'lucide-react';

export default function SettingsPage() {
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    legalName: '',
    gstin: '',
    phone: '',
    email: '',
    address: '',
    invoicePrefix: 'ZYD-',
    isTaxInclusiveDefault: true,
    maxCashierDiscountPct: 10,
    enableLoyalty: true,
    allowNegativeStock: false,
  });

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.business) {
          setBusiness(d.business);
          const s = d.business.settings;
          setForm({
            name: d.business.name || '',
            legalName: d.business.legalName || '',
            gstin: d.business.gstin || '',
            phone: d.business.phone || '',
            email: d.business.email || '',
            address: d.business.address || '',
            invoicePrefix: s?.invoicePrefix || 'ZYD-',
            isTaxInclusiveDefault: s?.isTaxInclusiveDefault ?? true,
            maxCashierDiscountPct: s?.maxCashierDiscountPct || 10,
            enableLoyalty: s?.enableLoyalty ?? true,
            allowNegativeStock: s?.allowNegativeStock ?? false,
          });
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMessage('Settings saved and synchronized successfully!');
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading business settings...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            <span>Store Configuration & Legal Profile</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            GSTIN credentials, invoice sequence series, cashier discount boundaries, and negative stock controls
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Business Legal Entity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Legal Business Entity & GSTIN Registration</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Trade / Display Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Registered Legal Entity Name</label>
              <input
                type="text"
                value={form.legalName}
                onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1">Indian GSTIN *</label>
              <input
                type="text"
                required
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                className="w-full p-2.5 border rounded-xl font-mono uppercase font-bold bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Official Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Billing Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Registered Principal Place of Business</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
        </div>

        {/* POS Billing & Operational Controls */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Percent className="w-4 h-4 text-indigo-600" />
            <span>POS Billing Invariants & Security Controls</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Invoice Number Prefix Series</label>
              <input
                type="text"
                value={form.invoicePrefix}
                onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                className="w-full p-2.5 border rounded-xl font-mono uppercase bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Generates: {form.invoicePrefix}1042</span>
            </div>

            <div>
              <label className="block font-semibold mb-1">Max Cashier Discount Limit (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={form.maxCashierDiscountPct}
                onChange={(e) => setForm({ ...form, maxCashierDiscountPct: parseFloat(e.target.value) || 0 })}
                className="w-full p-2.5 border rounded-xl font-mono bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Discounts above this % require manager PIN</span>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isTaxInclusiveDefault}
                onChange={(e) => setForm({ ...form, isTaxInclusiveDefault: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <div>
                <span className="font-bold block text-slate-800 dark:text-slate-200">Retail Tax-Inclusive Pricing Default</span>
                <span className="text-[11px] text-slate-400">Display shelf prices with GST included (standard for supermarkets)</span>
              </div>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowNegativeStock}
                onChange={(e) => setForm({ ...form, allowNegativeStock: e.target.checked })}
                className="rounded text-indigo-600"
              />
              <div>
                <span className="font-bold block text-slate-800 dark:text-slate-200">Allow Negative Stock Billing (Overselling)</span>
                <span className="text-[11px] text-slate-400">
                  Default disabled. When unchecked, checkout will block sales if authoritative inventory balance is insufficient.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
