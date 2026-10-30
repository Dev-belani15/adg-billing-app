'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  RotateCcw,
  Package,
  Boxes,
  History,
  ClipboardCheck,
  ShoppingBag,
  Truck,
  Users,
  UserCheck,
  Tag,
  Wallet,
  Clock,
  ShieldAlert,
  FileSpreadsheet,
  BarChart3,
  Barcode,
  Building2,
  Bell,
  Printer,
  Settings,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Wifi,
  Sparkles,
  Sun,
  Moon,
  Menu,
  X,
  FileCheck2,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>({
    name: 'Aditya Sharma',
    role: 'OWNER',
    email: 'owner@zyden.com',
  });
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [selectedCounter, setSelectedCounter] = useState(1);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Load session info
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setCurrentUser(d.user);
      })
      .catch(() => {});

    // Notification count
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((d) => {
        if (d.unreadCount !== undefined) setUnreadNotifications(d.unreadCount);
      })
      .catch(() => {});
  }, []);

  const handleRoleSwitch = async (email: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'admin123' }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  interface NavItem {
    href: string;
    label: string;
    icon: any;
    badge?: string;
    count?: number;
  }

  interface NavGroup {
    label: string;
    items: NavItem[];
  }

  const navGroups: NavGroup[] = [
    {
      label: 'BILLING & SALES',
      items: [
        { href: '/pos', label: 'POS Terminal', icon: ShoppingCart, badge: 'Counter 1-4' },
        { href: '/pos/held-bills', label: 'Held Bills', icon: Clock },
        { href: '/sales', label: 'Sales Invoices', icon: Receipt },
        { href: '/returns', label: 'Returns & Credit Notes', icon: RotateCcw },
      ],
    },
    {
      label: 'INVENTORY & CATALOG',
      items: [
        { href: '/products', label: 'Product Catalog', icon: Package },
        { href: '/inventory', label: 'Live Stock & Valuation', icon: Boxes },
        { href: '/inventory/movements', label: 'Stock Movement Ledger', icon: History },
        { href: '/inventory/stock-count', label: 'Stock Audit Sessions', icon: ClipboardCheck },
        { href: '/barcode-print', label: 'Barcode Label Designer', icon: Barcode },
      ],
    },
    {
      label: 'PROCUREMENT & EXPENSES',
      items: [
        { href: '/purchases', label: 'Purchase Orders', icon: ShoppingBag },
        { href: '/purchases/receive', label: 'Goods Receiving (GRN)', icon: Truck },
        { href: '/suppliers', label: 'Suppliers & Payables', icon: Users },
        { href: '/expenses', label: 'Expenses & Cashbook', icon: Wallet },
      ],
    },
    {
      label: 'RELATIONSHIPS & PROMOS',
      items: [
        { href: '/customers', label: 'Customers & Loyalty', icon: UserCheck },
        { href: '/loyalty-promotions', label: 'Promotions & Coupons', icon: Tag },
      ],
    },
    {
      label: 'REPORTS & COMPLIANCE',
      items: [
        { href: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { href: '/reports/gst', label: 'GST & Tax Reports', icon: FileSpreadsheet, badge: 'GSTR-1' },
        { href: '/reports', label: 'Business Analytics', icon: BarChart3 },
        { href: '/shifts', label: 'Cashier Shifts', icon: Clock },
      ],
    },
    {
      label: 'ADMIN & OPERATIONS',
      items: [
        { href: '/staff', label: 'Staff & Roles', icon: ShieldAlert },
        { href: '/branches', label: 'Branches & Transfers', icon: Building2 },
        { href: '/notifications', label: 'Notification Center', icon: Bell, count: unreadNotifications },
        { href: '/settings/hardware', label: 'Hardware & Printers', icon: Printer },
        { href: '/settings', label: 'Store Configuration', icon: Settings },
        { href: '/audit-logs', label: 'Security Audit Logs', icon: ShieldCheck },
        { href: '/onboarding', label: 'Business Onboarding', icon: FileCheck2 },
      ],
    },
  ];

  const isPosPage = pathname === '/pos';

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 text-slate-900 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : ''}`}>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              Z
            </div>
            <div>
              <div className="font-bold text-base leading-tight tracking-tight flex items-center gap-1.5">
                <span>Zyden Retail ERP</span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
                  ADG
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Mumbai Central Superstore
              </div>
            </div>
          </Link>

          {/* Quick Counter Selector for Cashiers */}
          <div className="hidden lg:flex items-center space-x-1 pl-4 border-l border-slate-200 dark:border-slate-700">
            {[1, 2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => {
                  setSelectedCounter(num);
                  if (pathname !== '/pos') router.push(`/pos?counter=${num}`);
                }}
                className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all ${
                  selectedCounter === num
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200 dark:ring-indigo-900'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                Counter {num}
              </button>
            ))}
          </div>
        </div>

        {/* Status Indicators & Session Controls */}
        <div className="flex items-center space-x-3">
          {/* Live Sync Status */}
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400">
            <Wifi className="w-3.5 h-3.5 animate-pulse" />
            <span>Live Stock Sync Active</span>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="relative group">
            <button className="flex items-center space-x-1.5 text-xs font-medium px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 transition">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold">{currentUser?.name?.split(' ')[0] || 'User'}</span>
              <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">({currentUser?.role || 'STAFF'})</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-xl border border-slate-200 p-1.5 hidden group-hover:block z-50 text-xs dark:bg-slate-900 dark:border-slate-700">
              <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Demo User
              </div>
              <button
                onClick={() => handleRoleSwitch('owner@zyden.com')}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between"
              >
                <span>Aditya Sharma</span>
                <span className="font-semibold text-indigo-600">OWNER</span>
              </button>
              <button
                onClick={() => handleRoleSwitch('manager@zyden.com')}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between"
              >
                <span>Pooja Kulkarni</span>
                <span className="font-semibold text-indigo-600">MANAGER</span>
              </button>
              <button
                onClick={() => handleRoleSwitch('cashier1@zyden.com')}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between"
              >
                <span>Suresh Patil</span>
                <span className="font-semibold text-emerald-600">CASHIER 1</span>
              </button>
              <button
                onClick={() => handleRoleSwitch('inventory@zyden.com')}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between"
              >
                <span>Ganesh More</span>
                <span className="font-semibold text-amber-600">STOREKEEPER</span>
              </button>
              <button
                onClick={() => handleRoleSwitch('accountant@zyden.com')}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex justify-between"
              >
                <span>Sunil Mehta</span>
                <span className="font-semibold text-blue-600">ACCOUNTANT</span>
              </button>
            </div>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Link */}
          <Link
            href="/notifications"
            className="relative p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            )}
          </Link>

          {/* Direct POS Billing Button */}
          {!isPosPage && (
            <Link
              href="/pos"
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Go to POS</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside
          className={`w-64 bg-white border-r border-slate-200 flex flex-col justify-between overflow-y-auto no-print dark:bg-slate-900 dark:border-slate-800 ${
            isMobileMenuOpen ? 'fixed inset-y-0 left-0 z-50 shadow-2xl' : 'hidden md:flex'
          }`}
        >
          <div className="p-3 space-y-4">
            {navGroups.map((group, idx) => (
              <div key={idx}>
                <div className="px-2.5 mb-1.5 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-4 border-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded dark:bg-slate-800 dark:text-slate-300">
                            {item.badge}
                          </span>
                        )}
                        {item.count && item.count > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 bg-rose-500 text-white rounded-full">
                            {item.count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50 dark:bg-slate-950/40 dark:border-slate-800 text-[11px] text-slate-500">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300">ADG Retail ERP v1.0</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-medium">READY</span>
            </div>
            <div>GSTIN: 27AABCA1234F1Z8</div>
            <div className="mt-2 text-[10px] text-slate-400">
              © 2026 Zyden IT Solutions
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
