'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Truck,
  CheckCircle2,
  AlertTriangle,
  Barcode,
  Search,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { formatINR } from '@/lib/formatters';

function GoodsReceiveContent() {
  const searchParams = useSearchParams();
  const initialPoId = searchParams.get('po');
  const [purchases, setPurchases] = useState<any[]>([]);
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [receivedQtyMap, setReceivedQtyMap] = useState<{ [productId: string]: number }>({});
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successGrn, setSuccessGrn] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/purchases')
      .then((r) => r.json())
      .then((d) => {
        if (d.purchases) {
          setPurchases(d.purchases);
          if (initialPoId) {
            const found = d.purchases.find((p: any) => p.id === initialPoId);
            if (found) selectPo(found);
          }
        }
      });
  }, [initialPoId]);

  const selectPo = (po: any) => {
    setSelectedPo(po);
    const initialMap: any = {};
    for (const line of po.lines) {
      const remaining = line.quantityOrdered - line.quantityReceived;
      initialMap[line.productId] = remaining > 0 ? remaining : 0;
    }
    setReceivedQtyMap(initialMap);
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPo) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessGrn(null);

    const receivedItems = Object.entries(receivedQtyMap)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantityReceived]) => ({
        productId,
        quantityReceived,
      }));

    if (!receivedItems.length) {
      setErrorMsg('Please specify quantity received for at least one item');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/purchases/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseOrderId: selectedPo.id,
          receivedItems,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to receive goods');
      } else {
        setSuccessGrn(data.grnNumber);
        setSelectedPo(null);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error submitting goods receipt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-600" />
            <span>Goods Receiving Note (GRN)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Accept physical warehouse shipments and commit incoming stock to inventory
          </p>
        </div>

        <Link
          href="/purchases"
          className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Purchase Orders</span>
        </Link>
      </div>

      {successGrn && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2 dark:bg-emerald-950/40 dark:border-emerald-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
            Goods Inward Successfully Processed!
          </h2>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            Authoritative GRN: <span className="font-mono font-bold">{successGrn}</span>
          </p>
          <div className="pt-2">
            <Link
              href="/inventory"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg inline-block"
            >
              Inspect Updated Stock Ledger
            </Link>
          </div>
        </div>
      )}

      {/* PO Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800 text-xs">
        <div>
          <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
            Select Pending Purchase Order to Inward:
          </label>
          <select
            value={selectedPo?.id || ''}
            onChange={(e) => {
              const found = purchases.find((p) => p.id === e.target.value);
              if (found) selectPo(found);
            }}
            className="w-full p-2.5 border rounded-xl bg-slate-50 dark:bg-slate-800 dark:border-slate-700 text-xs font-medium"
          >
            <option value="">-- Choose Purchase Order --</option>
            {purchases
              .filter((p) => p.status !== 'COMPLETED')
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.poNumber} — {p.supplier?.name} ({formatINR(p.totalAmount)}) — {p.status}
                </option>
              ))}
          </select>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Selected PO Line Items to Inward */}
        {selectedPo && (
          <form onSubmit={handleReceiveSubmit} className="space-y-4 pt-2">
            <div className="border border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3 text-center">Ordered</th>
                    <th className="py-2.5 px-3 text-center">Prev. Received</th>
                    <th className="py-2.5 px-3 text-center">Receiving Now</th>
                    <th className="py-2.5 px-3 text-right">Unit Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedPo.lines?.map((line: any) => {
                    const remaining = line.quantityOrdered - line.quantityReceived;
                    return (
                      <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {line.product?.name}
                          <div className="text-[10px] text-slate-400 font-mono">{line.product?.sku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">{line.quantityOrdered}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">{line.quantityReceived}</td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            value={receivedQtyMap[line.productId] || 0}
                            onChange={(e) =>
                              setReceivedQtyMap({
                                ...receivedQtyMap,
                                [line.productId]: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-20 text-center font-mono font-bold py-1 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                          {formatINR(line.unitCost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Goods Receiving Notes / Delivery Challan Ref:
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Received via BlueDart courier, invoice #8812 verified, all seals intact"
                className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Inwarding Stock...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    <span>Confirm Inward & Update Stock</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function GoodsReceivePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading goods receiving interface...</div>}>
      <GoodsReceiveContent />
    </Suspense>
  );
}

