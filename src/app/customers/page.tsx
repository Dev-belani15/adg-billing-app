'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  Mail,
  Award,
  CreditCard,
  X,
  CheckCircle2,
} from 'lucide-react';
import { formatINR } from '@/lib/formatters';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      let url = '/api/customers?';
      if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.customers) setCustomers(data.customers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({ name: '', phone: '', email: '', address: '', gstin: '' });
        loadCustomers();
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
            <UserCheck className="w-6 h-6 text-indigo-600" />
            <span>Customer Profiles & Loyalty Rewards</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer relationship management, repeat purchase history, and loyalty point balances
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer Profile</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex gap-2 dark:bg-slate-900 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadCustomers()}
            placeholder="Search by customer mobile number or name..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
          />
        </div>
        <button
          onClick={loadCustomers}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg dark:bg-slate-800 dark:text-slate-300"
        >
          Search
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No customer profiles found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Mobile Number</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Invoices Billed</th>
                  <th className="py-3 px-4 text-right">Loyalty Points</th>
                  <th className="py-3 px-4 text-right">Credit Balance</th>
                  <th className="py-3 px-4">GSTIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {c.phone}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{c.email || '-'}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {c._count?.sales || 0}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full dark:bg-indigo-950 dark:text-indigo-400">
                        ⭐ {c.loyaltyPoints} pts
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {formatINR(c.creditBalance)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {c.gstin || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center dark:border-slate-800">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">New Customer Profile</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Mobile Phone (10 digits) *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="9820011223"
                  className="w-full p-2 border rounded-lg font-mono bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="ramesh@gmail.com"
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">GSTIN (for B2B)</label>
                  <input
                    type="text"
                    value={form.gstin}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                    placeholder="27ABCDE1234F1Z5"
                    className="w-full p-2 border rounded-lg font-mono uppercase bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Flat 101, Shanti Tower, Mumbai"
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
