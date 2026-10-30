'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Boxes,
  History,
  ClipboardCheck,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  RefreshCw,
  CheckCircle2,
  X,
} from 'lucide-react';
import { formatINR } from '@/lib/formatters';

export default function InventoryPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock count discrepancy correction');
  const [adjustType, setAdjustType] = useState('ADJUSTMENT');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadInventory();
  }, [filter]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      let url = `/api/inventory?`;
      if (filter !== 'ALL') url += `filter=${filter}&`;
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !adjustQty) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          adjustmentQty: parseFloat(adjustQty),
          type: adjustType,
          reason: adjustReason,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        setSuccessMsg(`Successfully adjusted stock for ${selectedProduct.name}`);
        setAdjustModalOpen(false);
        setAdjustQty('');
        loadInventory();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredInventory = data?.inventory?.filter(
    (i: any) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.barcode.includes(searchQuery)
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-indigo-600" />
            <span>Real-Time Inventory & Valuation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Synchronized stock ledger across all 4 billing terminals & physical store storage
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/inventory/movements"
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
          >
            <History className="w-4 h-4" />
            <span>Stock Ledger</span>
          </Link>
          <Link
            href="/inventory/stock-count"
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Audit Session</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Total Catalog Items</div>
            <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
              {data.summary.totalItems}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Stock Valuation (Cost)</div>
            <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
              {formatINR(data.summary.totalValuationCost)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Stock Valuation (Retail)</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatINR(data.summary.totalValuationSelling)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Low / Out of Stock</div>
            <div className="text-2xl font-bold font-mono text-amber-600">
              {data.summary.lowStockCount} Low / {data.summary.outOfStockCount} Out
            </div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 dark:bg-slate-900 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name, barcode, SKU..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:border-slate-700"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="LOW_STOCK">Low Stock Alerts</option>
            <option value="OUT_OF_STOCK">Out of Stock Only</option>
          </select>
          <button
            onClick={loadInventory}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading inventory balances...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Barcode / SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-center">Available Stock</th>
                  <th className="py-3 px-4 text-right">Stock Value (Cost)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInventory?.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {item.barcode} | {item.sku}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {formatINR(item.costPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatINR(item.sellingPrice)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          item.isOutOfStock
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : item.isLowStock
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatINR(item.stockValueCost)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedProduct(item);
                          setAdjustModalOpen(true);
                        }}
                        className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition dark:bg-slate-800 dark:text-slate-300"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Stock Adjustment Modal */}
      {adjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center dark:border-slate-800">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Adjust Stock: {selectedProduct.name}
              </h2>
              <button onClick={() => setAdjustModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-5 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <div className="text-slate-500">Current Authoritative Stock:</div>
                <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                  {selectedProduct.quantity} {selectedProduct.unit}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="ADJUSTMENT">General Adjustment (+ / -)</option>
                  <option value="DAMAGE">Damaged / Expired Stock Deduction (-)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Quantity Difference (e.g. +5 or -2) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. -2 or 5"
                  className="w-full p-2 border rounded-lg font-mono font-bold bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Reason for Adjustment *</label>
                <textarea
                  required
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Reason (e.g. Physical count mismatch, bottle seal broken)"
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-4 py-2 border rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow disabled:opacity-50"
                >
                  {submitting ? 'Committing...' : 'Commit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
