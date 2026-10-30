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
    const action = searchParams.get('action');

    const whereClause: any = {
      businessId: session.businessId,
    };

    if (action && action !== 'ALL') {
      whereClause.action = action;
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Audit logs error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch audit logs' }, { status: 500 });
  }
}
