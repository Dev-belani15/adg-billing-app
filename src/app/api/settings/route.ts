import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where: { id: session.businessId },
      include: {
        settings: true,
        stores: { include: { counters: true } },
      },
    });

    return NextResponse.json({ business });
  } catch (error: any) {
    console.error('Settings error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      legalName,
      gstin,
      email,
      phone,
      address,
      invoicePrefix,
      isTaxInclusiveDefault,
      maxCashierDiscountPct,
      enableLoyalty,
      thermalPrinterWidth,
      allowNegativeStock,
    } = body;

    // Update Business
    await prisma.business.update({
      where: { id: session.businessId },
      data: {
        name: name ? name.trim() : undefined,
        legalName: legalName ? legalName.trim() : undefined,
        gstin: gstin ? gstin.trim().toUpperCase() : undefined,
        email: email ? email.trim() : undefined,
        phone: phone ? phone.trim() : undefined,
        address: address ? address.trim() : undefined,
      },
    });

    // Update Settings
    const updatedSettings = await prisma.businessSettings.upsert({
      where: { businessId: session.businessId },
      update: {
        invoicePrefix: invoicePrefix ? invoicePrefix.trim() : undefined,
        isTaxInclusiveDefault: isTaxInclusiveDefault !== undefined ? Boolean(isTaxInclusiveDefault) : undefined,
        maxCashierDiscountPct: maxCashierDiscountPct !== undefined ? Number(maxCashierDiscountPct) : undefined,
        enableLoyalty: enableLoyalty !== undefined ? Boolean(enableLoyalty) : undefined,
        thermalPrinterWidth: thermalPrinterWidth || undefined,
        allowNegativeStock: allowNegativeStock !== undefined ? Boolean(allowNegativeStock) : undefined,
      },
      create: {
        businessId: session.businessId,
        invoicePrefix: invoicePrefix || 'ZYD-',
        isTaxInclusiveDefault: isTaxInclusiveDefault ?? true,
        maxCashierDiscountPct: maxCashierDiscountPct ?? 10.0,
        enableLoyalty: enableLoyalty ?? true,
        thermalPrinterWidth: thermalPrinterWidth || '80mm',
        allowNegativeStock: allowNegativeStock ?? false,
      },
    });

    await prisma.auditLog.create({
      data: {
        businessId: session.businessId,
        userId: session.userId,
        userName: session.userName,
        action: 'SETTINGS_UPDATE',
        entity: 'BusinessSettings',
        details: 'Updated business profile and billing configuration',
      },
    });

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
