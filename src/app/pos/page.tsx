'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Barcode,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  PauseCircle,
  PlayCircle,
  CreditCard,
  Banknote,
  QrCode,
  Tag,
  CheckCircle2,
  Printer,
  UserCheck,
  RefreshCw,
  AlertTriangle,
  Receipt,
  Layers,
  ArrowRight,
  X,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatINR } from '@/lib/formatters';

interface Product {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  hsnCode: string;
  unit: string;
  sellingPrice: number;
  mrp: number;
  taxRate: number;
  isTaxInclusive: boolean;
  categoryName: string;
  stockQuantity: number;
  minStockLevel: number;
}

interface CartItem extends Product {
  quantity: number;
  discountAmount: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  loyaltyPoints: number;
}

export default function PosBillingPage() {
  const [activeCounter, setActiveCounter] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD' | 'SPLIT'>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitUpi, setSplitUpi] = useState<string>('');
  const [splitCard, setSplitCard] = useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInvoice, setSuccessInvoice] = useState<any>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [heldBillsCount, setHeldBillsCount] = useState(0);
  const [heldBillsModalOpen, setHeldBillsModalOpen] = useState(false);
  const [heldBillsList, setHeldBillsList] = useState<any[]>([]);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // 1. Load initial products & held bills count
  useEffect(() => {
    loadProducts();
    loadHeldBills();
  }, [activeCounter, selectedCategory]);

  const loadProducts = async () => {
    try {
      let url = `/api/pos/products?`;
      if (selectedCategory !== 'ALL') url += `categoryId=${selectedCategory}&`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
        const uniqueCats = Array.from(new Set(data.products.map((p: Product) => p.categoryName))) as string[];
        setCategories(['ALL', ...uniqueCats]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadHeldBills = async () => {
    try {
      const res = await fetch(`/api/pos/held-bills?counterNumber=${activeCounter}`);
      const data = await res.json();
      if (data.heldBills) {
        setHeldBillsList(data.heldBills);
        setHeldBillsCount(data.heldBills.length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Barcode scanner submission
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const matched = products.find((p) => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase());
    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      // Try fetching from server
      fetch(`/api/pos/products?barcode=${code}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.products && d.products.length > 0) {
            addToCart(d.products[0]);
            setBarcodeInput('');
          } else {
            setErrorMsg(`No product found with barcode or SKU: "${code}"`);
            setTimeout(() => setErrorMsg(''), 4000);
          }
        });
    }
  };

  // 3. Add to cart
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1, discountAmount: 0 }];
      }
    });
    // Auto-focus barcode input for continuous supermarket scanning
    barcodeInputRef.current?.focus();
  };

  // 4. Update quantity
  const updateQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  // 5. Remove from cart
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // 6. Customer lookup
  const handleCustomerPhoneSearch = async (phone: string) => {
    setCustomerPhone(phone);
    if (phone.length === 10) {
      try {
        const res = await fetch(`/api/customers?q=${phone}`);
        const data = await res.json();
        if (data.customers && data.customers.length > 0) {
          setCustomer(data.customers[0]);
          setCustomerName(data.customers[0].name);
        } else {
          setCustomer(null);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  // 7. Apply coupon code
  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'WELCOME50') {
      setCouponApplied({ code, discount: 50 });
    } else if (code === 'FESTIVE10') {
      const disc = Math.min(250, Math.round(cartSubtotal * 0.1));
      setCouponApplied({ code, discount: disc });
    } else if (code === 'SUPER100') {
      setCouponApplied({ code, discount: 100 });
    } else {
      setErrorMsg(`Invalid or expired coupon code: ${code}`);
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  // 8. Calculations
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity - item.discountAmount,
    0
  );

  const appliedCouponDisc = couponApplied?.discount || 0;
  const totalDiscount = (Number(discountAmount) || 0) + appliedCouponDisc;

  // Approximate tax for tax inclusive items
  const totalTaxAmount = cart.reduce((sum, item) => {
    const itemNet = item.sellingPrice * item.quantity - item.discountAmount;
    const tax = (itemNet * item.taxRate) / (100 + item.taxRate);
    return sum + tax;
  }, 0);

  const cgstAmount = Math.round((totalTaxAmount / 2) * 100) / 100;
  const sgstAmount = Math.round((totalTaxAmount / 2) * 100) / 100;

  const rawPayable = Math.max(0, cartSubtotal - appliedCouponDisc - (Number(discountAmount) || 0));
  const finalPayable = Math.round(rawPayable);
  const roundOff = Math.round((finalPayable - rawPayable) * 100) / 100;

  // Change Calculation
  const tenderedVal = parseFloat(cashTendered) || 0;
  const changeDue = tenderedVal > finalPayable ? tenderedVal - finalPayable : 0;

  // 9. Hold Bill
  const handleHoldBill = async () => {
    if (!cart.length) return;
    try {
      const res = await fetch('/api/pos/held-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          counterNumber: activeCounter,
          customerName: customerName || 'Walk-in Customer',
          customerPhone,
          items: cart,
          subtotal: finalPayable,
        }),
      });
      if (res.ok) {
        setCart([]);
        setCustomer(null);
        setCustomerName('');
        setCustomerPhone('');
        setCouponApplied(null);
        loadHeldBills();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 10. Resume Held Bill
  const handleResumeBill = async (billId: string) => {
    try {
      const res = await fetch(`/api/pos/held-bills?id=${billId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.resumedBill) {
        setCart(data.resumedBill.items);
        setCustomerName(data.resumedBill.customerName || '');
        setCustomerPhone(data.resumedBill.customerPhone || '');
        setHeldBillsModalOpen(false);
        loadHeldBills();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 11. Final Checkout Submission
  const handleCheckout = async () => {
    if (!cart.length) return;
    setIsCheckingOut(true);
    setErrorMsg('');

    try {
      const payments = [];
      if (paymentMethod === 'SPLIT') {
        if (parseFloat(splitCash)) payments.push({ method: 'CASH', amount: parseFloat(splitCash) });
        if (parseFloat(splitUpi)) payments.push({ method: 'UPI', amount: parseFloat(splitUpi), referenceNumber: 'UPI/SPLIT' });
        if (parseFloat(splitCard)) payments.push({ method: 'CARD', amount: parseFloat(splitCard), referenceNumber: 'CARD/SPLIT' });
      }

      const checkoutPayload = {
        counterNumber: activeCounter,
        items: cart.map((c) => ({
          productId: c.id,
          productName: c.name,
          sku: c.sku,
          hsnCode: c.hsnCode,
          unit: c.unit,
          unitPrice: c.sellingPrice,
          quantity: c.quantity,
          discountAmount: c.discountAmount,
          taxRate: c.taxRate,
          isTaxInclusive: c.isTaxInclusive,
        })),
        customerPhone,
        customerName,
        discountAmount: Number(discountAmount) || 0,
        couponCode: couponApplied?.code || null,
        paymentMethod,
        paidAmount: tenderedVal > 0 ? tenderedVal : finalPayable,
        payments,
        idempotencyKey: `POS-${activeCounter}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      };

      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to complete checkout');
        setIsCheckingOut(false);
        return;
      }

      // Success!
      setSuccessInvoice(data.invoice);
      setPrintModalOpen(true);

      // Reset POS cart for next customer
      setCart([]);
      setCustomer(null);
      setCustomerName('');
      setCustomerPhone('');
      setCashTendered('');
      setDiscountAmount(0);
      setCouponApplied(null);
      setCouponCode('');
      setIsCheckingOut(false);

      // Refresh product stock
      loadProducts();
    } catch (e: any) {
      setErrorMsg(e.message || 'An unexpected error occurred during checkout');
      setIsCheckingOut(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row overflow-hidden bg-slate-100 dark:bg-slate-950">
      {/* LEFT SECTION: Catalog & Barcode Scanner */}
      <div className="flex-1 flex flex-col p-3 overflow-hidden border-r border-slate-200 dark:border-slate-800">
        {/* Top Controls: Active Counter, Barcode input, Quick Search */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-3 space-y-2.5 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active POS Counter:</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setActiveCounter(num)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-md transition ${
                      activeCounter === num
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    Counter {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Held Bills Badge */}
            <button
              onClick={() => setHeldBillsModalOpen(true)}
              className="flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Held Bills ({heldBillsCount})</span>
            </button>
          </div>

          {/* Barcode Scanner Input - Auto-focused for continuous supermarket billing */}
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 absolute left-3 top-3 text-indigo-600 dark:text-indigo-400" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan barcode with USB scanner or type code and press Enter..."
                className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-indigo-50/50 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-slate-100"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Search by Product Name & Category Pills */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, SKU..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full font-medium transition ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div className="mb-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Product Tiles Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pr-1">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stockQuantity <= 0;
            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && addToCart(p)}
                className={`bg-white p-2.5 rounded-xl border transition-all text-left flex flex-col justify-between dark:bg-slate-900 ${
                  isOutOfStock
                    ? 'opacity-60 border-rose-200 cursor-not-allowed dark:border-rose-900'
                    : 'border-slate-200 hover:border-indigo-500 hover:shadow-md cursor-pointer dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        isOutOfStock
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          : p.stockQuantity <= p.minStockLevel
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {p.stockQuantity} {p.unit}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-slate-800 line-clamp-2 mt-1 dark:text-slate-200">
                    {p.name}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-baseline justify-between dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">
                    GST {p.taxRate}%
                  </div>
                  <div className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                    {formatINR(p.sellingPrice)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SECTION: Cart, Customer & Payment Drawer */}
      <div className="w-full lg:w-[420px] bg-white flex flex-col h-full border-l border-slate-200 shadow-lg dark:bg-slate-900 dark:border-slate-800">
        {/* Customer Mobile Search */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/50 dark:bg-slate-950/40 dark:border-slate-800">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <UserCheck className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => handleCustomerPhoneSearch(e.target.value)}
                placeholder="Customer mobile (10 digits)..."
                maxLength={10}
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Name (Optional)"
              className="w-32 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
            />
          </div>

          {customer && (
            <div className="mt-2 text-xs flex items-center justify-between bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-md border border-indigo-200 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-300">
              <span className="font-semibold">{customer.name}</span>
              <span className="font-bold text-[11px] bg-white px-2 py-0.5 rounded shadow-sm text-indigo-700 dark:bg-slate-900 dark:text-indigo-300">
                ⭐ {customer.loyaltyPoints} Points
              </span>
            </div>
          )}
        </div>

        {/* Active Cart Line Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-12">
              <ShoppingCart className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300 dark:text-slate-700" />
              <div className="font-semibold text-sm text-slate-600 dark:text-slate-400">Cart is empty</div>
              <p className="text-xs text-slate-400 max-w-[200px]">
                Scan barcode or click items from the catalog to begin billing
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex flex-col space-y-1.5 dark:bg-slate-800/60 dark:border-slate-700"
              >
                <div className="flex justify-between items-start">
                  <div className="pr-2">
                    <div className="font-medium text-xs text-slate-800 dark:text-slate-200 leading-tight">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.barcode} | GST {item.taxRate}%
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {/* Quantity adjustment buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-slate-700 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="text-[11px] text-slate-400 pl-1">{item.unit}</span>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      {formatINR(item.sellingPrice * item.quantity)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      @{formatINR(item.sellingPrice)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary & Calculations */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2 dark:bg-slate-950 dark:border-slate-800">
          {/* Coupon / Promo Input */}
          <div className="flex gap-1.5">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Coupon (e.g. WELCOME50, FESTIVE10)"
              className="flex-1 px-2.5 py-1 text-xs uppercase font-mono bg-white border border-slate-200 rounded-lg focus:outline-none dark:bg-slate-900 dark:border-slate-700"
            />
            <button
              onClick={handleApplyCoupon}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition dark:bg-slate-800 dark:text-slate-300"
            >
              Apply
            </button>
          </div>

          {couponApplied && (
            <div className="text-[11px] flex justify-between items-center text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
              <span>Promo {couponApplied.code} Applied</span>
              <span className="font-bold">- {formatINR(couponApplied.discount)}</span>
            </div>
          )}

          {/* Breakdown Rows */}
          <div className="text-xs space-y-1 pt-1 text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Items ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
              <span>{formatINR(cartSubtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discounts</span>
                <span>- {formatINR(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>GST Included (CGST {formatINR(cgstAmount)} + SGST {formatINR(sgstAmount)})</span>
              <span>{formatINR(totalTaxAmount)}</span>
            </div>
            {roundOff !== 0 && (
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Round Off</span>
                <span>{roundOff > 0 ? `+${roundOff}` : roundOff}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200 text-base font-bold text-slate-900 dark:text-slate-100 dark:border-slate-800">
              <span>Grand Total</span>
              <span className="text-xl text-indigo-600 dark:text-indigo-400">
                {formatINR(finalPayable)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {(['CASH', 'UPI', 'CARD', 'SPLIT'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`py-1.5 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition ${
                  paymentMethod === method
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200 dark:ring-indigo-900'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {method === 'CASH' && <Banknote className="w-3.5 h-3.5 mb-0.5" />}
                {method === 'UPI' && <QrCode className="w-3.5 h-3.5 mb-0.5" />}
                {method === 'CARD' && <CreditCard className="w-3.5 h-3.5 mb-0.5" />}
                {method === 'SPLIT' && <Layers className="w-3.5 h-3.5 mb-0.5" />}
                <span>{method}</span>
              </button>
            ))}
          </div>

          {/* Cash Tendered & Change due calculation */}
          {paymentMethod === 'CASH' && (
            <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
              <div className="text-xs text-slate-500 font-medium">Cash Tendered:</div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder={finalPayable.toString()}
                  className="w-24 text-right px-2 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
                />
                {changeDue > 0 && (
                  <div className="text-xs font-bold text-emerald-600">
                    Change: {formatINR(changeDue)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Split Payment inputs */}
          {paymentMethod === 'SPLIT' && (
            <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1.5 dark:bg-slate-900 dark:border-slate-800 text-xs">
              <div className="flex justify-between items-center">
                <span>Cash:</span>
                <input
                  type="number"
                  value={splitCash}
                  onChange={(e) => setSplitCash(e.target.value)}
                  placeholder="0.00"
                  className="w-24 text-right px-2 py-0.5 border rounded"
                />
              </div>
              <div className="flex justify-between items-center">
                <span>UPI:</span>
                <input
                  type="number"
                  value={splitUpi}
                  onChange={(e) => setSplitUpi(e.target.value)}
                  placeholder="0.00"
                  className="w-24 text-right px-2 py-0.5 border rounded"
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Card:</span>
                <input
                  type="number"
                  value={splitCard}
                  onChange={(e) => setSplitCard(e.target.value)}
                  placeholder="0.00"
                  className="w-24 text-right px-2 py-0.5 border rounded"
                />
              </div>
            </div>
          )}

          {/* Action Buttons: Hold Bill & Checkout */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleHoldBill}
              disabled={cart.length === 0}
              className="px-3 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300"
              title="Hold / Suspend active bill to serve next customer"
            >
              <PauseCircle className="w-4 h-4" />
              <span>Hold</span>
            </button>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isCheckingOut}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {isCheckingOut ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>PAY {formatINR(finalPayable)}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Held Bills Manager */}
      {heldBillsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center dark:border-slate-800">
              <div className="font-bold text-base flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Suspended / Held Bills (Counter {activeCounter})</span>
              </div>
              <button onClick={() => setHeldBillsModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {heldBillsList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No held bills for this counter
                </div>
              ) : (
                heldBillsList.map((hb) => (
                  <div
                    key={hb.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between dark:bg-slate-800 dark:border-slate-700"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                        {hb.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {hb.itemCount} items | {new Date(hb.heldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-sm text-indigo-600">
                        {formatINR(hb.subtotal)}
                      </span>
                      <button
                        onClick={() => handleResumeBill(hb.id)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Instant Receipt & Tax Invoice Preview */}
      {printModalOpen && successInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-100">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="font-bold text-sm">Payment Successful!</div>
                  <div className="text-[11px] opacity-80">Invoice #{successInvoice.invoiceNumber}</div>
                </div>
              </div>
              <button
                onClick={() => setPrintModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Thermal Receipt Simulation (80mm standard) */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-950 font-mono text-xs">
              <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 text-slate-800 max-w-[340px] mx-auto text-center dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200">
                <div className="font-bold text-sm">ZYDEN RETAIL MART</div>
                <div className="text-[10px] text-slate-500">Phoenix Grand Galleria, Lower Parel, Mumbai</div>
                <div className="text-[10px] text-slate-500">GSTIN: 27AABCA1234F1Z8 | Phone: 9820012345</div>
                <div className="my-2 border-b border-dashed border-slate-300"></div>

                <div className="text-left text-[11px] space-y-0.5">
                  <div className="flex justify-between">
                    <span>Invoice: {successInvoice.invoiceNumber}</span>
                    <span>{successInvoice.counter?.name || 'Counter 1'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date: {new Date(successInvoice.createdAt).toLocaleString()}</span>
                  </div>
                  <div>Customer: {successInvoice.customer?.name || 'Walk-in'} ({successInvoice.customer?.phone || 'Retail'})</div>
                </div>

                <div className="my-2 border-b border-dashed border-slate-300"></div>

                <div className="text-left space-y-1">
                  {successInvoice.lines?.map((line: any) => (
                    <div key={line.id} className="flex justify-between text-[11px]">
                      <span className="truncate max-w-[190px]">{line.productName} x{line.quantity}</span>
                      <span>{formatINR(line.lineTotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="my-2 border-b border-dashed border-slate-300"></div>

                <div className="space-y-0.5 text-right text-[11px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatINR(successInvoice.subtotal)}</span>
                  </div>
                  {successInvoice.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>-{formatINR(successInvoice.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>CGST + SGST:</span>
                    <span>{formatINR(successInvoice.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                    <span>TOTAL:</span>
                    <span>{formatINR(successInvoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[10px] pt-1">
                    <span>Payment ({successInvoice.paymentMethod}):</span>
                    <span>{formatINR(successInvoice.paidAmount)}</span>
                  </div>
                  {successInvoice.changeAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold text-[10px]">
                      <span>Change Due:</span>
                      <span>{formatINR(successInvoice.changeAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="my-3 border-b border-dashed border-slate-300"></div>
                <div className="text-[10px] text-slate-400">
                  *** THANK YOU FOR SHOPPING WITH US ***<br />
                  FSSAI Lic: 11520018000452
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-3 bg-white border-t border-slate-200 flex justify-between dark:bg-slate-900 dark:border-slate-800">
              <button
                onClick={() => setPrintModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Close & Next Customer
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print 80mm Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
