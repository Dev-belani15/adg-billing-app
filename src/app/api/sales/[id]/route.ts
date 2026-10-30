import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const invoice = await prisma.salesInvoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        lines: {
          include: {
            product: { select: { id: true, name: true, barcode: true, hsnCode: true, unit: true } },
          },
        },
        payments: true,
        customer: true,
        counter: true,
        store: {
          include: {
            business: {
              include: { settings: true },
            },
          },
        },
        cashier: { select: { id: true, name: true, role: true } },
        returns: {
          include: { lines: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error: any) {
    console.error('Invoice details error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch invoice' }, { status: 500 });
  }
}
