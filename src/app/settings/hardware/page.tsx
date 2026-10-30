'use client';

import React, { useState } from 'react';
import {
  Printer,
  Barcode,
  CheckCircle2,
  Sliders,
  RefreshCw,
  Terminal,
} from 'lucide-react';

export default function HardwareSettingsPage() {
  const [scannedLogs, setScannedLogs] = useState<string[]>([]);
  const [scannerTestInput, setScannerTestInput] = useState('');
  const [printerWidth, setPrinterWidth] = useState<'80mm' | '58mm'>('80mm');
  const [autoCutPaper, setAutoCutPaper] = useState(true);
  const [soundBeep, setSoundBeep] = useState(true);

  const handleScannerInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerTestInput.trim()) return;
    const timestamp = new Date().toLocaleTimeString();
    setScannedLogs([`[${timestamp}] RAW CAPTURE: "${scannerTestInput}" (Length: ${scannerTestInput.length} chars)`, ...scannedLogs.slice(0, 9)]);
    setScannerTestInput('');
  };

  const handlePrintTestTicket = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Printer className="w-6 h-6 text-indigo-600" />
          <span>Hardware & Peripheral Integration</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure USB / Bluetooth barcode scanners, thermal POS printers, and cash drawers
        </p>
      </div>

      <div className="no-print grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* USB Barcode Scanner Tester */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800 text-xs">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Barcode className="w-4 h-4 text-indigo-600" />
            <span>USB Barcode Scanner Diagnostic</span>
          </h2>

          <p className="text-slate-500">
            Standard USB scanners act as HID keyboard inputs with automated suffix carriage-returns (`Enter`).
            Focus in the box below and scan any physical barcode to test.
          </p>

          <form onSubmit={handleScannerInput}>
            <input
              type="text"
              value={scannerTestInput}
              onChange={(e) => setScannerTestInput(e.target.value)}
              placeholder="Click here and scan barcode..."
              className="w-full p-2.5 border rounded-xl font-mono font-bold bg-slate-50 border-indigo-200 focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:border-indigo-900 text-xs"
            />
          </form>

          <div>
            <div className="font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center space-x-1">
              <Terminal className="w-3.5 h-3.5" />
              <span>Diagnostic Capture Terminal</span>
            </div>
            <div className="bg-slate-950 text-emerald-400 p-3 rounded-xl font-mono text-[11px] h-32 overflow-y-auto space-y-1">
              {scannedLogs.length === 0 ? (
                <div className="text-slate-600 italic">Waiting for hardware scanner pulse...</div>
              ) : (
                scannedLogs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        </div>

        {/* Thermal Receipt Printer Settings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 dark:bg-slate-900 dark:border-slate-800 text-xs">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span>Thermal Receipt Printer Setup</span>
          </h2>

          <div>
            <label className="block font-semibold mb-1">Receipt Paper Roll Width:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPrinterWidth('80mm')}
                className={`py-2 rounded-xl font-semibold border transition ${
                  printerWidth === '80mm'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                80mm (Supermarket Standard)
              </button>
              <button
                type="button"
                onClick={() => setPrinterWidth('58mm')}
                className={`py-2 rounded-xl font-semibold border transition ${
                  printerWidth === '58mm'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                58mm (Compact Mobile POS)
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCutPaper}
                onChange={(e) => setAutoCutPaper(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Send Auto-Cutter command after invoice</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={soundBeep}
                onChange={(e) => setSoundBeep(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Trigger Cash Drawer Kick pulse on payment finalization</span>
            </label>
          </div>

          <div className="pt-2">
            <button
              onClick={handlePrintTestTicket}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl shadow transition flex items-center justify-center space-x-2 dark:bg-slate-100 dark:text-slate-900"
            >
              <Printer className="w-4 h-4" />
              <span>Print Hardware Test Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Test Ticket */}
      <div className="printable-receipt bg-white p-5 rounded-xl border border-slate-200 font-mono text-xs max-w-[320px] mx-auto text-center space-y-1 text-black">
        <div className="font-bold text-sm">ZYDEN HARDWARE TEST</div>
        <div className="text-[10px]">Thermal Printer Interface: OK</div>
        <div className="text-[10px]">Cutter Sensor: OK | Status: READY</div>
        <div className="border-b border-dashed border-black my-2"></div>
        <div className="text-[10px]">Timestamp: {new Date().toLocaleString()}</div>
        <div className="text-[10px] pt-1">*** TEST COMPLETED ***</div>
      </div>
    </div>
  );
}
