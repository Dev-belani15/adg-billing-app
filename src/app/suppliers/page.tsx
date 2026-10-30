'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  X,
  CheckCircle2,
} from 'lucide-react';
import { formatINR } from '@/lib/formatters';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    companyName: '',
    gstin: '',
    phone: '',
    email: '',
    address: '',
    state: 'Maharashtra',
    paymentTerms: 'Net 30',
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      if (data.suppliers) setSuppliers(data.suppliers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({
          name: '',
          companyName: '',
          gstin: '',
          phone: '',
          email: '',
          address: '',
          state: 'Maharashtra',
          paymentTerms: 'Net 30',
        });
        loadSuppliers();
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
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Supplier & Vendor Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maintain wholesale supplier profiles, GSTIN registrations, payment terms, and balances
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3 dark:bg-slate-900 dark:border-slate-800 text-xs"
          >
            <div>
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{s.name}</span>
                <span className="font-mono text-[11px] font-bold text-rose-600">
                  {formatINR(s.currentBalance)} Due
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-500">{s.companyName || 'Wholesaler'}</div>

              <div className="mt-3 space-y-1 text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">GSTIN:</span>
                  <span className="font-mono font-bold">{s.gstin || 'Unregistered'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{s.phone}</span>
                </div>
                {s.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
              <span>Terms: {s.paymentTerms}</span>
              <span className="font-semibold">{s._count?.purchases || 0} Purchase Orders</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center dark:border-slate-800">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">Add New Supplier</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Supplier / Contact Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Metro Wholesalers Ltd"
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Company / Trade Name</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="e.g. Metro Cash & Carry"
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">GSTIN</label>
                  <input
                    type="text"
                    value={form.gstin}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                    placeholder="27AABCM8901D1Z2"
                    className="w-full p-2 border rounded-lg font-mono uppercase bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 22 6677 8899"
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="orders@metro.com"
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Plot 3, Thane Belapur Road, Navi Mumbai"
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
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
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
