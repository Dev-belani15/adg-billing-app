import { describe, it, expect, vi } from 'vitest';
import { deductStockForSale, restoreStockForReturn, InsufficientStockError } from '../src/lib/inventory';

describe('Inventory Ledger and Atomic Stock Invariant Tests', () => {
  it('throws InsufficientStockError when requested quantity exceeds available stock and negative stock is disabled', async () => {
    const mockTx = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'prod_1',
          name: 'Aashirvaad Atta 5kg',
          costPrice: 230,
          stockBalances: [{ quantity: 5 }],
        }),
      },
    };

    await expect(
      deductStockForSale(
        mockTx,
        'store_1',
        [{ productId: 'prod_1', quantity: 10 }],
        'INV-1001',
        'Suresh (Cashier)',
        false // allowNegativeStock = false
      )
    ).rejects.toThrow(InsufficientStockError);
  });

  it('updates stock balance and records stock movement ledger when sufficient stock exists', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    const mockMovementCreate = vi.fn().mockResolvedValue({});

    const mockTx = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'prod_2',
          name: 'Amul Butter 500g',
          costPrice: 235,
          stockBalances: [{ quantity: 50 }],
        }),
      },
      stockBalance: { upsert: mockUpsert },
      stockMovement: { create: mockMovementCreate },
    };

    await deductStockForSale(
      mockTx,
      'store_1',
      [{ productId: 'prod_2', quantity: 3 }],
      'INV-1002',
      'Suresh (Cashier)',
      false
    );

    // Verify stock balance updated to 50 - 3 = 47
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { quantity: 47 },
      })
    );

    // Verify stock movement recorded with -3 quantity
    expect(mockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'SALE',
          quantity: -3,
          balanceAfter: 47,
          referenceId: 'INV-1002',
        }),
      })
    );
  });

  it('restores stock balance only for SALEABLE condition returns', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    const mockMovementCreate = vi.fn().mockResolvedValue({});

    const mockTx = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'prod_3',
          name: 'Tata Tea Gold',
          costPrice: 270,
          stockBalances: [{ quantity: 20 }],
        }),
      },
      stockBalance: { upsert: mockUpsert },
      stockMovement: { create: mockMovementCreate },
    };

    // Return 2 units as SALEABLE
    await restoreStockForReturn(
      mockTx,
      'store_1',
      [{ productId: 'prod_3', quantity: 2, condition: 'SALEABLE' }],
      'RET-1001',
      'Pooja (Manager)'
    );

    // Balance should increase by 2: 20 + 2 = 22
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { quantity: 22 },
      })
    );

    expect(mockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'SALE_RETURN',
          quantity: 2,
          balanceAfter: 22,
        }),
      })
    );
  });

  it('routes DAMAGED items to damage movement without restoring to saleable balance', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({});
    const mockMovementCreate = vi.fn().mockResolvedValue({});

    const mockTx = {
      product: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'prod_4',
          name: 'Fortune Oil 1L',
          costPrice: 135,
          stockBalances: [{ quantity: 30 }],
        }),
      },
      stockBalance: { upsert: mockUpsert },
      stockMovement: { create: mockMovementCreate },
    };

    // Return 1 unit as DAMAGED
    await restoreStockForReturn(
      mockTx,
      'store_1',
      [{ productId: 'prod_4', quantity: 1, condition: 'DAMAGED' }],
      'RET-1002',
      'Pooja (Manager)'
    );

    // Should NOT call upsert on stock balance!
    expect(mockUpsert).not.toHaveBeenCalled();

    // Should record DAMAGE movement
    expect(mockMovementCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'DAMAGE',
          quantity: 0,
          balanceAfter: 30,
        }),
      })
    );
  });
});
