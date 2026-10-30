'use client';

import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Building2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { formatINR } from '@/lib/formatters';

export default function GstReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'GSTR3B' | 'HSN' | 'B2C' | 'B2B'>('GSTR3B');

  useEffect(() => {
    loadGstReport();
  }, []);

  const loadGstReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/gst');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data?.hsnSummary) return;
    const headers = ['HSN Code', 'Description', 'UQC', 'Total Qty', 'Total Value (INR)', 'Taxable Value (INR)', 'CGST (INR)', 'SGST (INR)', 'Total Tax (INR)'];
    const rows = data.hsnSummary.map((h: any) => [
      h.hsnCode,
      `"${h.description}"`,
      h.unit,
      h.totalQty,
      h.totalValue,
      h.taxableValue,
      h.cgst,
      h.sgst,
      h.totalTax,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e: any[]) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GSTR1_HSN_Summary_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh] text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading GST Compliance & Tax Reports...</span>
      </div>
    );
  }

  const { summary, gstr3b, hsnSummary, b2bInvoices, b2cInvoices, disclaimer } = data;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            <span>Indian GST Compliance & Tax Reports</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            GSTR-1 prepared data, GSTR-3B monthly outward supply summary, and HSN-wise tax ledger
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Compliance Disclaimer Alert */}
      <div className="no-print p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start space-x-2.5 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Statutory Notice: </span>
          {disclaimer} Exported records should be validated with your registered Indian chartered accountant before filing GST returns on the GSTN portal.
        </div>
      </div>

      {/* High-Level Tax Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Total Taxable Turnover</div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatINR(summary.totalTaxable)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Central Tax (CGST)</div>
          <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {formatINR(summary.totalCgst)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="text-xs text-slate-500 mb-1">State Tax (SGST)</div>
          <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {formatINR(summary.totalSgst)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Total GST Collected</div>
          <div className="text-xl font-bold font-mono text-emerald-600">
            {formatINR(summary.totalTax)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="no-print flex border-b border-slate-200 space-x-4 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('GSTR3B')}
          className={`pb-2 transition ${
            activeTab === 'GSTR3B'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          GSTR-3B Outward Supplies Summary
        </button>
        <button
          onClick={() => setActiveTab('HSN')}
          className={`pb-2 transition ${
            activeTab === 'HSN'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          HSN-Wise Tax Breakdown (Table 12)
        </button>
        <button
          onClick={() => setActiveTab('B2C')}
          className={`pb-2 transition ${
            activeTab === 'B2C'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          B2C Small Retail Invoices ({b2cInvoices.length})
        </button>
        <button
          onClick={() => setActiveTab('B2B')}
          className={`pb-2 transition ${
            activeTab === 'B2B'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          B2B Registered Invoices ({b2bInvoices.length})
        </button>
      </div>

      {/* Tab 1: GSTR-3B Format */}
      {activeTab === 'GSTR3B' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 dark:text-slate-200 dark:border-slate-800">
            Table 3.1: Details of Outward Supplies and inward supplies liable to reverse charge
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Nature of Supplies</th>
                <th className="py-3 px-4 text-right">Total Taxable Value (₹)</th>
                <th className="py-3 px-4 text-right">Integrated Tax (₹)</th>
                <th className="py-3 px-4 text-right">Central Tax (₹)</th>
                <th className="py-3 px-4 text-right">State/UT Tax (₹)</th>
                <th className="py-3 px-4 text-right">Cess (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              <tr>
                <td className="py-3.5 px-4 font-sans text-slate-900 dark:text-slate-100 font-medium">
                  {gstr3b.natureOfSupplies}
                </td>
                <td className="py-3.5 px-4 text-right font-bold">{formatINR(gstr3b.taxableValue)}</td>
                <td className="py-3.5 px-4 text-right">{formatINR(gstr3b.igst)}</td>
                <td className="py-3.5 px-4 text-right text-indigo-600 dark:text-indigo-400 font-bold">{formatINR(gstr3b.cgst)}</td>
                <td className="py-3.5 px-4 text-right text-indigo-600 dark:text-indigo-400 font-bold">{formatINR(gstr3b.sgst)}</td>
                <td className="py-3.5 px-4 text-right text-slate-400">₹0.00</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: HSN Summary */}
      {activeTab === 'HSN' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 dark:text-slate-200 dark:border-slate-800">
            Table 12: HSN-wise Summary of Outward Supplies
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">HSN Code</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">UQC</th>
                  <th className="py-2.5 px-3 text-right">Total Qty</th>
                  <th className="py-2.5 px-3 text-right">Total Value (₹)</th>
                  <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                  <th className="py-2.5 px-3 text-right">CGST (₹)</th>
                  <th className="py-2.5 px-3 text-right">SGST (₹)</th>
                  <th className="py-2.5 px-3 text-right">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {hsnSummary.map((h: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">{h.hsnCode}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-800 dark:text-slate-200">{h.description}</td>
                    <td className="py-2.5 px-3">{h.unit}</td>
                    <td className="py-2.5 px-3 text-right">{h.totalQty}</td>
                    <td className="py-2.5 px-3 text-right">{formatINR(h.totalValue)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">{formatINR(h.taxableValue)}</td>
                    <td className="py-2.5 px-3 text-right text-indigo-600">{formatINR(h.cgst)}</td>
                    <td className="py-2.5 px-3 text-right text-indigo-600">{formatINR(h.sgst)}</td>
                    <td className="py-2.5 px-3 text-right font-bold">{h.taxRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: B2C Invoices */}
      {activeTab === 'B2C' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 dark:text-slate-200 dark:border-slate-800">
            Table 7: B2C (Others) Outward Supplies
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Taxable Value</th>
                  <th className="py-2.5 px-3 text-right">CGST</th>
                  <th className="py-2.5 px-3 text-right">SGST</th>
                  <th className="py-2.5 px-3 text-right">Invoice Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {b2cInvoices.map((inv: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-bold text-indigo-600">{inv.invoiceNumber}</td>
                    <td className="py-2.5 px-3 text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3 font-sans">{inv.customerName}</td>
                    <td className="py-2.5 px-3 text-right">{formatINR(inv.taxableValue)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatINR(inv.cgst)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatINR(inv.sgst)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">{formatINR(inv.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: B2B Invoices */}
      {activeTab === 'B2B' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-800 dark:text-slate-200 dark:border-slate-800">
            Table 4: Taxable outward supplies made to registered persons (B2B)
          </div>
          {b2bInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No B2B invoices recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">GSTIN/UIN</th>
                    <th className="py-2.5 px-3">Receiver Name</th>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Invoice Date</th>
                    <th className="py-2.5 px-3 text-right">Invoice Value</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-right">Total Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {b2bInvoices.map((inv: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-bold">{inv.customerGstin}</td>
                      <td className="py-2.5 px-3 font-sans">{inv.customerName}</td>
                      <td className="py-2.5 px-3 font-bold text-indigo-600">{inv.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-slate-500">{new Date(inv.date).toLocaleDateString()}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{formatINR(inv.totalAmount)}</td>
                      <td className="py-2.5 px-3 text-right">{formatINR(inv.taxableValue)}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600">{formatINR(inv.totalTax)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
