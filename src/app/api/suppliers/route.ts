import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const suppliers = await prisma.supplier.findMany({
      where: { businessId: session.businessId },
      include: {
        _count: { select: { purchases: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ suppliers });
  } catch (error: any) {
    console.error('Suppliers error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, companyName, gstin, phone, email, address, state = 'Maharashtra', paymentTerms = 'Net 30' } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Supplier name and phone are required' }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        businessId: session.businessId,
        name: name.trim(),
        companyName: companyName ? companyName.trim() : null,
        gstin: gstin ? gstin.trim().toUpperCase() : null,
        phone: phone.trim(),
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        state,
        paymentTerms,
      },
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error: any) {
    console.error('Create supplier error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create supplier' }, { status: 500 });
  }
}
