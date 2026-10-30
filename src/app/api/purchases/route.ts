import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const purchases = await prisma.purchaseOrder.findMany({
      where: { storeId: session.storeId },
      include: {
        supplier: true,
        lines: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } },
          },
        },
        goodsReceipts: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ purchases });
  } catch (error: any) {
    console.error('Purchase orders error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { supplierId, expectedDate, notes, items } = body;

    if (!supplierId || !items || !items.length) {
      return NextResponse.json({ error: 'Supplier and items are required' }, { status: 400 });
    }

    const poNumber = `PO-${Date.now().toString().slice(-6)}`;

    let subtotal = 0;
    let taxAmount = 0;

    const formattedLines = items.map((it: any) => {
      const lineCost = Number(it.unitCost) * Number(it.quantityOrdered);
      const taxRate = Number(it.taxRate || 0);
      const lineTax = (lineCost * taxRate) / 100;
      subtotal += lineCost;
      taxAmount += lineTax;

      return {
        productId: it.productId,
        quantityOrdered: Number(it.quantityOrdered),
        quantityReceived: 0,
        unitCost: Number(it.unitCost),
        taxRate,
        totalCost: lineCost + lineTax,
      };
    });

    const totalAmount = subtotal + taxAmount;

    const po = await prisma.purchaseOrder.create({
      data: {
        storeId: session.storeId,
        supplierId,
        poNumber,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        notes: notes || null,
        status: 'PENDING',
        lines: {
          create: formattedLines,
        },
      },
      include: {
        supplier: true,
        lines: { include: { product: true } },
      },
    });

    return NextResponse.json({ success: true, purchaseOrder: po });
  } catch (error: any) {
    console.error('Create purchase order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create purchase order' }, { status: 500 });
  }
}
