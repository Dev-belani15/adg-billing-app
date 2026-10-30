'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  StopCircle,
  Banknote,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';
import { formatINR, formatDate } from '@/lib/formatters';

export default function CashierShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [counters, setCounters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedCounterId, setSelectedCounterId] = useState('');
  const [openingCash, setOpeningCash] = useState('2000');
  const [selectedShiftToClose, setSelectedShiftToClose] = useState<any>(null);
  const [actualCashCounted, setActualCashCounted] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Cash Denomination Calculator
  const [denominations, setDenominations] = useState<{ [key: number]: number }>({
    500: 2,
    200: 3,
    100: 4,
    50: 0,
    20: 0,
    10: 0,
  });

  useEffect(() => {
    loadShifts();
    fetch('/api/branches')
      .then((r) => r.json())
      .then((d) => {
        if (d.stores && d.stores[0]?.counters) {
          setCounters(d.stores[0].counters);
          setSelectedCounterId(d.stores[0].counters[0].id);
        }
      });
  }, []);

  const loadShifts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shifts');
      const data = await res.json();
      if (data.shifts) setShifts(data.shifts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'OPEN',
          counterId: selectedCounterId,
          openingCash: parseFloat(openingCash) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to open shift');
      } else {
        setOpenModalOpen(false);
        loadShifts();
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error opening shift');
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftToClose) return;
    setErrorMsg('');
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLOSE',
          shiftId: selectedShiftToClose.id,
          actualCash: parseFloat(actualCashCounted) || 0,
          notes: closeNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to close shift');
      } else {
        setCloseModalOpen(false);
        setSelectedShiftToClose(null);
        setActualCashCounted('');
        loadShifts();
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error closing shift');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            <span>Cashier Shifts & Cash Drawer Reconciliation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift opening floats, cash drops, expected vs counted cash, and discrepancy auditing
          </p>
        </div>

        <button
          onClick={() => setOpenModalOpen(true)}
          className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow transition"
        >
          <Play className="w-4 h-4" />
          <span>Open New Shift</span>
        </button>
      </div>

      {/* Shifts History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading shifts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 dark:bg-slate-800/60 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Counter</th>
                  <th className="py-3 px-4">Cashier</th>
                  <th className="py-3 px-4">Opened At</th>
                  <th className="py-3 px-4">Closed At</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Opening Float</th>
                  <th className="py-3 px-4 text-right">Total Sales</th>
                  <th className="py-3 px-4 text-right">Expected Cash</th>
                  <th className="py-3 px-4 text-right">Actual Counted</th>
                  <th className="py-3 px-4 text-center">Variance</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {shifts.map((s) => {
                  const isOpen = s.status === 'OPEN';
                  const diff = s.cashDifference || 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {s.counter?.name}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {s.user?.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDate(s.openedAt)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {s.closedAt ? formatDate(s.closedAt) : 'Currently Active'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isOpen
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatINR(s.openingCash)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatINR(s.totalSales)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        {formatINR(s.expectedCash)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        {s.actualCash !== null ? formatINR(s.actualCash) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        {isOpen ? (
                          <span className="text-slate-400">-</span>
                        ) : diff === 0 ? (
                          <span className="text-emerald-600">₹0 (Matched)</span>
                        ) : diff > 0 ? (
                          <span className="text-blue-600">+{formatINR(diff)} (Surplus)</span>
                        ) : (
                          <span className="text-rose-600">{formatINR(diff)} (Shortage)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isOpen && (
                          <button
                            onClick={() => {
                              setSelectedShiftToClose(s);
                              setActualCashCounted(s.expectedCash.toString());
                              setCloseModalOpen(true);
                            }}
                            className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg dark:bg-rose-950 dark:text-rose-300"
                          >
                            Close Shift
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Open Shift Modal */}
      {openModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center dark:border-slate-800">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">Open Cashier Shift</h2>
              <button onClick={() => setOpenModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="p-5 space-y-3 text-xs">
              {errorMsg && (
                <div className="p-2 bg-rose-50 text-rose-700 rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold mb-1">Select Billing Counter *</label>
                <select
                  required
                  value={selectedCounterId}
                  onChange={(e) => setSelectedCounterId(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                >
                  {counters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Opening Cash Float (₹) *</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono font-bold bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setOpenModalOpen(false)}
                  className="px-4 py-2 border rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow"
                >
                  Open Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {closeModalOpen && selectedShiftToClose && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center dark:border-slate-800">
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Close Shift: {selectedShiftToClose.counter?.name}
              </h2>
              <button onClick={() => setCloseModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="p-5 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 dark:bg-slate-800 dark:border-slate-700">
                <div className="flex justify-between">
                  <span>Opening Float:</span>
                  <span className="font-mono font-bold">{formatINR(selectedShiftToClose.openingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Sales:</span>
                  <span className="font-mono font-bold">{formatINR(selectedShiftToClose.cashSales)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold dark:border-slate-700">
                  <span>Expected Cash in Drawer:</span>
                  <span className="font-mono text-indigo-600">{formatINR(selectedShiftToClose.expectedCash)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Actual Counted Cash (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={actualCashCounted}
                  onChange={(e) => setActualCashCounted(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono font-bold text-sm bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Shift Handover Notes</label>
                <textarea
                  rows={2}
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="e.g. Handed over to Evening Cashier Suresh"
                  className="w-full p-2 border rounded-lg bg-slate-50 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCloseModalOpen(false)}
                  className="px-4 py-2 border rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow"
                >
                  Confirm & Close Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
