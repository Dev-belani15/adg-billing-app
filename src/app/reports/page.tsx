'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Boxes,
  PieChart,
  Calendar,
  Download,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { formatINR } from '@/lib/formatters';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/dashboard')
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-center text-slate-400 text-xs">Loading analytics reports...</div>;
  }

  const { metrics, categories, topSellingProducts, counterPerformance } = data;

  // Approximate gross profit estimate: revenue - estimated 75% cost
  const estimatedCost = metrics.grossSales * 0.78;
  const estimatedGrossProfit = Math.max(0, metrics.netSales - estimatedCost);
  const estimatedMarginPct = metrics.netSales > 0 ? Math.round((estimatedGrossProfit / metrics.netSales) * 100) : 22;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <span>Business Reports & Profit Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gross profit estimations, inventory turnover, category performance, and collections
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print Summary</span>
        </button>
      </div>

      {/* Profit & Margin KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Net Sales Realised</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {formatINR(metrics.netSales)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Estimated Gross Profit</div>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {formatINR(estimatedGrossProfit)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Estimated Gross Margin</div>
          <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            ~{estimatedMarginPct}% Margin
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
            <span>Category Catalog Distribution</span>
            <PieChart className="w-4 h-4 text-slate-400" />
          </h2>

          <div className="space-y-3">
            {categories.map((c: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl dark:bg-slate-800/60 text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {c.count} Products Listed
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Counter Performance Share */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-4 flex items-center justify-between">
            <span>Billing Terminal Collections</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </h2>

          <div className="space-y-3">
            {counterPerformance.map((c: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl dark:bg-slate-800/60 text-xs">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{c.bills} transactions billed</div>
                </div>
                <div className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {formatINR(c.sales)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
