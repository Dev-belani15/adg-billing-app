'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.notifications) setNotifications(data.notifications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            <span>Notification & Alert Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational alerts for low stock thresholds, shift variances, and pending approvals
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200"
        >
          <CheckCheck className="w-4 h-4 text-emerald-600" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-white p-12 text-center text-slate-400 text-xs rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            No active alerts at this time.
          </div>
        ) : (
          notifications.map((n) => {
            const isLowStock = n.type === 'LOW_STOCK';
            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border flex items-start justify-between transition-all ${
                  !n.isRead
                    ? 'bg-white border-indigo-200 shadow-sm dark:bg-slate-900 dark:border-indigo-900/60'
                    : 'bg-slate-50/70 border-slate-200 opacity-80 dark:bg-slate-900/40 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-xl mt-0.5 ${
                      isLowStock
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    }`}
                  >
                    {isLowStock ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>{n.title}</span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                      {n.message}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      {formatDate(n.createdAt)}
                    </div>
                  </div>
                </div>

                {n.link && (
                  <Link
                    href={n.link}
                    className="flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
