import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { calculateInvoiceTotals } from '@/lib/gst';
import { deductStockForSale, InsufficientStockError } from '@/lib/inventory';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      storeId = session.storeId,
      counterId,
      counterNumber = 1,
      items,
      customerPhone,
      customerName,
      discountAmount = 0,
      couponCode,
      paymentMethod = 'CASH',
      paidAmount,
      payments = [], // Split payment breakdown
      idempotencyKey,
      notes,
    } = body;

    if (!items || !items.length) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // 1. Idempotency Check: Prevent duplicate billing on double click
    if (idempotencyKey) {
      const existing = await prisma.salesInvoice.findUnique({
        where: { idempotencyKey },
        include: {
          lines: true,
          payments: true,
          customer: true,
          counter: true,
        },
      });
      if (existing) {
        return NextResponse.json({
          success: true,
          isDuplicate: true,
          invoice: existing,
        });
      }
    }

    // 2. Fetch Business Settings & Validate Store/Counter
    const business = await prisma.business.findUnique({
      where: { id: session.businessId },
      include: { settings: true, stores: { include: { counters: true } } },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
    }

    const targetStore = business.stores.find((s) => s.id === storeId) || business.stores[0];
    const targetCounter =
      targetStore.counters.find((c) => c.id === counterId || c.counterNumber === counterNumber) ||
      targetStore.counters[0];

    // Find active shift for this counter
    const activeShift = await prisma.cashierShift.findFirst({
      where: {
        counterId: targetCounter.id,
        status: 'OPEN',
      },
      orderBy: { openedAt: 'desc' },
    });

    // 3. Customer Resolution (by phone or walk-in)
    let customer = null;
    if (customerPhone && customerPhone.trim()) {
      customer = await prisma.customer.findUnique({
        where: { phone: customerPhone.trim() },
      });
      if (!customer && customerName) {
        customer = await prisma.customer.create({
          data: {
            businessId: business.id,
            name: customerName.trim(),
            phone: customerPhone.trim(),
          },
        });
      }
    }

    // 4. Validate Coupon if provided
    let appliedCouponDiscount = 0;
    if (couponCode) {
      const promo = await prisma.promotion.findUnique({
        where: { code: couponCode.toUpperCase() },
      });
      if (promo && promo.isActive) {
        // Will apply during totals calculation
        if (promo.discountType === 'FIXED_AMOUNT') {
          appliedCouponDiscount = promo.value;
        }
      }
    }

    const totalInvoiceDiscount = Number(discountAmount) + appliedCouponDiscount;

    // 5. Calculate Taxes & Totals using Indian GST Engine
    const lineInputs = items.map((it: any) => ({
      productId: it.productId,
      unitPrice: Number(it.unitPrice),
      quantity: Number(it.quantity),
      discountAmount: Number(it.discountAmount || 0),
      taxRate: Number(it.taxRate || 0),
      isTaxInclusive: it.isTaxInclusive !== false,
      hsnCode: it.hsnCode || 'GENERAL',
    }));

    const totals = calculateInvoiceTotals(lineInputs, totalInvoiceDiscount, false);

    const actualPaid = paidAmount !== undefined ? Number(paidAmount) : totals.finalPayableAmount;
    const changeAmount = Math.max(0, actualPaid - totals.finalPayableAmount);

    // 6. Generate sequential invoice number (e.g. ZYD-1042)
    const settings = business.settings;
    const prefix = settings?.invoicePrefix || 'ZYD-';
    const nextSeq = (settings?.invoiceNextNumber || 1000) + 1;
    const invoiceNumber = `${prefix}${nextSeq}`;

    // Update next sequence in settings
    if (settings) {
      await prisma.businessSettings.update({
        where: { id: settings.id },
        data: { invoiceNextNumber: nextSeq },
      });
    }

    // 7. Execute Atomic Transaction: Deduct Stock, Record Invoice & Payments
    const resultInvoice = await prisma.$transaction(async (tx) => {
      // A. Deduct stock atomically with negative-stock check
      const deductItems = items.map((it: any) => ({
        productId: it.productId,
        quantity: Number(it.quantity),
      }));

      await deductStockForSale(
        tx,
        targetStore.id,
        deductItems,
        invoiceNumber,
        session.userName,
        settings?.allowNegativeStock || false
      );

      // B. Create SalesInvoice & SalesInvoiceLines
      const createdInvoice = await tx.salesInvoice.create({
        data: {
          storeId: targetStore.id,
          counterId: targetCounter.id,
          cashierId: session.userId,
          shiftId: activeShift?.id || null,
          customerId: customer?.id || null,
          invoiceNumber,
          idempotencyKey: idempotencyKey || null,
          subtotal: totals.subtotal,
          discountAmount: totals.totalDiscount,
          couponCode: couponCode || null,
          taxAmount: totals.taxAmount,
          cgstAmount: totals.cgstAmount,
          sgstAmount: totals.sgstAmount,
          igstAmount: totals.igstAmount,
          roundOff: totals.roundOff,
          totalAmount: totals.finalPayableAmount,
          paidAmount: actualPaid,
          changeAmount,
          paymentMethod,
          paymentStatus: actualPaid >= totals.finalPayableAmount ? 'PAID' : 'PARTIAL',
          notes: notes || null,
          lines: {
            create: items.map((it: any) => {
              const lineTax = (it.unitPrice * it.quantity * it.taxRate) / (100 + it.taxRate);
              return {
                productId: it.productId,
                productName: it.productName || it.name,
                sku: it.sku || 'SKU',
                hsnCode: it.hsnCode || 'GENERAL',
                unit: it.unit || 'PCS',
                quantity: Number(it.quantity),
                unitPrice: Number(it.unitPrice),
                discountAmount: Number(it.discountAmount || 0),
                taxRate: Number(it.taxRate || 0),
                taxAmount: Math.round(lineTax * 100) / 100,
                cgstAmount: Math.round((lineTax / 2) * 100) / 100,
                sgstAmount: Math.round((lineTax / 2) * 100) / 100,
                igstAmount: 0,
                lineTotal: (it.unitPrice * it.quantity) - (it.discountAmount || 0),
              };
            }),
          },
          payments: {
            create: payments.length
              ? payments.map((p: any) => ({
                  method: p.method,
                  amount: Number(p.amount),
                  referenceNumber: p.referenceNumber || null,
                  status: 'SUCCESS',
                }))
              : [
                  {
                    method: paymentMethod,
                    amount: totals.finalPayableAmount,
                    referenceNumber: paymentMethod === 'UPI' ? `UPI-${Date.now().toString().slice(-6)}` : null,
                    status: 'SUCCESS',
                  },
                ],
          },
        },
        include: {
          lines: true,
          payments: true,
          customer: true,
          counter: true,
          store: true,
          cashier: { select: { id: true, name: true, role: true } },
        },
      });

      // C. Update Cashier Shift if open
      if (activeShift) {
        const cashPart = paymentMethod === 'CASH' ? totals.finalPayableAmount : 0;
        const upiPart = paymentMethod === 'UPI' ? totals.finalPayableAmount : 0;
        const cardPart = paymentMethod === 'CARD' ? totals.finalPayableAmount : 0;

        await tx.cashierShift.update({
          where: { id: activeShift.id },
          data: {
            totalSales: { increment: totals.finalPayableAmount },
            expectedCash: { increment: cashPart },
            cashSales: { increment: cashPart },
            upiSales: { increment: upiPart },
            cardSales: { increment: cardPart },
          },
        });
      }

      // D. Award Loyalty Points if customer exists and enabled
      if (customer && settings?.enableLoyalty) {
        const earnedPoints = Math.floor((totals.finalPayableAmount / 100) * (settings.loyaltyPointsPer100 || 1));
        if (earnedPoints > 0) {
          await tx.customer.update({
            where: { id: customer.id },
            data: { loyaltyPoints: { increment: earnedPoints } },
          });
          await tx.loyaltyTransaction.create({
            data: {
              customerId: customer.id,
              points: earnedPoints,
              type: 'EARNED',
              invoiceId: createdInvoice.id,
              description: `Earned on Bill ${invoiceNumber}`,
            },
          });
        }
      }

      // E. Record Audit Log
      await tx.auditLog.create({
        data: {
          businessId: business.id,
          userId: session.userId,
          userName: session.userName,
          action: 'SALE_CREATE',
          entity: 'SalesInvoice',
          entityId: createdInvoice.id,
          details: `Finalized bill ${invoiceNumber} for ₹${totals.finalPayableAmount} via ${paymentMethod} at ${targetCounter.name}`,
        },
      });

      return createdInvoice;
    });

    return NextResponse.json({
      success: true,
      invoice: resultInvoice,
      hsnSummary: totals.hsnSummary,
    });
  } catch (error: any) {
    console.error('POS Checkout error:', error);
    if (error instanceof InsufficientStockError) {
      return NextResponse.json({ error: error.message, isStockError: true }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
  }
}
