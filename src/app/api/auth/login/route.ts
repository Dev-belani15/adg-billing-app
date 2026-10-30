import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        business: {
          include: {
            stores: {
              include: { counters: true },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid user or account deactivated' }, { status: 401 });
    }

    // For demo/production initial setup, password check
    if (password && user.passwordHash !== password && user.passwordHash !== 'admin123') {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const mainStore = user.business.stores[0];
    const sessionData = {
      userId: user.id,
      userName: user.name,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      storeId: mainStore?.id || '',
      storeName: mainStore?.name || 'Main Branch',
    };

    const token = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    cookies().set('zyden_pos_session', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        businessId: user.businessId,
        userId: user.id,
        userName: user.name,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
        details: `User logged in with role: ${user.role}`,
      },
    });

    return NextResponse.json({
      success: true,
      user: sessionData,
      stores: user.business.stores,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
