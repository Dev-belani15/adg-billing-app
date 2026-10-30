'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Building2,
  FileSpreadsheet,
  Receipt,
  ShoppingCart,
  Printer,
  Sparkles,
} from 'lucide-react';

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 11;

  const steps = [
    { num: 1, title: 'Business Profile', desc: 'Business name and contact information' },
    { num: 2, title: 'GSTIN & Legal', desc: 'Legal entity and GST registration' },
    { num: 3, title: 'Store Addresses', desc: 'Registered and physical store addresses' },
    { num: 4, title: 'Invoice Numbering', desc: 'Series prefix and FY sequence setup' },
    { num: 5, title: 'Tax Profile', desc: 'CGST, SGST, IGST tax rates' },
    { num: 6, title: 'Receipt Branding', desc: 'Thermal receipt footer and logo' },
    { num: 7, title: 'Payment Methods', desc: 'Cash, UPI QR, Card terminal setup' },
    { num: 8, title: 'Billing Counters', desc: 'Four simultaneous POS billing counters' },
    { num: 9, title: 'Product Catalog', desc: 'Product creation and Excel/CSV import' },
    { num: 10, title: 'Opening Stock', desc: 'Initial authoritative stock balances' },
    { num: 11, title: 'Hardware Setup', desc: 'USB Barcode scanner and 80mm printer' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-indigo-600" />
            <span>Retailer Business Onboarding</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            11-Step Rapid Supermarket Deployment Wizard
          </p>
        </div>
        <div className="text-xs font-bold font-mono text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-300">
          Step {currentStep} of {totalSteps}
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 overflow-x-auto">
        <div className="flex items-center min-w-[700px] justify-between">
          {steps.map((s) => (
            <div
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className="flex flex-col items-center cursor-pointer group"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs transition ${
                  currentStep === s.num
                    ? 'bg-indigo-600 text-white shadow-md'
                    : currentStep > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                }`}
              >
                {currentStep > s.num ? '✓' : s.num}
              </div>
              <span className="text-[10px] font-semibold text-slate-600 mt-1 truncate max-w-[65px] text-center dark:text-slate-400">
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Step Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-4 text-xs">
        <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Step {currentStep}: {steps[currentStep - 1].title}
          </h2>
          <p className="text-slate-500 text-xs">{steps[currentStep - 1].desc}</p>
        </div>

        {currentStep === 1 && (
          <div className="space-y-3">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800">
              <span className="font-bold text-indigo-900 dark:text-indigo-200 block mb-1">
                Active Store Identity: Zyden Retail Mart
              </span>
              <p className="text-indigo-700 dark:text-indigo-300">
                Configured with 4 simultaneous POS billing counters, shared live stock ledger, and complete Indian GST compliance.
              </p>
            </div>
          </div>
        )}

        {currentStep >= 2 && (
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Configured Settings Verified & Active:
              </div>
              <div className="mt-2 space-y-1 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                <div>• GSTIN: 27AABCA1234F1Z8 (Maharashtra State Intra-State & Inter-State)</div>
                <div>• Invoice Prefix: ZYD- | Next Invoice: ZYD-1042</div>
                <div>• Four Billing Counters: Counter 1, 2, 3, 4</div>
                <div>• USB Barcode Scanner Input: Automatic Enter Detection</div>
                <div>• Authoritative Stock Invariant: Negative Stock Prevention Active</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 border rounded-xl font-semibold flex items-center space-x-1 disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center space-x-1 shadow"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/pos"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center space-x-1 shadow"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Launch POS Billing Terminal</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
