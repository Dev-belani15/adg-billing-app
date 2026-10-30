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
    const query = searchParams.get('q')?.trim() || '';

    const whereClause: any = {
      businessId: session.businessId,
    };

    if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { phone: { contains: query } },
        { email: { contains: query } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        _count: { select: { sales: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error('Customers error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, email, address, gstin } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Customer name and phone number are required' }, { status: 400 });
    }

    const existing = await prisma.customer.findUnique({
      where: { phone: phone.trim() },
    });

    if (existing) {
      return NextResponse.json({ error: `Customer with phone ${phone} already exists` }, { status: 409 });
    }

    const customer = await prisma.customer.create({
      data: {
        businessId: session.businessId,
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        gstin: gstin ? gstin.trim().toUpperCase() : null,
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error('Create customer error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 });
  }
}
