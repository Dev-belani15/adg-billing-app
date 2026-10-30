'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  PlayCircle,
  Trash2,
  ShoppingCart,
  ArrowLeft,
  User,
  RefreshCw,
} from 'lucide-react';
import { formatINR, formatDate } from '@/lib/formatters';

export default function HeldBillsPage() {
  const router = useRouter();
  const [heldBills, setHeldBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHeldBills();
  }, []);

  const loadHeldBills = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pos/held-bills');
      const data = await res.json();
      if (data.heldBills) setHeldBills(data.heldBills);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDiscard = async (id: string) => {
    try {
      await fetch(`/api/pos/held-bills?id=${id}`, { method: 'DELETE' });
      loadHeldBills();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <Link
            href="/pos"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-6 h-6 text-amber-600" />
              <span>Held & Suspended Customer Bills</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Retrieve parked carts and resume billing on any counter
            </p>
          </div>
        </div>

        <Link
          href="/pos"
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Back to POS Terminal</span>
        </Link>
      </div>

      {/* Held Bills Grid */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading suspended bills...</div>
        ) : heldBills.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-400 text-xs rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            No held bills currently parked.
          </div>
        ) : (
          heldBills.map((bill) => (
            <div
              key={bill.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 dark:bg-slate-900 dark:border-slate-800 text-xs"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {bill.customerName || 'Walk-in Customer'}
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    Counter {bill.counterNumber}
                  </span>
                </div>
                <div className="text-slate-500 mt-1">
                  Parked at: {formatDate(bill.heldAt)} | {bill.itemCount} items in cart
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Items: {bill.items?.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')}
                </div>
              </div>

              <div className="flex items-center space-x-4 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">Cart Total</div>
                  <div className="font-mono font-bold text-base text-indigo-600 dark:text-indigo-400">
                    {formatINR(bill.subtotal)}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDiscard(bill.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg dark:hover:bg-slate-800"
                    title="Discard bill"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    href={`/pos?resume=${bill.id}`}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Resume</span>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
