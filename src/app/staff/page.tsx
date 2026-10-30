'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  Users,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  X,
  ShieldCheck,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CASHIER',
    password: 'admin123',
  });

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      if (data.staff) setStaff(data.staff);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({ name: '', email: '', phone: '', role: 'CASHIER', password: 'admin123' });
        loadStaff();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const rolesMatrix = [
    { role: 'Business Owner', code: 'OWNER', pos: true, inventory: true, purchases: true, reports: true, settings: true, voidSales: true },
    { role: 'Administrator', code: 'ADMIN', pos: true, inventory: true, purchases: true, reports: true, settings: true, voidSales: true },
    { role: 'Store Manager', code: 'STORE_MANAGER', pos: true, inventory: true, purchases: true, reports: true, settings: false, voidSales: true },
    { role: 'Cashier Terminal', code: 'CASHIER', pos: true, inventory: false, purchases: false, reports: false, settings: false, voidSales: false },
    { role: 'Storekeeper', code: 'STOREKEEPER', pos: false, inventory: true, purchases: true, reports: false, settings: false, voidSales: false },
    { role: 'Accountant', code: 'ACCOUNTANT', pos: false, inventory: false, purchases: true, reports: true, settings: false, voidSales: false },
    { role: 'Auditor (Read-only)', code: 'AUDITOR', pos: false, inventory: false, purchases: false, reports: true, settings: false, voidSales: false },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-600" />
            <span>Staff Members & Role Permissions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based access control, counter shift authorization, and staff user management
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 dark:text-slate-200 dark:border-slate-800">
          Active Store Personnel ({staff.length})
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading staff...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Staff Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Shifts Logged</th>
                  <th className="py-3 px-4 text-center">Invoices Billed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {staff.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {u.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{u.email}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{u.phone || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        ACTIVE
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {u._count?.shifts || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {u._count?.sales || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Permission Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 dark:text-slate-200 dark:border-slate-800">
          Server-Enforced Role Permission Matrix
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Role Title</th>
                <th className="py-3 px-4 text-center">POS Billing</th>
                <th className="py-3 px-4 text-center">Stock Ledger</th>
                <th className="py-3 px-4 text-center">Purchases / PO</th>
                <th className="py-3 px-4 text-center">Executive Reports</th>
                <th className="py-3 px-4 text-center">Store Settings</th>
                <th className="py-3 px-4 text-center">Void Bill / Refund</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rolesMatrix.map((r, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {r.role} ({r.code})
                  </td>
                  <td className="py-3 px-4 text-center">{r.pos ? '✅' : '❌'}</td>
                  <td className="py-3 px-4 text-center">{r.inventory ? '✅' : '❌'}</td>
                  <td className="py-3 px-4 text-center">{r.purchases ? '✅' : '❌'}</td>
                  <td className="py-3 px-4 text-center">{r.reports ? '✅' : '❌'}</td>
                  <td className="py-3 px-4 text-center">{r.settings ? '✅' : '❌'}</td>
                  <td className="py-3 px-4 text-center">{r.voidSales ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center dark:border-slate-800">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">Add Staff Account</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ramesh Kadam"
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Email (Login ID) *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ramesh@zyden.com"
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="CASHIER">Cashier</option>
                    <option value="STORE_MANAGER">Store Manager</option>
                    <option value="STOREKEEPER">Storekeeper</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="AUDITOR">Auditor</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="9820123456"
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
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
                  Create Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
