'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Search,
  Boxes,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    loadMovements();
  }, [typeFilter]);

  const loadMovements = async () => {
    setLoading(true);
    try {
      let url = `/api/inventory/movements?`;
      if (typeFilter !== 'ALL') url += `type=${typeFilter}&`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.movements) setMovements(data.movements);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            <span>Immutable Stock Movement Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade transactional ledger of every inbound and outbound stock movement
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/inventory"
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
          >
            <Boxes className="w-4 h-4" />
            <span>Stock Overview</span>
          </Link>
          <button
            onClick={loadMovements}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600 dark:text-slate-300">Filter by Movement Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none dark:bg-slate-800 dark:border-slate-700 font-medium"
          >
            <option value="ALL">All Movements</option>
            <option value="SALE">POS Sales Checkouts</option>
            <option value="SALE_RETURN">Customer Returns</option>
            <option value="PURCHASE_RECEIPT">Goods Receipts (GRN)</option>
            <option value="OPENING">Opening Stock</option>
            <option value="ADJUSTMENT">Manual Adjustments</option>
            <option value="TRANSFER_IN">Inter-Store Transfers In</option>
            <option value="TRANSFER_OUT">Inter-Store Transfers Out</option>
            <option value="DAMAGE">Damaged / Quarantine</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {movements.length} latest transactions
        </div>
      </div>

      {/* Movements Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading ledger entries...</div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No stock movements found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Product Name & SKU</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {movements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {formatDate(m.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{m.product?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{m.product?.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            m.type === 'SALE'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : m.type === 'SALE_RETURN'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : m.type === 'PURCHASE_RECEIPT'
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : m.type === 'DAMAGE'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={`inline-flex items-center gap-0.5 ${
                            isPositive ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {isPositive ? `+${m.quantity}` : m.quantity} {m.product?.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {m.balanceAfter} {m.product?.unit}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                        {m.referenceId || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {m.reason}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {m.performedBy || 'System'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
