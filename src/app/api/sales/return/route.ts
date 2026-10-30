import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { restoreStockForReturn } from '@/lib/inventory';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      originalInvoiceId,
      returnReason,
      items, // array of { productId, quantity, unitPrice, condition: 'SALEABLE' | 'DAMAGED' }
      refundMethod = 'CASH',
    } = body;

    if (!originalInvoiceId || !items || !items.length) {
      return NextResponse.json({ error: 'Invoice ID and return items are required' }, { status: 400 });
    }

    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: originalInvoiceId },
      include: {
        lines: true,
        returns: { include: { lines: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Original invoice not found' }, { status: 404 });
    }

    // Verify quantity limits: Cannot return more than sold
    for (const item of items) {
      const originalLine = invoice.lines.find((l) => l.productId === item.productId);
      if (!originalLine) {
        return NextResponse.json({ error: `Product ${item.productId} was not part of original invoice` }, { status: 400 });
      }

      // Calculate already returned quantity for this product
      const alreadyReturnedQty = invoice.returns.reduce((sum, ret) => {
        const retLine = ret.lines.find((rl) => rl.productId === item.productId);
        return sum + (retLine?.quantity || 0);
      }, 0);

      const maxReturnable = originalLine.quantity - alreadyReturnedQty;
      if (item.quantity > maxReturnable) {
        return NextResponse.json({
          error: `Cannot return ${item.quantity} units for ${originalLine.productName}. Maximum returnable: ${maxReturnable}`,
        }, { status: 400 });
      }
    }

    // Calculate total refund amount
    const totalRefundAmount = items.reduce(
      (sum: number, it: any) => sum + (Number(it.unitPrice) * Number(it.quantity)),
      0
    );

    const returnNumber = `RET-${Date.now().toString().slice(-6)}`;

    // Execute atomic transaction
    const returnRecord = await prisma.$transaction(async (tx) => {
      // 1. Create SalesReturn record
      const createdReturn = await tx.salesReturn.create({
        data: {
          originalInvoiceId: invoice.id,
          returnNumber,
          returnReason: returnReason || 'Customer Return',
          refundAmount: totalRefundAmount,
          refundMethod,
          stockRestored: items.some((i: any) => i.condition === 'SALEABLE'),
          processedBy: session.userName,
          lines: {
            create: items.map((it: any) => ({
              productId: it.productId,
              quantity: Number(it.quantity),
              unitPrice: Number(it.unitPrice),
              refundTotal: Number(it.unitPrice) * Number(it.quantity),
              condition: it.condition || 'SALEABLE',
            })),
          },
        },
        include: { lines: true },
      });

      // 2. Restore stock for saleable items & log damage movements
      await restoreStockForReturn(
        tx,
        invoice.storeId,
        items.map((it: any) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          condition: it.condition || 'SALEABLE',
        })),
        returnNumber,
        session.userName
      );

      // 3. Update invoice payment status if full return
      const allOriginalQty = invoice.lines.reduce((s, l) => s + l.quantity, 0);
      const allReturnedQty =
        items.reduce((s: number, i: any) => s + Number(i.quantity), 0) +
        invoice.returns.reduce((s, r) => s + r.lines.reduce((sl, rl) => sl + rl.quantity, 0), 0);

      if (allReturnedQty >= allOriginalQty) {
        await tx.salesInvoice.update({
          where: { id: invoice.id },
          data: { paymentStatus: 'REFUNDED' },
        });
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          businessId: session.businessId,
          userId: session.userId,
          userName: session.userName,
          action: 'SALE_RETURN',
          entity: 'SalesReturn',
          entityId: createdReturn.id,
          details: `Processed Return ${returnNumber} for Invoice ${invoice.invoiceNumber}. Refund: ₹${totalRefundAmount} via ${refundMethod}`,
        },
      });

      return createdReturn;
    });

    return NextResponse.json({
      success: true,
      return: returnRecord,
      message: `Return ${returnNumber} processed successfully.`,
    });
  } catch (error: any) {
    console.error('Sales return error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process return' }, { status: 500 });
  }
}
