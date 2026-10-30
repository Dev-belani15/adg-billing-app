'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Plus,
  Search,
  Filter,
  Barcode,
  RefreshCw,
  AlertTriangle,
  Printer,
  CheckCircle2,
  X,
  Upload,
} from 'lucide-react';
import { formatINR } from '@/lib/formatters';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [form, setForm] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    brandId: '',
    hsnCode: '1905',
    unit: 'PCS',
    costPrice: '',
    sellingPrice: '',
    mrp: '',
    taxRate: '5',
    isTaxInclusive: true,
    minStockLevel: '10',
    openingStock: '20',
  });

  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/products?`;
      if (selectedCategory !== 'ALL') url += `categoryId=${selectedCategory}&`;
      if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.products) setProducts(data.products);
      if (data.categories) setCategories(data.categories);
      if (data.brands) setBrands(data.brands);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create product');
      } else {
        setSuccessMsg(`Product "${form.name}" created successfully!`);
        setIsAddModalOpen(false);
        setForm({
          name: '',
          sku: '',
          barcode: '',
          categoryId: '',
          brandId: '',
          hsnCode: '1905',
          unit: 'PCS',
          costPrice: '',
          sellingPrice: '',
          mrp: '',
          taxRate: '5',
          isTaxInclusive: true,
          minStockLevel: '10',
          openingStock: '20',
        });
        loadProducts();
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error creating product');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" />
            <span>Product Catalog & Barcodes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage FMCG, grocery, HSN codes, GST tax rates, and purchase/selling pricing
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/barcode-print"
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
          >
            <Barcode className="w-4 h-4" />
            <span>Barcode Labels</span>
          </Link>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 dark:bg-slate-900 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadProducts()}
            placeholder="Search by product name, SKU, or scan barcode..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none dark:bg-slate-800 dark:border-slate-700"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={loadProducts}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No products found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4">Barcode</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">HSN</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-right">MRP</th>
                  <th className="py-3 px-4 text-right">GST %</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((p) => {
                  const isLow = p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0;
                  const isOut = p.stockQuantity <= 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{p.sku}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {p.barcode}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {p.category?.name || 'General'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {p.hsnCode || '1905'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {formatINR(p.costPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatINR(p.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {formatINR(p.mrp)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {p.taxRate}%
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isOut
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : isLow
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {p.stockQuantity} {p.unit}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center dark:border-slate-800">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">Add New Retail Product</h2>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Aashirvaad Shudh Chakki Atta 5kg"
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Barcode (EAN / UPC) *</label>
                  <input
                    type="text"
                    required
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    placeholder="8901030012345"
                    className="w-full p-2 border rounded-lg font-mono bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">SKU / Code *</label>
                  <input
                    type="text"
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="ATT-AAS-05K"
                    className="w-full p-2 border rounded-lg font-mono bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={form.hsnCode}
                    onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
                    placeholder="1905"
                    className="w-full p-2 border rounded-lg font-mono bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Unit of Measure</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="PCS">PCS (Pieces)</option>
                    <option value="PACK">PACK</option>
                    <option value="KG">KG (Kilogram)</option>
                    <option value="LTR">LTR (Litre)</option>
                    <option value="BOX">BOX</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    placeholder="230.00"
                    className="w-full p-2 border rounded-lg font-mono bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                    placeholder="265.00"
                    className="w-full p-2 border rounded-lg font-mono font-bold bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.mrp}
                    onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                    placeholder="290.00"
                    className="w-full p-2 border rounded-lg font-mono bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">GST Tax Rate</label>
                  <select
                    value={form.taxRate}
                    onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <option value="0">0% (Nil / Exempted)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Opening Stock</label>
                  <input
                    type="number"
                    value={form.openingStock}
                    onChange={(e) => setForm({ ...form, openingStock: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Min Alert Stock</label>
                  <input
                    type="number"
                    value={form.minStockLevel}
                    onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })}
                    className="w-full p-2 border rounded-lg font-mono bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
