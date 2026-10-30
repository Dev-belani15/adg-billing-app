'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Plus,
  Truck,
  Users,
  Search,
  RefreshCw,
  CheckCircle2,
  X,
  FileText,
} from 'lucide-react';
import { formatINR, formatDate } from '@/lib/formatters';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [poLines, setPoLines] = useState<any[]>([
    { productId: '', quantityOrdered: 10, unitCost: 100, taxRate: 5 },
  ]);

  useEffect(() => {
    loadPurchases();
    fetch('/api/suppliers').then((r) => r.json()).then((d) => setSuppliers(d.suppliers || []));
    fetch('/api/products?limit=100').then((r) => r.json()).then((d) => setProducts(d.products || []));
  }, []);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchases');
      const data = await res.json();
      if (data.purchases) setPurchases(data.purchases);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLine = () => {
    setPoLines([...poLines, { productId: '', quantityOrdered: 10, unitCost: 100, taxRate: 5 }]);
  };

  const handleRemoveLine = (idx: number) => {
    setPoLines(poLines.filter((_, i) => i !== idx));
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !poLines.length) return;

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplier,
          items: poLines.filter((l) => l.productId),
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        loadPurchases();
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
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
            <span>Purchase Orders & Inward Procurement</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create vendor purchase orders, monitor deliveries, and reconcile supplier invoices
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/purchases/receive"
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
          >
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Goods Receipt (GRN)</span>
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* PO List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading purchase orders...</div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No purchase orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Items Count</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Tax (₹)</th>
                  <th className="py-3 px-4 text-right">Total (₹)</th>
                  <th className="py-3 px-4 text-center">Inward Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {po.poNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {formatDate(po.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {po.supplier?.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                      {po.lines?.length} lines
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          po.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : po.status === 'PARTIALLY_RECEIVED'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {formatINR(po.taxAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatINR(po.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {po.status !== 'COMPLETED' ? (
                        <Link
                          href={`/purchases/receive?po=${po.id}`}
                          className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg dark:bg-emerald-950 dark:text-emerald-300"
                        >
                          Receive Goods
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Fully Received</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create PO Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center dark:border-slate-800">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">Create Purchase Order</h2>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div>
                <label className="block font-semibold mb-1">Select Supplier *</label>
                <select
                  required
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="">Choose Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.companyName || 'Vendor'})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-semibold">Items Ordered</label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    + Add Product Line
                  </button>
                </div>

                <div className="space-y-2">
                  {poLines.map((line, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        required
                        value={line.productId}
                        onChange={(e) => {
                          const prod = products.find((p) => p.id === e.target.value);
                          const updated = [...poLines];
                          updated[idx].productId = e.target.value;
                          if (prod) {
                            updated[idx].unitCost = prod.costPrice;
                            updated[idx].taxRate = prod.taxRate;
                          }
                          setPoLines(updated);
                        }}
                        className="flex-1 p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                      >
                        <option value="">Select Item</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={line.quantityOrdered}
                        onChange={(e) => {
                          const updated = [...poLines];
                          updated[idx].quantityOrdered = parseInt(e.target.value) || 1;
                          setPoLines(updated);
                        }}
                        className="w-20 p-2 border rounded-lg font-mono text-center bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                      />

                      <input
                        type="number"
                        step="0.01"
                        placeholder="Cost (₹)"
                        value={line.unitCost}
                        onChange={(e) => {
                          const updated = [...poLines];
                          updated[idx].unitCost = parseFloat(e.target.value) || 0;
                          setPoLines(updated);
                        }}
                        className="w-24 p-2 border rounded-lg font-mono text-right bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                      />

                      {poLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
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
                  Submit Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
