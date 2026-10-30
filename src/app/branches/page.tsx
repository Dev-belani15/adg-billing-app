'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  ArrowRightLeft,
  Boxes,
  Plus,
  CheckCircle2,
  X,
  RefreshCw,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';

export default function BranchesPage() {
  const [stores, setStores] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceStoreId, setSourceStoreId] = useState('');
  const [targetStoreId, setTargetStoreId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [transferQty, setTransferQty] = useState('10');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadBranches();
    fetch('/api/products?limit=100').then((r) => r.json()).then((d) => setProducts(d.products || []));
  }, []);

  const loadBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/branches');
      const data = await res.json();
      if (data.stores) {
        setStores(data.stores);
        if (data.stores.length >= 2) {
          setSourceStoreId(data.stores[0].id);
          setTargetStoreId(data.stores[1].id);
        }
      }
      if (data.transfers) setTransfers(data.transfers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceStoreId || !targetStoreId || !selectedProductId || !transferQty) return;

    try {
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceStoreId,
          targetStoreId,
          items: [{ productId: selectedProductId, quantity: parseFloat(transferQty) }],
          notes,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        loadBranches();
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
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>Multi-Store Branches & Stock Transfers</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized multi-branch control, branch-specific counters, and atomic inter-store stock transfers
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>New Stock Transfer</span>
        </button>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stores.map((s) => (
          <div
            key={s.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 dark:bg-slate-900 dark:border-slate-800 text-xs"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{s.name}</span>
                <span className="font-mono text-[10px] ml-2 px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {s.code}
                </span>
              </div>
              {s.isMainBranch && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  MAIN HQ
                </span>
              )}
            </div>

            <div className="text-slate-500">
              {s.address} | GSTIN: {s.gstin}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-50 p-2 rounded-lg dark:bg-slate-800/60">
                <span className="text-slate-400 block">Billing Counters:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{s.counters?.length || 0} Terminals</span>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg dark:bg-slate-800/60">
                <span className="text-slate-400 block">Invoices Billed:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{s._count?.sales || 0} Bills</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inter-Store Transfers History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 dark:text-slate-200 dark:border-slate-800">
          Inter-Branch Stock Transfers History ({transfers.length})
        </div>
        {transfers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No inter-store transfers recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Transfer #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Source Branch</th>
                  <th className="py-3 px-4">Destination Branch</th>
                  <th className="py-3 px-4">Items Transferred</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transfers.map((t) => (
                  <tr key={t.id}>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {t.transferNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-medium">{t.sourceStore?.name}</td>
                    <td className="py-3 px-4 font-medium">{t.targetStore?.name}</td>
                    <td className="py-3 px-4">
                      {t.lines?.map((l: any) => `${l.product?.name} (${l.quantity} ${l.product?.unit})`).join(', ')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{t.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center dark:border-slate-800">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">Inter-Branch Stock Transfer</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Source Store *</label>
                  <select
                    value={sourceStoreId}
                    onChange={(e) => setSourceStoreId(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Target Store *</label>
                  <select
                    value={targetStoreId}
                    onChange={(e) => setTargetStoreId(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Product Item *</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="">Choose item to transfer</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Transfer Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono font-bold bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Transfer Notes / Dispatch Ref</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Van transit consignment #442"
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
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
