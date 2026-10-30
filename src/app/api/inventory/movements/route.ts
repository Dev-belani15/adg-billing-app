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
    const productId = searchParams.get('productId');
    const type = searchParams.get('type');
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 30)));
    const skip = (page - 1) * limit;

    const whereClause: any = {
      storeId: session.storeId,
    };

    if (productId) {
      whereClause.productId = productId;
    }

    if (type && type !== 'ALL') {
      whereClause.type = type;
    }

    const [total, movements] = await Promise.all([
      prisma.stockMovement.count({ where: whereClause }),
      prisma.stockMovement.findMany({
        where: whereClause,
        include: {
          product: {
            select: { id: true, name: true, sku: true, barcode: true, unit: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Stock movements error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch movements' }, { status: 500 });
  }
}
