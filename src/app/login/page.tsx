'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('owner@zyden.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Login failed');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Login error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden dark:bg-slate-900 dark:border-slate-800 p-8 space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto shadow-md">
            Z
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Zyden Retail ERP & POS
          </h1>
          <p className="text-xs text-slate-500">
            Sign in to access your supermarket counter or owner analytics
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@zyden.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-indigo-600 font-semibold hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Accounts Switcher */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
            Quick 1-Click Demo Profiles
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              onClick={() => handleQuickLogin('owner@zyden.com')}
              className="p-2 border rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:border-slate-700"
            >
              <div className="font-bold text-slate-800 dark:text-slate-200">Aditya (Owner)</div>
              <div className="text-slate-400 text-[10px]">Full Access</div>
            </button>
            <button
              onClick={() => handleQuickLogin('cashier1@zyden.com')}
              className="p-2 border rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:border-slate-700"
            >
              <div className="font-bold text-slate-800 dark:text-slate-200">Suresh (Cashier 1)</div>
              <div className="text-slate-400 text-[10px]">Express POS Terminal</div>
            </button>
            <button
              onClick={() => handleQuickLogin('manager@zyden.com')}
              className="p-2 border rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:border-slate-700"
            >
              <div className="font-bold text-slate-800 dark:text-slate-200">Pooja (Manager)</div>
              <div className="text-slate-400 text-[10px]">Shift & Approval</div>
            </button>
            <button
              onClick={() => handleQuickLogin('inventory@zyden.com')}
              className="p-2 border rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:border-slate-700"
            >
              <div className="font-bold text-slate-800 dark:text-slate-200">Ganesh (Storekeeper)</div>
              <div className="text-slate-400 text-[10px]">GRN & Inward Stock</div>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3 dark:bg-slate-900 dark:border-slate-800 text-xs">
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">Staff Account Recovery</h2>
            <p className="text-slate-500">
              For security in retail supermarket environments, cashier passwords can be reset directly by the Store Manager or Owner from the Staff & Permissions panel.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Default demo credential for all roles: <span className="font-bold text-indigo-600">admin123</span>
            </div>
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="w-full py-2 bg-indigo-600 text-white font-semibold rounded-xl"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
