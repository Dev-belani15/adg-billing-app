import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [promotions, customersWithPoints] = await Promise.all([
      prisma.promotion.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.customer.findMany({
        where: { loyaltyPoints: { gt: 0 } },
        orderBy: { loyaltyPoints: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({ promotions, topLoyaltyCustomers: customersWithPoints });
  } catch (error: any) {
    console.error('Loyalty promotions error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch promotions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, title, discountType, value, minBillTotal = 0, maxDiscount } = body;

    if (!code || !title || !discountType || value === undefined) {
      return NextResponse.json({ error: 'Code, title, discount type, and value are required' }, { status: 400 });
    }

    const existing = await prisma.promotion.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (existing) {
      return NextResponse.json({ error: `Coupon code "${code}" already exists` }, { status: 409 });
    }

    const promo = await prisma.promotion.create({
      data: {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        discountType,
        value: Number(value),
        minBillTotal: Number(minBillTotal),
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, promotion: promo });
  } catch (error: any) {
    console.error('Create promo error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create promotion' }, { status: 500 });
  }
}
