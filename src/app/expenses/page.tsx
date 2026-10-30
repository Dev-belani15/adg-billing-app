'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  Filter,
  CheckCircle2,
  Calendar,
  X,
  RefreshCw,
} from 'lucide-react';
import { formatINR, formatDate } from '@/lib/formatters';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalExpense: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'UTILITIES',
    amount: '',
    paymentMode: 'CASH',
    payeeName: '',
    notes: '',
  });

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      if (data.expenses) setExpenses(data.expenses);
      if (data.summary) setSummary(data.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setForm({
          title: '',
          category: 'UTILITIES',
          amount: '',
          paymentMode: 'CASH',
          payeeName: '',
          notes: '',
        });
        loadExpenses();
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
            <Wallet className="w-6 h-6 text-indigo-600" />
            <span>Daily Cashbook & Store Expenses</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record petty cash outflows, utilities, staff refreshments, packaging, and repairs
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense Voucher</span>
        </button>
      </div>

      {/* Summary KPI Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Total Expenses Recorded</div>
          <div className="text-2xl font-bold font-mono text-rose-600">
            {formatINR(summary.totalExpense)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Vouchers Count</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {summary.count} Vouchers
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Primary Mode</div>
          <div className="text-2xl font-bold font-mono text-slate-700 dark:text-slate-300">
            Cash Drawer
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No expenses recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Expense Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payee</th>
                  <th className="py-3 px-4">Payment Mode</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(e.date)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {e.title}
                      {e.notes && <div className="text-[10px] text-slate-400">{e.notes}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{e.payeeName || '-'}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{e.paymentMode}</td>
                    <td className="py-3 px-4 text-slate-500">{e.user?.name}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                      {formatINR(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center dark:border-slate-800">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">Record Expense Voucher</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Daily store cleaning phenyl & brooms"
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="UTILITIES">Utilities & Cleaning</option>
                    <option value="PACKAGING">Packaging & Thermal Rolls</option>
                    <option value="TEA_REFRESHMENTS">Tea & Refreshments</option>
                    <option value="RENT">Store Rent</option>
                    <option value="REPAIRS">Maintenance & Repairs</option>
                    <option value="SALARY">Salary / Advance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="450.00"
                    className="w-full p-2 border rounded-lg font-mono font-bold bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Payment Mode</label>
                  <select
                    value={form.paymentMode}
                    onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="CASH">Cash Drawer</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Paid To (Payee Name)</label>
                  <input
                    type="text"
                    value={form.payeeName}
                    onChange={(e) => setForm({ ...form, payeeName: e.target.value })}
                    placeholder="e.g. Ramesh Hardware"
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Notes / Voucher #</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Receipt voucher #104"
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
                  Save Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
