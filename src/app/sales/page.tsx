'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  RotateCcw,
  RefreshCw,
  Printer,
  Calendar,
  Layers,
} from 'lucide-react';
import { formatINR, formatDate } from '@/lib/formatters';

export default function SalesHistoryPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  useEffect(() => {
    loadSales();
  }, [paymentFilter]);

  const loadSales = async () => {
    setLoading(true);
    try {
      let url = `/api/sales?`;
      if (paymentFilter !== 'ALL') url += `paymentMethod=${paymentFilter}&`;
      if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.invoices) setInvoices(data.invoices);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadSales();
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-600" />
            <span>Sales History & Invoices</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View, audit, reprint, and manage customer billing invoices
          </p>
        </div>

        <Link
          href="/returns"
          className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2 rounded-xl border border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
        >
          <RotateCcw className="w-4 h-4 text-rose-600" />
          <span>Process Return / Exchange</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 dark:bg-slate-900 dark:border-slate-800">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number (e.g. ZYD-1001), customer phone, name..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
          />
        </form>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:border-slate-700"
          >
            <option value="ALL">All Payment Methods</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="CARD">Card</option>
            <option value="SPLIT">Split Tender</option>
          </select>

          <button
            onClick={loadSales}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading sales history...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No invoices found matching criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Counter</th>
                  <th className="py-3 px-4">Cashier</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Tax</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {inv.customer?.name || 'Walk-in Customer'}
                      {inv.customer?.phone && (
                        <div className="text-[10px] text-slate-400 font-mono">{inv.customer.phone}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {inv.counter?.name || 'Counter 1'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {inv.cashier?.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {formatINR(inv.taxAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatINR(inv.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/sales/${inv.id}`}
                        className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition dark:bg-indigo-950 dark:text-indigo-300"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
