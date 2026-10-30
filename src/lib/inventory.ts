import { prisma } from './prisma';

export interface DeductStockItem {
  productId: string;
  quantity: number;
  batchId?: string;
}

export class InsufficientStockError extends Error {
  constructor(public productName: string, public available: number, public requested: number) {
    super(`Insufficient stock for "${productName}". Available: ${available}, Requested: ${requested}`);
    this.name = 'InsufficientStockError';
  }
}

/**
 * Deduct stock for an invoice sale in an atomic transaction
 */
export async function deductStockForSale(
  tx: any,
  storeId: string,
  items: DeductStockItem[],
  invoiceNumber: string,
  performedBy: string,
  allowNegativeStock: boolean = false
) {
  for (const item of items) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      include: {
        stockBalances: {
          where: { storeId },
        },
      },
    });

    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }

    const currentBalance = product.stockBalances[0]?.quantity || 0;

    if (!allowNegativeStock && currentBalance < item.quantity) {
      throw new InsufficientStockError(product.name, currentBalance, item.quantity);
    }

    const newBalance = currentBalance - item.quantity;

    // 1. Update StockBalance
    await tx.stockBalance.upsert({
      where: {
        storeId_productId: {
          storeId,
          productId: item.productId,
        },
      },
      update: {
        quantity: newBalance,
      },
      create: {
        storeId,
        productId: item.productId,
        quantity: newBalance,
      },
    });

    // 2. Append to Immutable StockMovement Ledger
    await tx.stockMovement.create({
      data: {
        storeId,
        productId: item.productId,
        type: 'SALE',
        quantity: -item.quantity,
        balanceAfter: newBalance,
        unitCost: product.costPrice,
        referenceId: invoiceNumber,
        reason: `POS Checkout Sale (Inv: ${invoiceNumber})`,
        performedBy,
      },
    });
  }
}

/**
 * Restore stock upon sales return
 */
export async function restoreStockForReturn(
  tx: any,
  storeId: string,
  items: Array<{ productId: string; quantity: number; condition: 'SALEABLE' | 'DAMAGED' }>,
  returnNumber: string,
  performedBy: string
) {
  for (const item of items) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      include: {
        stockBalances: {
          where: { storeId },
        },
      },
    });

    if (!product) continue;

    // Only restore to saleable balance if condition is SALEABLE
    if (item.condition === 'SALEABLE') {
      const currentBalance = product.stockBalances[0]?.quantity || 0;
      const newBalance = currentBalance + item.quantity;

      await tx.stockBalance.upsert({
        where: {
          storeId_productId: {
            storeId,
            productId: item.productId,
          },
        },
        update: {
          quantity: newBalance,
        },
        create: {
          storeId,
          productId: item.productId,
          quantity: newBalance,
        },
      });

      await tx.stockMovement.create({
        data: {
          storeId,
          productId: item.productId,
          type: 'SALE_RETURN',
          quantity: item.quantity,
          balanceAfter: newBalance,
          unitCost: product.costPrice,
          referenceId: returnNumber,
          reason: `Restored to saleable stock from Return ${returnNumber}`,
          performedBy,
        },
      });
    } else {
      // Record damage stock movement without restoring to saleable balance
      await tx.stockMovement.create({
        data: {
          storeId,
          productId: item.productId,
          type: 'DAMAGE',
          quantity: 0,
          balanceAfter: product.stockBalances[0]?.quantity || 0,
          unitCost: product.costPrice,
          referenceId: returnNumber,
          reason: `Returned as DAMAGED from Return ${returnNumber} (routed to quarantine/damage)`,
          performedBy,
        },
      });
    }
  }
}
