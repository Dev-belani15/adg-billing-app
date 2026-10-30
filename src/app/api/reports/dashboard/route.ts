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
    const storeId = searchParams.get('storeId') || session.storeId;

    // 1. Fetch all store invoices
    const invoices = await prisma.salesInvoice.findMany({
      where: {
        storeId,
        isVoid: false,
      },
      include: {
        lines: true,
        payments: true,
        counter: true,
        cashier: { select: { id: true, name: true } },
        returns: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Aggregate Key Metrics
    let grossSales = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalReturns = 0;
    const paymentMethods: { [key: string]: number } = { CASH: 0, UPI: 0, CARD: 0, OTHER: 0 };
    const counterPerformance: { [key: string]: { name: string; sales: number; bills: number } } = {};
    const cashierPerformance: { [key: string]: { name: string; sales: number; bills: number } } = {};
    const productSalesMap: { [key: string]: { name: string; qty: number; revenue: number } } = {};

    for (const inv of invoices) {
      grossSales += inv.totalAmount;
      totalDiscount += inv.discountAmount;
      totalTax += inv.taxAmount;

      for (const ret of inv.returns) {
        totalReturns += ret.refundAmount;
      }

      // Payments
      for (const p of inv.payments) {
        const m = p.method.toUpperCase();
        if (paymentMethods[m] !== undefined) {
          paymentMethods[m] += p.amount;
        } else {
          paymentMethods['OTHER'] = (paymentMethods['OTHER'] || 0) + p.amount;
        }
      }

      // Counter
      const cName = inv.counter.name;
      if (!counterPerformance[cName]) {
        counterPerformance[cName] = { name: cName, sales: 0, bills: 0 };
      }
      counterPerformance[cName].sales += inv.totalAmount;
      counterPerformance[cName].bills += 1;

      // Cashier
      const kName = inv.cashier.name;
      if (!cashierPerformance[kName]) {
        cashierPerformance[kName] = { name: kName, sales: 0, bills: 0 };
      }
      cashierPerformance[kName].sales += inv.totalAmount;
      cashierPerformance[kName].bills += 1;

      // Products
      for (const line of inv.lines) {
        if (!productSalesMap[line.productId]) {
          productSalesMap[line.productId] = { name: line.productName, qty: 0, revenue: 0 };
        }
        productSalesMap[line.productId].qty += line.quantity;
        productSalesMap[line.productId].revenue += line.lineTotal;
      }
    }

    const netSales = Math.max(0, grossSales - totalReturns);
    const billCount = invoices.length;
    const averageBillValue = billCount > 0 ? Math.round((grossSales / billCount) * 100) / 100 : 0;

    // 3. Low stock and inventory summary
    const [lowStockCount, totalProducts, categories] = await Promise.all([
      prisma.product.count({
        where: {
          businessId: session.businessId,
          stockBalances: {
            some: {
              storeId,
              quantity: { lte: 10 },
            },
          },
        },
      }),
      prisma.product.count({ where: { businessId: session.businessId } }),
      prisma.category.findMany({
        where: { businessId: session.businessId },
        include: { _count: { select: { products: true } } },
      }),
    ]);

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // 4. Fetch recent expenses
    const recentExpenses = await prisma.expense.aggregate({
      where: { storeId },
      _sum: { amount: true },
    });

    return NextResponse.json({
      metrics: {
        grossSales: Math.round(grossSales * 100) / 100,
        netSales: Math.round(netSales * 100) / 100,
        totalReturns: Math.round(totalReturns * 100) / 100,
        billCount,
        averageBillValue,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        totalExpenses: Math.round((recentExpenses._sum.amount || 0) * 100) / 100,
        lowStockCount,
        totalProducts,
      },
      paymentMethods,
      counterPerformance: Object.values(counterPerformance),
      cashierPerformance: Object.values(cashierPerformance),
      topSellingProducts,
      categories: categories.map((c) => ({ name: c.name, count: c._count.products })),
      recentInvoices: invoices.slice(0, 8),
    });
  } catch (error: any) {
    console.error('Dashboard report error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch dashboard' }, { status: 500 });
  }
}
