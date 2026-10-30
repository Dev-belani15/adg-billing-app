import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const counterId = searchParams.get('counterId');
    const paymentMethod = searchParams.get('paymentMethod');
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 25)));
    const skip = (page - 1) * limit;

    const whereClause: any = {
      storeId: session.storeId,
    };

    if (counterId) {
      whereClause.counterId = counterId;
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      whereClause.paymentMethod = paymentMethod;
    }

    if (query) {
      whereClause.OR = [
        { invoiceNumber: { contains: query } },
        { customer: { name: { contains: query } } },
        { customer: { phone: { contains: query } } },
      ];
    }

    const [total, invoices] = await Promise.all([
      prisma.salesInvoice.count({ where: whereClause }),
      prisma.salesInvoice.findMany({
        where: whereClause,
        include: {
          customer: true,
          counter: true,
          cashier: { select: { id: true, name: true, role: true } },
          _count: { select: { lines: true, returns: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Sales list error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch sales' }, { status: 500 });
  }
}
