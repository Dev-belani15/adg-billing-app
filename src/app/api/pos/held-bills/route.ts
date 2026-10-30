import { NextResponse } from 'next/server';
import { getHeldBills, saveHeldBills, HeldBill } from '@/lib/heldBills';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const counterNumber = searchParams.get('counterNumber');

  let bills = getHeldBills();
  if (counterNumber) {
    bills = bills.filter((b) => b.counterNumber === Number(counterNumber));
  }

  return NextResponse.json({ heldBills: bills });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { counterId, counterNumber, customerName, customerPhone, items, subtotal, notes } = body;

    if (!items || !items.length) {
      return NextResponse.json({ error: 'Cannot hold an empty bill' }, { status: 400 });
    }

    const bills = getHeldBills();
    const newBill: HeldBill = {
      id: `HOLD-${Date.now().toString().slice(-6)}`,
      counterId: counterId || 'c1',
      counterNumber: Number(counterNumber) || 1,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      items,
      subtotal: Number(subtotal) || 0,
      itemCount: items.reduce((acc: number, item: any) => acc + (Number(item.quantity) || 1), 0),
      heldAt: new Date().toISOString(),
      notes,
    };

    bills.unshift(newBill);
    saveHeldBills(bills);

    return NextResponse.json({ success: true, heldBill: newBill });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to hold bill' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing bill id' }, { status: 400 });
  }

  let bills = getHeldBills();
  const found = bills.find((b) => b.id === id);
  bills = bills.filter((b) => b.id !== id);
  saveHeldBills(bills);

  return NextResponse.json({ success: true, resumedBill: found });
}
