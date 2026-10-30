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
    const storeId = searchParams.get('storeId') || session.storeId;
    const filter = searchParams.get('filter'); // 'LOW_STOCK', 'OUT_OF_STOCK', 'ALL'

    const products = await prisma.product.findMany({
      where: {
        businessId: session.businessId,
        isActive: true,
      },
      include: {
        category: true,
        stockBalances: {
          where: { storeId },
        },
      },
      orderBy: { name: 'asc' },
    });

    let totalValuationCost = 0;
    let totalValuationSelling = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const inventoryList = products.map((p) => {
      const qty = p.stockBalances[0]?.quantity || 0;
      const isLow = qty <= p.minStockLevel && qty > 0;
      const isOut = qty <= 0;

      if (isLow) lowStockCount++;
      if (isOut) outOfStockCount++;

      totalValuationCost += qty * p.costPrice;
      totalValuationSelling += qty * p.sellingPrice;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category?.name || 'General',
        unit: p.unit,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        mrp: p.mrp,
        taxRate: p.taxRate,
        quantity: qty,
        minStockLevel: p.minStockLevel,
        isLowStock: isLow,
        isOutOfStock: isOut,
        stockValueCost: Math.round(qty * p.costPrice * 100) / 100,
        stockValueSelling: Math.round(qty * p.sellingPrice * 100) / 100,
      };
    });

    let filtered = inventoryList;
    if (filter === 'LOW_STOCK') {
      filtered = inventoryList.filter((i) => i.isLowStock);
    } else if (filter === 'OUT_OF_STOCK') {
      filtered = inventoryList.filter((i) => i.isOutOfStock);
    }

    return NextResponse.json({
      summary: {
        totalItems: inventoryList.length,
        totalValuationCost: Math.round(totalValuationCost * 100) / 100,
        totalValuationSelling: Math.round(totalValuationSelling * 100) / 100,
        lowStockCount,
        outOfStockCount,
      },
      inventory: filtered,
    });
  } catch (error: any) {
    console.error('Inventory error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch inventory' }, { status: 500 });
  }
}
