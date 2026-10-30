'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import { formatDate } from '@/lib/formatters';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let url = '/api/audit-logs?';
      if (actionFilter !== 'ALL') url += `action=${actionFilter}&`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <span>Security & Operational Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable security trail of every financial checkout, stock adjustment, shift closing, and configuration update
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 dark:border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600 dark:text-slate-300">Filter Event Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none dark:bg-slate-800 dark:border-slate-700 font-medium"
          >
            <option value="ALL">All Recorded Actions</option>
            <option value="SALE_CREATE">Sales Checkout Finalized</option>
            <option value="SALE_RETURN">Returns & Refunds</option>
            <option value="STOCK_ADJUST">Manual Stock Adjustments</option>
            <option value="SHIFT_OPEN">Shift Opened</option>
            <option value="SHIFT_CLOSE">Shift Closed</option>
            <option value="GOODS_RECEIVE">Goods Receiving (GRN)</option>
            <option value="SETTINGS_UPDATE">Settings Modified</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          {logs.length} audit records logged
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No audit logs matching selection.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {log.userName || log.user?.name || 'System'}
                      {log.user?.role && (
                        <span className="text-[10px] text-slate-400 font-normal ml-1">({log.user.role})</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {log.entity}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-lg">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
