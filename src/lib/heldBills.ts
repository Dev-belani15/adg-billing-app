import fs from 'fs';
import path from 'path';

export interface HeldBill {
  id: string;
  counterId: string;
  counterNumber: number;
  customerName?: string;
  customerPhone?: string;
  items: any[];
  subtotal: number;
  itemCount: number;
  heldAt: string;
  notes?: string;
}

const DATA_DIR = path.join(process.cwd(), 'prisma', 'data');
const HELD_FILE = path.join(DATA_DIR, 'held-bills.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getHeldBills(): HeldBill[] {
  ensureDir();
  if (!fs.existsSync(HELD_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(HELD_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveHeldBills(bills: HeldBill[]): void {
  ensureDir();
  fs.writeFileSync(HELD_FILE, JSON.stringify(bills, null, 2), 'utf-8');
}
