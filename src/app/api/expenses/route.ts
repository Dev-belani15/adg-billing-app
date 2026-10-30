import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expenses = await prisma.expense.findMany({
      where: { storeId: session.storeId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
      take: 50,
    });

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({
      expenses,
      summary: {
        totalExpense: Math.round(totalExpense * 100) / 100,
        count: expenses.length,
      },
    });
  } catch (error: any) {
    console.error('Expenses error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, category, amount, paymentMode = 'CASH', payeeName, notes } = body;

    if (!title || !category || !amount) {
      return NextResponse.json({ error: 'Title, category, and amount are required' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        storeId: session.storeId,
        userId: session.userId,
        title: title.trim(),
        category,
        amount: Number(amount),
        paymentMode,
        payeeName: payeeName ? payeeName.trim() : null,
        notes: notes ? notes.trim() : null,
      },
      include: { user: true },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    console.error('Create expense error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create expense' }, { status: 500 });
  }
}
