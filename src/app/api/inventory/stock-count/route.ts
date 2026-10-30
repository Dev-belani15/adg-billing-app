import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await prisma.stockCount.findMany({
      where: { storeId: session.storeId },
      include: {
        lines: {
          include: {
            product: { select: { id: true, name: true, sku: true, barcode: true, costPrice: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error('Stock count error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch stock counts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, notes, sessionId, lines } = body;

    if (action === 'START') {
      // Fetch all products in store to pre-populate expected quantities
      const products = await prisma.product.findMany({
        where: { businessId: session.businessId, isActive: true },
        include: {
          stockBalances: { where: { storeId: session.storeId } },
        },
      });

      const sessionCode = `AUD-${Date.now().toString().slice(-6)}`;

      const newSession = await prisma.stockCount.create({
        data: {
          storeId: session.storeId,
          sessionCode,
          status: 'IN_PROGRESS',
          startedBy: session.userName,
          notes: notes || 'Physical stock audit',
          lines: {
            create: products.map((p) => {
              const expected = p.stockBalances[0]?.quantity || 0;
              return {
                productId: p.id,
                expectedQty: expected,
                countedQty: expected, // Default to expected until scanned
                differenceQty: 0,
              };
            }),
          },
        },
        include: {
          lines: { include: { product: true } },
        },
      });

      return NextResponse.json({ success: true, session: newSession });
    } else if (action === 'COMMIT') {
      if (!sessionId || !lines) {
        return NextResponse.json({ error: 'Session ID and counted lines are required' }, { status: 400 });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Update lines
        for (const line of lines) {
          const diff = Number(line.countedQty) - Number(line.expectedQty);
          await tx.stockCountLine.update({
            where: { id: line.id },
            data: {
              countedQty: Number(line.countedQty),
              differenceQty: diff,
              approved: true,
            },
          });

          // If discrepancy exists, update stock balance and ledger!
          if (diff !== 0) {
            await tx.stockBalance.upsert({
              where: {
                storeId_productId: {
                  storeId: session.storeId,
                  productId: line.productId,
                },
              },
              update: { quantity: Number(line.countedQty) },
              create: {
                storeId: session.storeId,
                productId: line.productId,
                quantity: Number(line.countedQty),
              },
            });

            await tx.stockMovement.create({
              data: {
                storeId: session.storeId,
                productId: line.productId,
                type: 'ADJUSTMENT',
                quantity: diff,
                balanceAfter: Number(line.countedQty),
                reason: `Physical Stock Count Reconciliation (Session #${sessionId})`,
                performedBy: session.userName,
              },
            });
          }
        }

        const completedSession = await tx.stockCount.update({
          where: { id: sessionId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            approvedBy: session.userName,
          },
          include: { lines: { include: { product: true } } },
        });

        await tx.auditLog.create({
          data: {
            businessId: session.businessId,
            userId: session.userId,
            userName: session.userName,
            action: 'STOCK_COUNT_COMMIT',
            entity: 'StockCount',
            entityId: sessionId,
            details: `Approved and committed physical stock audit session`,
          },
        });

        return completedSession;
      });

      return NextResponse.json({ success: true, session: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Stock count action error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process stock count' }, { status: 500 });
  }
}
