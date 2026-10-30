'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Barcode,
  Printer,
  Search,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { formatINR } from '@/lib/formatters';

export default function BarcodePrintPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [labelCopies, setLabelCopies] = useState(12);
  const [labelSize, setLabelSize] = useState<'50x25' | '38x25' | 'SHELF_TAG'>('50x25');
  const [showStoreName, setShowStoreName] = useState(true);
  const [showMrp, setShowMrp] = useState(true);

  useEffect(() => {
    fetch('/api/products?limit=100')
      .then((r) => r.json())
      .then((d) => {
        if (d.products?.length) {
          setProducts(d.products);
          setSelectedProduct(d.products[0]);
        }
      });
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Barcode className="w-6 h-6 text-indigo-600" />
            <span>Thermal Barcode & Label Designer</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate and print compliant barcode tags for products, packages, and supermarket shelf edges
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow flex items-center space-x-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print {labelCopies} Labels</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column - Hidden during print */}
        <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800 text-xs">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Label Configuration</span>
          </h2>

          <div>
            <label className="block font-semibold mb-1">Select Product to Print</label>
            <select
              value={selectedProduct?.id || ''}
              onChange={(e) => {
                const p = products.find((prod) => prod.id === e.target.value);
                if (p) setSelectedProduct(p);
              }}
              className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.barcode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Label Size</label>
              <select
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value as any)}
                className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="50x25">50mm x 25mm (Standard)</option>
                <option value="38x25">38mm x 25mm (Small)</option>
                <option value="SHELF_TAG">Shelf Edge Price Tag</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Number of Labels</label>
              <input
                type="number"
                min={1}
                max={100}
                value={labelCopies}
                onChange={(e) => setLabelCopies(parseInt(e.target.value) || 1)}
                className="w-full p-2 border rounded-lg font-mono font-bold bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showStoreName}
                onChange={(e) => setShowStoreName(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Print Store Branding on Header</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMrp}
                onChange={(e) => setShowMrp(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Display MRP along with Selling Price</span>
            </label>
          </div>
        </div>

        {/* Preview and Sheet Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="no-print text-xs font-semibold text-slate-500">
            Print Sheet Preview ({labelCopies} labels generated):
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px] dark:bg-slate-900 dark:border-slate-800">
            {selectedProduct ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: labelCopies }).map((_, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-300 p-2.5 rounded text-center flex flex-col justify-between bg-white text-black shadow-sm font-sans"
                    style={{
                      height: labelSize === '50x25' ? '120px' : labelSize === '38x25' ? '105px' : '140px',
                    }}
                  >
                    {showStoreName && (
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-700 truncate">
                        ZYDEN RETAIL MART
                      </div>
                    )}
                    <div className="text-[10px] font-bold line-clamp-2 leading-tight text-slate-900">
                      {selectedProduct.name}
                    </div>

                    {/* Barcode Graphic Simulation */}
                    <div className="my-1 flex flex-col items-center">
                      <div className="h-6 flex items-end justify-center space-x-0.5">
                        {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3].map((w, barIdx) => (
                          <span
                            key={barIdx}
                            className="bg-black"
                            style={{
                              width: `${w}px`,
                              height: barIdx % 3 === 0 ? '24px' : '20px',
                            }}
                          ></span>
                        ))}
                      </div>
                      <div className="font-mono text-[9px] font-bold tracking-widest text-slate-800">
                        {selectedProduct.barcode}
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between border-t border-slate-200 pt-0.5 text-[9px]">
                      {showMrp && (
                        <span className="text-slate-500 line-through">
                          MRP: {formatINR(selectedProduct.mrp)}
                        </span>
                      )}
                      <span className="font-bold text-xs text-black">
                        {formatINR(selectedProduct.sellingPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">
                Select a product to view label preview
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
