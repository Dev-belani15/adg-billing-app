'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Barcode,
  Search,
  RefreshCw,
  Boxes,
} from 'lucide-react';

export default function StockCountPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [barcodeScan, setBarcodeScan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory/stock-count');
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
        const inProgress = data.sessions.find((s: any) => s.status === 'IN_PROGRESS');
        if (inProgress) setActiveSession(inProgress);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/inventory/stock-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'START', notes: 'Store Physical Stock Audit' }),
      });
      const data = await res.json();
      if (res.ok && data.session) {
        setActiveSession(data.session);
        loadSessions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCountChange = (lineId: string, count: number) => {
    if (!activeSession) return;
    const updatedLines = activeSession.lines.map((l: any) => {
      if (l.id === lineId) {
        const counted = Math.max(0, count);
        return {
          ...l,
          countedQty: counted,
          differenceQty: counted - l.expectedQty,
        };
      }
      return l;
    });
    setActiveSession({ ...activeSession, lines: updatedLines });
  };

  const handleScanBarcode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeScan.trim() || !activeSession) return;

    const matchedLine = activeSession.lines.find(
      (l: any) => l.product?.barcode === barcodeScan.trim()
    );

    if (matchedLine) {
      handleCountChange(matchedLine.id, matchedLine.countedQty + 1);
      setMessage(`Incremented count for ${matchedLine.product.name}`);
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage(`No item with barcode ${barcodeScan} found in this session`);
      setTimeout(() => setMessage(''), 3000);
    }
    setBarcodeScan('');
  };

  const handleCommitSession = async () => {
    if (!activeSession) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/inventory/stock-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'COMMIT',
          sessionId: activeSession.id,
          lines: activeSession.lines,
        }),
      });
      if (res.ok) {
        setMessage('Stock count successfully reconciled and committed to authoritative ledger!');
        setActiveSession(null);
        loadSessions();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-indigo-600" />
            <span>Physical Stock Count & Audit Sessions</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Barcode-driven physical stock count with discrepancy detection and ledger reconciliation
          </p>
        </div>

        {!activeSession && (
          <button
            onClick={handleStartSession}
            disabled={submitting}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Audit Session</span>
          </button>
        )}
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Active Audit Session Workspace */}
      {activeSession ? (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800">
            <div>
              <div className="font-bold text-sm text-indigo-950 dark:text-indigo-200">
                Active Session: {activeSession.sessionCode}
              </div>
              <div className="text-xs text-indigo-700 dark:text-indigo-300">
                Started by {activeSession.startedBy} | Scan barcodes or enter verified counts below
              </div>
            </div>
            <button
              onClick={handleCommitSession}
              disabled={submitting}
              className="mt-2 sm:mt-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow"
            >
              {submitting ? 'Reconciling...' : 'Approve & Commit Adjustments'}
            </button>
          </div>

          {/* Quick Scanner Barcode input */}
          <form onSubmit={handleScanBarcode} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={barcodeScan}
                onChange={(e) => setBarcodeScan(e.target.value)}
                placeholder="Scan item barcode with USB scanner to increment physical count (+1)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-lg"
            >
              Scan & Count
            </button>
          </form>

          {/* Lines Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3 font-mono">Barcode</th>
                  <th className="py-2.5 px-3 text-center">Expected Qty</th>
                  <th className="py-2.5 px-3 text-center">Counted Qty</th>
                  <th className="py-2.5 px-3 text-center">Discrepancy (Variance)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeSession.lines?.map((line: any) => {
                  const diff = line.countedQty - line.expectedQty;
                  return (
                    <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {line.product?.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {line.product?.barcode}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {line.expectedQty}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          value={line.countedQty}
                          onChange={(e) => handleCountChange(line.id, parseInt(e.target.value) || 0)}
                          className="w-20 text-center font-mono font-bold py-1 bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 dark:bg-slate-800 dark:border-slate-700"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        {diff === 0 ? (
                          <span className="text-emerald-600 font-semibold">Matched (0)</span>
                        ) : diff > 0 ? (
                          <span className="text-blue-600 font-bold">+{diff} (Surplus)</span>
                        ) : (
                          <span className="text-rose-600 font-bold">{diff} (Shortage)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Prior Completed Sessions History */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-700 dark:text-slate-300 dark:border-slate-800">
            Audit History & Reconciled Sessions
          </div>
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No prior audit sessions.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Session Code</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Started By</th>
                    <th className="py-3 px-4">Approved By</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {s.sessionCode}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{s.startedBy}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{s.approvedBy || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{s.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
