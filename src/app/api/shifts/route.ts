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
    const counterId = searchParams.get('counterId');
    const status = searchParams.get('status');

    const whereClause: any = {
      storeId: session.storeId,
    };

    if (counterId) whereClause.counterId = counterId;
    if (status) whereClause.status = status;

    const shifts = await prisma.cashierShift.findMany({
      where: whereClause,
      include: {
        counter: true,
        user: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { sales: true } },
      },
      orderBy: { openedAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ shifts });
  } catch (error: any) {
    console.error('Shifts error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch shifts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, counterId, openingCash = 0, actualCash, notes, shiftId } = body;

    if (action === 'OPEN') {
      if (!counterId) {
        return NextResponse.json({ error: 'Counter is required to open shift' }, { status: 400 });
      }

      // Check if already an open shift on this counter
      const existingOpen = await prisma.cashierShift.findFirst({
        where: { counterId, status: 'OPEN' },
      });

      if (existingOpen) {
        return NextResponse.json({
          error: 'An open shift already exists on this counter. Please close it first.',
          existingShift: existingOpen,
        }, { status: 409 });
      }

      const count = await prisma.cashierShift.count({ where: { counterId } });
      const opening = Number(openingCash);

      const shift = await prisma.cashierShift.create({
        data: {
          storeId: session.storeId,
          counterId,
          userId: session.userId,
          shiftNumber: count + 1,
          openingCash: opening,
          expectedCash: opening,
          status: 'OPEN',
          notes: notes || 'Shift opened',
        },
        include: { counter: true, user: true },
      });

      await prisma.auditLog.create({
        data: {
          businessId: session.businessId,
          userId: session.userId,
          userName: session.userName,
          action: 'SHIFT_OPEN',
          entity: 'CashierShift',
          entityId: shift.id,
          details: `Opened Shift #${shift.shiftNumber} on ${shift.counter.name} with float ₹${opening}`,
        },
      });

      return NextResponse.json({ success: true, shift });
    } else if (action === 'CLOSE') {
      if (!shiftId) {
        return NextResponse.json({ error: 'Shift ID is required to close shift' }, { status: 400 });
      }

      const shift = await prisma.cashierShift.findUnique({
        where: { id: shiftId },
        include: { counter: true },
      });

      if (!shift) {
        return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
      }

      const counted = Number(actualCash);
      const difference = Math.round((counted - shift.expectedCash) * 100) / 100;

      const closed = await prisma.cashierShift.update({
        where: { id: shiftId },
        data: {
          status: 'CLOSED',
          actualCash: counted,
          cashDifference: difference,
          closedAt: new Date(),
          notes: notes || shift.notes,
        },
      });

      await prisma.auditLog.create({
        data: {
          businessId: session.businessId,
          userId: session.userId,
          userName: session.userName,
          action: 'SHIFT_CLOSE',
          entity: 'CashierShift',
          entityId: shift.id,
          details: `Closed Shift #${shift.shiftNumber} on ${shift.counter.name}. Expected: ₹${shift.expectedCash}, Counted: ₹${counted}, Difference: ₹${difference}`,
        },
      });

      return NextResponse.json({ success: true, shift: closed });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Shift action error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process shift action' }, { status: 500 });
  }
}
