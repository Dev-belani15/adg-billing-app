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
    const { purchaseOrderId, receivedItems, notes } = body;

    if (!purchaseOrderId || !receivedItems || !receivedItems.length) {
      return NextResponse.json({ error: 'Purchase Order ID and received items are required' }, { status: 400 });
    }

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { lines: true, store: true },
    });

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 });
    }

    if (po.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Purchase order is already completely received' }, { status: 400 });
    }

    const grnNumber = `GRN-${Date.now().toString().slice(-6)}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Goods Receipt
      const grn = await tx.goodsReceipt.create({
        data: {
          storeId: po.storeId,
          purchaseOrderId: po.id,
          grnNumber,
          receivedBy: session.userName,
          notes: notes || null,
        },
      });

      // 2. Process each item: update received quantity, stock balance & ledger
      let allFullyReceived = true;

      for (const item of receivedItems) {
        const line = po.lines.find((l) => l.productId === item.productId);
        if (!line) continue;

        const qtyToReceive = Number(item.quantityReceived);
        if (qtyToReceive <= 0) continue;

        const newReceivedQty = line.quantityReceived + qtyToReceive;

        // Update PO Line
        await tx.purchaseOrderLine.update({
          where: { id: line.id },
          data: { quantityReceived: newReceivedQty },
        });

        if (newReceivedQty < line.quantityOrdered) {
          allFullyReceived = false;
        }

        // Fetch current stock
        const currentBalance = await tx.stockBalance.findUnique({
          where: {
            storeId_productId: {
              storeId: po.storeId,
              productId: item.productId,
            },
          },
        });

        const updatedQty = (currentBalance?.quantity || 0) + qtyToReceive;

        // Update Stock Balance
        await tx.stockBalance.upsert({
          where: {
            storeId_productId: {
              storeId: po.storeId,
              productId: item.productId,
            },
          },
          update: { quantity: updatedQty },
          create: {
            storeId: po.storeId,
            productId: item.productId,
            quantity: updatedQty,
          },
        });

        // Add to Stock Movement Ledger
        await tx.stockMovement.create({
          data: {
            storeId: po.storeId,
            productId: item.productId,
            type: 'PURCHASE_RECEIPT',
            quantity: qtyToReceive,
            balanceAfter: updatedQty,
            unitCost: line.unitCost,
            referenceId: grnNumber,
            reason: `Goods received against ${po.poNumber} (GRN: ${grnNumber})`,
            performedBy: session.userName,
          },
        });
      }

      // 3. Update PO status
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: allFullyReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED' },
      });

      // 4. Record Audit Log
      await tx.auditLog.create({
        data: {
          businessId: session.businessId,
          userId: session.userId,
          userName: session.userName,
          action: 'GOODS_RECEIVE',
          entity: 'PurchaseOrder',
          entityId: po.id,
          details: `Generated ${grnNumber} for ${po.poNumber}. Stock updated.`,
        },
      });

      return grn;
    });

    return NextResponse.json({ success: true, goodsReceipt: result, grnNumber });
  } catch (error: any) {
    console.error('Goods receipt error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process goods receipt' }, { status: 500 });
  }
}
