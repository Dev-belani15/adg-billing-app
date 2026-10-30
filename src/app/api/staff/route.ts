import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const staff = await prisma.user.findMany({
      where: { businessId: session.businessId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { sales: true, shifts: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ staff });
  } catch (error: any) {
    console.error('Staff error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, role, password = 'admin123' } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: `User with email ${email} already exists` }, { status: 409 });
    }

    const newUser = await prisma.user.create({
      data: {
        businessId: session.businessId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone ? phone.trim() : null,
        role,
        passwordHash: password,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        businessId: session.businessId,
        userId: session.userId,
        userName: session.userName,
        action: 'STAFF_CREATE',
        entity: 'User',
        entityId: newUser.id,
        details: `Created staff member ${newUser.name} with role ${newUser.role}`,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error('Create staff error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create staff' }, { status: 500 });
  }
}
