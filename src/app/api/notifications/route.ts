import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error('Notifications error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    if (id) {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update notification' }, { status: 500 });
  }
}
