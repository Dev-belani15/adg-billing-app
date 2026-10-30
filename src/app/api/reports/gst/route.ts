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

    const invoices = await prisma.salesInvoice.findMany({
      where: {
        storeId,
        isVoid: false,
      },
      include: {
        customer: true,
        lines: {
          include: {
            product: { select: { name: true, hsnCode: true, unit: true } },
          },
        },
        returns: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalTax = 0;
    let totalInvoiceValue = 0;

    const hsnMap: { [key: string]: { hsnCode: string; description: string; unit: string; totalQty: number; totalValue: number; taxableValue: number; cgst: number; sgst: number; igst: number; taxRate: number } } = {};

    const b2bInvoices: any[] = [];
    const b2cInvoices: any[] = [];

    for (const inv of invoices) {
      totalInvoiceValue += inv.totalAmount;
      totalCgst += inv.cgstAmount;
      totalSgst += inv.sgstAmount;
      totalIgst += inv.igstAmount;
      totalTax += inv.taxAmount;
      totalTaxable += (inv.totalAmount - inv.taxAmount);

      const invData = {
        invoiceNumber: inv.invoiceNumber,
        date: inv.createdAt,
        customerName: inv.customer?.name || 'Retail Walk-in',
        customerGstin: inv.customer?.gstin || null,
        taxableValue: Math.round((inv.totalAmount - inv.taxAmount) * 100) / 100,
        cgst: inv.cgstAmount,
        sgst: inv.sgstAmount,
        igst: inv.igstAmount,
        totalTax: inv.taxAmount,
        totalAmount: inv.totalAmount,
      };

      if (inv.customer?.gstin) {
        b2bInvoices.push(invData);
      } else {
        b2cInvoices.push(invData);
      }

      // HSN Breakdown
      for (const line of inv.lines) {
        const hsn = line.hsnCode || line.product.hsnCode || '1905';
        const key = `${hsn}-${line.taxRate}`;

        if (!hsnMap[key]) {
          hsnMap[key] = {
            hsnCode: hsn,
            description: line.productName,
            unit: line.unit || 'PCS',
            totalQty: 0,
            totalValue: 0,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            taxRate: line.taxRate,
          };
        }

        hsnMap[key].totalQty += line.quantity;
        hsnMap[key].totalValue += line.lineTotal;
        hsnMap[key].taxableValue += (line.lineTotal - line.taxAmount);
        hsnMap[key].cgst += line.cgstAmount;
        hsnMap[key].sgst += line.sgstAmount;
        hsnMap[key].igst += line.igstAmount;
      }
    }

    const hsnSummary = Object.values(hsnMap).map((h) => ({
      ...h,
      totalQty: Math.round(h.totalQty * 100) / 100,
      totalValue: Math.round(h.totalValue * 100) / 100,
      taxableValue: Math.round(h.taxableValue * 100) / 100,
      cgst: Math.round(h.cgst * 100) / 100,
      sgst: Math.round(h.sgst * 100) / 100,
      igst: Math.round(h.igst * 100) / 100,
      totalTax: Math.round((h.cgst + h.sgst + h.igst) * 100) / 100,
    }));

    return NextResponse.json({
      summary: {
        totalInvoices: invoices.length,
        totalInvoiceValue: Math.round(totalInvoiceValue * 100) / 100,
        totalTaxable: Math.round(totalTaxable * 100) / 100,
        totalCgst: Math.round(totalCgst * 100) / 100,
        totalSgst: Math.round(totalSgst * 100) / 100,
        totalIgst: Math.round(totalIgst * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
      },
      gstr3b: {
        natureOfSupplies: 'Outward taxable supplies (other than zero rated, nil rated and exempted)',
        taxableValue: Math.round(totalTaxable * 100) / 100,
        igst: Math.round(totalIgst * 100) / 100,
        cgst: Math.round(totalCgst * 100) / 100,
        sgst: Math.round(totalSgst * 100) / 100,
        cess: 0,
      },
      b2bInvoices,
      b2cInvoices,
      hsnSummary,
      disclaimer: 'Prepared data for accountant review and GST compliance. Not an official return filing transmission.',
    });
  } catch (error: any) {
    console.error('GST Report error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch GST report' }, { status: 500 });
  }
}
