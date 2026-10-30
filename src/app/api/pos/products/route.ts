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
    const barcode = searchParams.get('barcode')?.trim();
    const categoryId = searchParams.get('categoryId');
    const storeId = searchParams.get('storeId') || session.storeId;

    const whereClause: any = {
      businessId: session.businessId,
      isActive: true,
    };

    if (barcode) {
      whereClause.barcode = barcode;
    } else if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { barcode: { contains: query } },
        { sku: { contains: query } },
      ];
    }

    if (categoryId && categoryId !== 'ALL') {
      whereClause.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        brand: true,
        stockBalances: {
          where: { storeId },
        },
      },
      orderBy: { name: 'asc' },
      take: 50,
    });

    const formatted = products.map((p) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      sku: p.sku,
      hsnCode: p.hsnCode,
      unit: p.unit,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      mrp: p.mrp,
      taxRate: p.taxRate,
      isTaxInclusive: p.isTaxInclusive,
      categoryName: p.category?.name || 'General',
      brandName: p.brand?.name || '',
      stockQuantity: p.stockBalances[0]?.quantity || 0,
      minStockLevel: p.minStockLevel,
    }));

    return NextResponse.json({ products: formatted });
  } catch (error: any) {
    console.error('POS product search error:', error);
    return NextResponse.json({ error: error.message || 'Failed to search products' }, { status: 500 });
  }
}
