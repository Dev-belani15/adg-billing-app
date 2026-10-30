'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Receipt,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import { formatINR, formatDate } from '@/lib/formatters';

export default function ReturnsPage() {
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [returnItems, setReturnItems] = useState<{ [productId: string]: { quantity: number; condition: 'SALEABLE' | 'DAMAGED' } }>({});
  const [returnReason, setReturnReason] = useState('Customer Request - Change of Mind');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'UPI' | 'STORE_CREDIT'>('CASH');
  const [submitting, setSubmitting] = useState(false);
  const [completedReturn, setCompletedReturn] = useState<any>(null);

  const handleSearchInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceQuery.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setInvoice(null);
    setCompletedReturn(null);
    setReturnItems({});

    try {
      const res = await fetch(`/api/sales/${encodeURIComponent(invoiceQuery.trim())}`);
      const data = await res.json();
      if (!res.ok || !data.invoice) {
        setErrorMsg(data.error || 'Invoice not found. Please verify the invoice number.');
      } else {
        setInvoice(data.invoice);
        // Initialize return items map
        const initial: any = {};
        for (const line of data.invoice.lines) {
          initial[line.productId] = { quantity: 0, condition: 'SALEABLE' };
        }
        setReturnItems(initial);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error fetching invoice');
    } finally {
      setLoading(false);
    }
  };

  const updateItemQty = (productId: string, qty: number, maxQty: number) => {
    const validQty = Math.max(0, Math.min(qty, maxQty));
    setReturnItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: validQty,
      },
    }));
  };

  const updateItemCondition = (productId: string, condition: 'SALEABLE' | 'DAMAGED') => {
    setReturnItems((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        condition,
      },
    }));
  };

  // Calculate total refund
  const totalRefund = invoice?.lines?.reduce((sum: number, line: any) => {
    const returnQty = returnItems[line.productId]?.quantity || 0;
    return sum + returnQty * line.unitPrice;
  }, 0) || 0;

  const handleSubmitReturn = async () => {
    const itemsToReturn = Object.entries(returnItems)
      .filter(([_, data]) => data.quantity > 0)
      .map(([productId, data]) => {
        const line = invoice.lines.find((l: any) => l.productId === productId);
        return {
          productId,
          quantity: data.quantity,
          unitPrice: line.unitPrice,
          condition: data.condition,
        };
      });

    if (!itemsToReturn.length) {
      setErrorMsg('Please select at least one item quantity to return');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/sales/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalInvoiceId: invoice.id,
          returnReason,
          items: itemsToReturn,
          refundMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to process return');
      } else {
        setCompletedReturn(data.return);
        setInvoice(null);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error processing return');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <RotateCcw className="w-6 h-6 text-rose-600" />
          <span>Sales Returns & Credit Notes</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Process customer item returns, restore saleable inventory, and issue refunds
        </p>
      </div>

      {/* Invoice Lookup Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <form onSubmit={handleSearchInvoice} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={invoiceQuery}
              onChange={(e) => setInvoiceQuery(e.target.value)}
              placeholder="Enter original invoice number (e.g. ZYD-1001)..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-medium dark:bg-slate-800 dark:border-slate-700"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-lg transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Find Bill</span>
          </button>
        </form>

        {errorMsg && (
          <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Success Notification after Processing */}
      {completedReturn && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2 dark:bg-emerald-950/40 dark:border-emerald-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
            Return Completed Successfully!
          </h2>
          <p className="text-xs text-emerald-700 dark:text-emerald-300">
            Credit Note / Return Number: <span className="font-mono font-bold">{completedReturn.returnNumber}</span>
          </p>
          <div className="text-sm font-bold text-emerald-900 dark:text-emerald-100 font-mono pt-1">
            Refund Amount: {formatINR(completedReturn.refundAmount)} ({completedReturn.refundMethod})
          </div>
          <div className="pt-3">
            <button
              onClick={() => {
                setCompletedReturn(null);
                setInvoiceQuery('');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg"
            >
              Process Another Return
            </button>
          </div>
        </div>
      )}

      {/* Active Return Workspace */}
      {invoice && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5 dark:bg-slate-900 dark:border-slate-800">
          {/* Bill Overview Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 p-4 rounded-xl border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
            <div>
              <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Invoice {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-slate-500">
                Customer: {invoice.customer?.name || 'Retail Walk-in'} | Date: {formatDate(invoice.createdAt)}
              </div>
            </div>
            <div className="mt-2 sm:mt-0 font-mono font-bold text-base text-slate-900 dark:text-slate-100">
              Original Total: {formatINR(invoice.totalAmount)}
            </div>
          </div>

          {/* Items Selector */}
          <div>
            <h2 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
              Select Quantities & Condition to Return
            </h2>
            <div className="border border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3 text-center">Sold Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-center">Return Qty</th>
                    <th className="py-2.5 px-3">Condition / Stock Action</th>
                    <th className="py-2.5 px-3 text-right">Refund Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoice.lines.map((line: any) => {
                    const currentReturn = returnItems[line.productId] || { quantity: 0, condition: 'SALEABLE' };
                    return (
                      <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {line.productName}
                          <div className="text-[10px] text-slate-400 font-mono">{line.sku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{line.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatINR(line.unitPrice)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={line.quantity}
                            value={currentReturn.quantity}
                            onChange={(e) => updateItemQty(line.productId, parseInt(e.target.value) || 0, line.quantity)}
                            className="w-16 text-center font-mono font-bold py-1 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={currentReturn.condition}
                            onChange={(e) => updateItemCondition(line.productId, e.target.value as any)}
                            disabled={currentReturn.quantity === 0}
                            className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none dark:bg-slate-800 dark:border-slate-700 disabled:opacity-50"
                          >
                            <option value="SALEABLE">Saleable (Restore to Stock)</option>
                            <option value="DAMAGED">Damaged (Quarantine / Scrap)</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                          {formatINR(currentReturn.quantity * line.unitPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Refund Details & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Return:
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="Customer Request - Change of Mind">Customer Request - Change of Mind</option>
                <option value="Defective / Damaged Packaging">Defective / Damaged Packaging</option>
                <option value="Expired Product">Expired Product</option>
                <option value="Incorrect Item Billed">Incorrect Item Billed</option>
                <option value="Quality Issue">Quality Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Refund Payment Method:
              </label>
              <div className="flex gap-2">
                {(['CASH', 'UPI', 'STORE_CREDIT'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setRefundMethod(method)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                      refundMethod === method
                        ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950 dark:border-rose-600 dark:text-rose-200'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs text-slate-400">Total Refund Payable:</span>
              <div className="text-xl font-bold font-mono text-rose-600">
                {formatINR(totalRefund)}
              </div>
            </div>

            <button
              onClick={handleSubmitReturn}
              disabled={totalRefund === 0 || submitting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition flex items-center space-x-1.5 shadow disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Return...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Authorize Return & Refund</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
