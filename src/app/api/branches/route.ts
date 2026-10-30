import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stores = await prisma.store.findMany({
      where: { businessId: session.businessId },
      include: {
        counters: true,
        _count: { select: { sales: true, stockBalances: true } },
      },
      orderBy: { isMainBranch: 'desc' },
    });

    const transfers = await prisma.stockTransfer.findMany({
      where: {
        OR: [
          { sourceStore: { businessId: session.businessId } },
          { targetStore: { businessId: session.businessId } },
        ],
      },
      include: {
        sourceStore: true,
        targetStore: true,
        lines: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ stores, transfers });
  } catch (error: any) {
    console.error('Branches error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch branches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceStoreId, targetStoreId, items, notes } = body;

    if (!sourceStoreId || !targetStoreId || !items || !items.length) {
      return NextResponse.json({ error: 'Source branch, target branch, and items are required' }, { status: 400 });
    }

    if (sourceStoreId === targetStoreId) {
      return NextResponse.json({ error: 'Source and target branches must be different' }, { status: 400 });
    }

    const transferNumber = `TRF-${Date.now().toString().slice(-6)}`;

    const transfer = await prisma.$transaction(async (tx) => {
      // 1. Create StockTransfer record
      const createdTransfer = await tx.stockTransfer.create({
        data: {
          transferNumber,
          sourceStoreId,
          targetStoreId,
          status: 'RECEIVED', // direct received in retail demo
          notes: notes || null,
          dispatchedAt: new Date(),
          receivedAt: new Date(),
          lines: {
            create: items.map((it: any) => ({
              productId: it.productId,
              quantity: Number(it.quantity),
            })),
          },
        },
        include: { lines: true },
      });

      // 2. Transfer stock between stores atomically
      for (const item of items) {
        const qty = Number(item.quantity);

        // Deduct from Source Store
        const srcBalance = await tx.stockBalance.findUnique({
          where: {
            storeId_productId: {
              storeId: sourceStoreId,
              productId: item.productId,
            },
          },
        });

        const newSrcQty = (srcBalance?.quantity || 0) - qty;
        await tx.stockBalance.upsert({
          where: {
            storeId_productId: {
              storeId: sourceStoreId,
              productId: item.productId,
            },
          },
          update: { quantity: newSrcQty },
          create: {
            storeId: sourceStoreId,
            productId: item.productId,
            quantity: newSrcQty,
          },
        });

        await tx.stockMovement.create({
          data: {
            storeId: sourceStoreId,
            productId: item.productId,
            type: 'TRANSFER_OUT',
            quantity: -qty,
            balanceAfter: newSrcQty,
            referenceId: transferNumber,
            reason: `Branch transfer out to target branch (TRF: ${transferNumber})`,
            performedBy: session.userName,
          },
        });

        // Add to Target Store
        const tgtBalance = await tx.stockBalance.findUnique({
          where: {
            storeId_productId: {
              storeId: targetStoreId,
              productId: item.productId,
            },
          },
        });

        const newTgtQty = (tgtBalance?.quantity || 0) + qty;
        await tx.stockBalance.upsert({
          where: {
            storeId_productId: {
              storeId: targetStoreId,
              productId: item.productId,
            },
          },
          update: { quantity: newTgtQty },
          create: {
            storeId: targetStoreId,
            productId: item.productId,
            quantity: newTgtQty,
          },
        });

        await tx.stockMovement.create({
          data: {
            storeId: targetStoreId,
            productId: item.productId,
            type: 'TRANSFER_IN',
            quantity: qty,
            balanceAfter: newTgtQty,
            referenceId: transferNumber,
            reason: `Branch transfer in from source branch (TRF: ${transferNumber})`,
            performedBy: session.userName,
          },
        });
      }

      // 3. Record Audit Log
      await tx.auditLog.create({
        data: {
          businessId: session.businessId,
          userId: session.userId,
          userName: session.userName,
          action: 'BRANCH_TRANSFER',
          entity: 'StockTransfer',
          entityId: createdTransfer.id,
          details: `Transferred ${items.length} items from source to target branch (${transferNumber})`,
        },
      });

      return createdTransfer;
    });

    return NextResponse.json({ success: true, transfer });
  } catch (error: any) {
    console.error('Transfer error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process branch transfer' }, { status: 500 });
  }
}
