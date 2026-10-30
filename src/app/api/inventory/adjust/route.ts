import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, adjustmentQty, type = 'ADJUSTMENT', reason } = body;

    if (!productId || adjustmentQty === undefined || !reason) {
      return NextResponse.json({ error: 'Product ID, adjustment quantity, and reason are required' }, { status: 400 });
    }

    const qty = Number(adjustmentQty);
    if (isNaN(qty) || qty === 0) {
      return NextResponse.json({ error: 'Adjustment quantity cannot be 0' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        stockBalances: {
          where: { storeId: session.storeId },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const currentBalance = product.stockBalances[0]?.quantity || 0;
    const newBalance = currentBalance + qty;

    if (newBalance < 0) {
      return NextResponse.json({
        error: `Adjustment would result in negative stock (${newBalance}). Current: ${currentBalance}`,
      }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update StockBalance
      await tx.stockBalance.upsert({
        where: {
          storeId_productId: {
            storeId: session.storeId,
            productId,
          },
        },
        update: { quantity: newBalance },
        create: {
          storeId: session.storeId,
          productId,
          quantity: newBalance,
        },
      });

      // 2. Append StockMovement
      const movement = await tx.stockMovement.create({
        data: {
          storeId: session.storeId,
          productId,
          type: type || 'ADJUSTMENT',
          quantity: qty,
          balanceAfter: newBalance,
          unitCost: product.costPrice,
          reason,
          performedBy: session.userName,
        },
      });

      // 3. Record Audit Log
      await tx.auditLog.create({
        data: {
          businessId: session.businessId,
          userId: session.userId,
          userName: session.userName,
          action: 'STOCK_ADJUST',
          entity: 'Product',
          entityId: productId,
          details: `Adjusted stock for ${product.name} by ${qty > 0 ? '+' : ''}${qty} units (New: ${newBalance}). Reason: ${reason}`,
        },
      });

      return movement;
    });

    return NextResponse.json({ success: true, movement: updated, newBalance });
  } catch (error: any) {
    console.error('Stock adjustment error:', error);
    return NextResponse.json({ error: error.message || 'Failed to adjust stock' }, { status: 500 });
  }
}
