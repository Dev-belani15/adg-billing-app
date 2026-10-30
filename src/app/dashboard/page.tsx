'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Receipt,
  ShoppingCart,
  Percent,
  Banknote,
  QrCode,
  CreditCard,
  AlertTriangle,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { formatINR } from '@/lib/formatters';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/dashboard');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh] text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Loading Executive Retail Analytics...</span>
      </div>
    );
  }

  const { metrics, paymentMethods, counterPerformance, cashierPerformance, topSellingProducts, recentInvoices } = data;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Executive Business Analytics</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
              Live DB
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time performance across Mumbai Central Superstore & 4 active billing counters
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadDashboard}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/pos"
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Launch POS Terminal</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Gross Sales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatINR(metrics.grossSales)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Net: {formatINR(metrics.netSales)}</span>
          </div>
        </div>

        {/* Bills / Invoices */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Total Invoices</span>
            <Receipt className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {metrics.billCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Avg Bill: {formatINR(metrics.averageBillValue)}
          </div>
        </div>

        {/* GST Tax Collected */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">GST Collected</span>
            <Percent className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {formatINR(metrics.totalTax)}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Discounts: {formatINR(metrics.totalDiscount)}
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Stock Health</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {metrics.lowStockCount} Items Low
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            {metrics.totalProducts} Total Catalog Products
          </div>
        </div>
      </div>

      {/* Middle Row: Counter Performance & Payment Method Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Counter-wise Sales Performance (4 Counters) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 dark:bg-slate-900 dark:border-slate-800">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
            <span>Counter Performance (Shared Real-Time Stock)</span>
            <span className="text-[11px] text-slate-400 font-normal">Active Today</span>
          </h2>

          <div className="space-y-4">
            {counterPerformance.map((c: any, idx: number) => {
              const maxSales = Math.max(...counterPerformance.map((item: any) => item.sales), 1);
              const pct = Math.round((c.sales / maxSales) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatINR(c.sales)} ({c.bills} bills)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden dark:bg-slate-800">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(5, pct)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4">
              Payment Tender Breakdown
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl dark:bg-slate-800/60">
                <div className="flex items-center space-x-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium">Cash Collections</span>
                </div>
                <span className="font-bold font-mono">{formatINR(paymentMethods.CASH || 0)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl dark:bg-slate-800/60">
                <div className="flex items-center space-x-2">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  <span className="font-medium">UPI & Digital QR</span>
                </div>
                <span className="font-bold font-mono">{formatINR(paymentMethods.UPI || 0)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl dark:bg-slate-800/60">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Card Payments</span>
                </div>
                <span className="font-bold font-mono">{formatINR(paymentMethods.CARD || 0)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              href="/expenses"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View Daily Cashbook & Expenses →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Invoices Table & Fast-Moving Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices Table */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Recent Sales Invoices
            </h2>
            <Link
              href="/sales"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              View All Invoices →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Counter</th>
                  <th className="py-2.5 px-3">Cashier</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentInvoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {inv.counter?.name || 'Counter 1'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {inv.cashier?.name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {inv.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900 dark:text-slate-100">
                      {formatINR(inv.totalAmount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Link
                        href={`/sales/${inv.id}`}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium dark:text-indigo-400"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Fast-Moving Products */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
            <span>Fast Moving Items</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </h2>

          <div className="space-y-3">
            {topSellingProducts.map((p: any, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 line-clamp-1">
                    {p.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Units Sold: {p.qty}
                  </div>
                </div>
                <div className="font-bold font-mono text-xs text-indigo-600 dark:text-indigo-400">
                  {formatINR(p.revenue)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              href="/inventory"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
            >
              Inspect Live Stock Ledger →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
