import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const business = await prisma.business.findUnique({
    where: { id: session.businessId },
    include: {
      settings: true,
      stores: {
        include: {
          counters: true,
        },
      },
    },
  });

  return NextResponse.json({
    authenticated: true,
    user: session,
    business,
  });
}

export async function POST() {
  cookies().delete('zyden_pos_session');
  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
