'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Printer,
  Receipt,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Building2,
  Share2,
} from 'lucide-react';
import { formatINR, formatDate } from '@/lib/formatters';

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [format, setFormat] = useState<'A4' | 'THERMAL'>('A4');

  useEffect(() => {
    if (id) {
      fetch(`/api/sales/${id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.invoice) setInvoice(d.invoice);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading invoice details...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Invoice not found.</p>
        <Link href="/sales" className="text-indigo-600 font-semibold text-xs mt-2 inline-block">
          ← Back to Sales
        </Link>
      </div>
    );
  }

  const business = invoice.store?.business;
  const store = invoice.store;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Action Header - Hidden during print */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <Link
            href="/sales"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Invoice {invoice.invoiceNumber}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {invoice.paymentStatus}
              </span>
            </h1>
            <p className="text-xs text-slate-400">{formatDate(invoice.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Format Selector */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <button
              onClick={() => setFormat('A4')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${
                format === 'A4'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-500'
              }`}
            >
              A4 Tax Invoice
            </button>
            <button
              onClick={() => setFormat('THERMAL')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition ${
                format === 'THERMAL'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-500'
              }`}
            >
              80mm Thermal
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE DOCUMENT 1: Standard Full-page A4 Tax Invoice */}
      {format === 'A4' && (
        <div className="printable-a4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
          {/* Invoice Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6 dark:border-slate-800">
            <div>
              <div className="text-xl font-black text-indigo-700 tracking-tight">
                {business?.name || 'ZYDEN RETAIL MART'}
              </div>
              <div className="text-xs text-slate-500 mt-1 max-w-sm">
                {business?.legalName || 'Zyden IT Solutions & Retail Enterprises Pvt Ltd'}<br />
                {store?.address || 'Phoenix Grand Galleria, Lower Parel, Mumbai'}<br />
                Phone: {store?.phone || '+91 98200 12345'} | Email: {store?.email || 'billing@zydenretail.com'}
              </div>
              <div className="mt-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                GSTIN: <span className="font-mono">{store?.gstin || '27AABCA1234F1Z8'}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                TAX INVOICE
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Invoice No: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{invoice.invoiceNumber}</span>
              </div>
              <div className="text-xs text-slate-500">
                Date: <span className="font-mono">{formatDate(invoice.createdAt)}</span>
              </div>
              <div className="text-xs text-slate-500">
                Counter: <span className="font-semibold">{invoice.counter?.name}</span>
              </div>
              <div className="text-xs text-slate-500">
                Billed By: <span className="font-semibold">{invoice.cashier?.name}</span>
              </div>
            </div>
          </div>

          {/* Billed To (Customer Details) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs dark:bg-slate-800/50 dark:border-slate-800">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
              Billed To Customer:
            </span>
            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
              {invoice.customer?.name || 'Retail Walk-in Customer'}
            </div>
            {invoice.customer?.phone && (
              <div className="text-slate-500">Mobile: {invoice.customer.phone}</div>
            )}
            {invoice.customer?.gstin && (
              <div className="text-slate-500 font-mono">Customer GSTIN: {invoice.customer.gstin}</div>
            )}
            {invoice.customer?.address && (
              <div className="text-slate-500">Address: {invoice.customer.address}</div>
            )}
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3">HSN</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Rate</th>
                <th className="py-2.5 px-3 text-right">GST %</th>
                <th className="py-2.5 px-3 text-right">Tax (₹)</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoice.lines?.map((line: any, idx: number) => (
                <tr key={line.id}>
                  <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-medium">{line.productName}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{line.hsnCode || '1905'}</td>
                  <td className="py-2.5 px-3 text-center font-mono">{line.quantity} {line.unit}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatINR(line.unitPrice)}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{line.taxRate}%</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{formatINR(line.taxAmount)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">{formatINR(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tax Summary & Invoice Totals */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="text-xs space-y-1 text-slate-500">
              <div className="font-bold text-slate-700 dark:text-slate-300">GST Breakdown (Intra-State)</div>
              <div>Central Tax (CGST): {formatINR(invoice.cgstAmount)}</div>
              <div>State Tax (SGST): {formatINR(invoice.sgstAmount)}</div>
              <div>Total Tax Amount: {formatINR(invoice.taxAmount)}</div>
              <div className="mt-3 text-[11px] text-slate-400 italic">
                Terms & Conditions: Goods once sold will only be exchanged within 7 days against original bill.
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-right">
              <div className="flex justify-between">
                <span>Subtotal (Gross):</span>
                <span className="font-mono">{formatINR(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discounts Applied:</span>
                  <span className="font-mono">-{formatINR(invoice.discountAmount)}</span>
                </div>
              )}
              {invoice.roundOff !== 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Round Off:</span>
                  <span className="font-mono">{invoice.roundOff > 0 ? `+${invoice.roundOff}` : invoice.roundOff}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200 text-slate-900 dark:text-slate-100 dark:border-slate-800">
                <span>Grand Total:</span>
                <span className="font-mono text-lg text-indigo-600 dark:text-indigo-400">
                  {formatINR(invoice.totalAmount)}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Payment Mode: <span className="font-semibold">{invoice.paymentMethod}</span> ({formatINR(invoice.paidAmount)} received)
              </div>
            </div>
          </div>

          {/* Authorized Signature Footer */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500 dark:border-slate-800">
            <div>
              <span>Customer Acknowledgement</span>
            </div>
            <div className="text-right">
              <div className="h-10"></div>
              <span className="font-semibold block text-slate-800 dark:text-slate-200">For {business?.name || 'ZYDEN RETAIL MART'}</span>
              <span className="text-[10px] text-slate-400">Authorised Signatory</span>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE DOCUMENT 2: Thermal 80mm Receipt */}
      {format === 'THERMAL' && (
        <div className="printable-receipt bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-[340px] mx-auto font-mono text-xs text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
          <div className="text-center space-y-0.5">
            <div className="font-bold text-sm tracking-wide">{business?.name || 'ZYDEN RETAIL MART'}</div>
            <div className="text-[10px] text-slate-500">{store?.address || 'Phoenix Grand Galleria, Mumbai'}</div>
            <div className="text-[10px] text-slate-500">GSTIN: {store?.gstin || '27AABCA1234F1Z8'}</div>
            <div className="text-[10px] text-slate-500">Phone: {store?.phone || '9820012345'}</div>
          </div>

          <div className="my-2 border-b border-dashed border-slate-300"></div>

          <div className="text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span>Inv: {invoice.invoiceNumber}</span>
              <span>{invoice.counter?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Date: {new Date(invoice.createdAt).toLocaleDateString()}</span>
              <span>{new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div>Cashier: {invoice.cashier?.name}</div>
            <div>Customer: {invoice.customer?.name || 'Retail Walk-in'}</div>
          </div>

          <div className="my-2 border-b border-dashed border-slate-300"></div>

          <div className="space-y-1 text-[11px]">
            {invoice.lines?.map((line: any) => (
              <div key={line.id} className="flex justify-between">
                <span className="truncate max-w-[190px]">{line.productName} x{line.quantity}</span>
                <span>{formatINR(line.lineTotal)}</span>
              </div>
            ))}
          </div>

          <div className="my-2 border-b border-dashed border-slate-300"></div>

          <div className="space-y-0.5 text-right text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatINR(invoice.subtotal)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span>-{formatINR(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 text-[10px]">
              <span>CGST + SGST:</span>
              <span>{formatINR(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
              <span>NET TOTAL:</span>
              <span>{formatINR(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[10px] pt-1">
              <span>Paid ({invoice.paymentMethod}):</span>
              <span>{formatINR(invoice.paidAmount)}</span>
            </div>
          </div>

          <div className="my-3 border-b border-dashed border-slate-300"></div>
          <div className="text-[10px] text-center text-slate-400">
            *** THANK YOU FOR VISITING ***<br />
            Have a pleasant day!
          </div>
        </div>
      )}
    </div>
  );
}
