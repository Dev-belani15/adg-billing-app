import { describe, it, expect } from 'vitest';
import {
  calculateLineTax,
  calculateInvoiceTotals,
  roundToTwoDecimals,
} from '../src/lib/gst';

describe('Indian GST & Tax Engine Tests', () => {
  it('correctly calculates 5% tax-inclusive price for single item', () => {
    // Atta 5kg: ₹265 (Includes 5% GST)
    // Base = 265 / 1.05 = 252.38
    // Tax = 12.62 (CGST: 6.31, SGST: 6.31)
    const result = calculateLineTax({
      productId: 'p1',
      unitPrice: 265,
      quantity: 1,
      taxRate: 5,
      isTaxInclusive: true,
    });

    expect(result.grossAmount).toBe(265);
    expect(result.netTaxableAmount).toBe(252.38);
    expect(result.taxAmount).toBe(12.62);
    expect(result.cgstAmount).toBe(6.31);
    expect(result.sgstAmount).toBe(6.31);
    expect(result.lineTotal).toBe(265);
  });

  it('correctly splits CGST and SGST equally for 18% tax-inclusive items', () => {
    // Cookies: 2 packs @ ₹40 = ₹80 (Includes 18% GST)
    // Base = 80 / 1.18 = 67.80
    // Tax = 12.20 (CGST: 6.10, SGST: 6.10)
    const result = calculateLineTax({
      productId: 'p2',
      unitPrice: 40,
      quantity: 2,
      taxRate: 18,
      isTaxInclusive: true,
    });

    expect(result.grossAmount).toBe(80);
    expect(result.taxAmount).toBe(12.20);
    expect(result.cgstAmount).toBe(6.10);
    expect(result.sgstAmount).toBe(6.10);
    expect(result.lineTotal).toBe(80);
  });

  it('correctly calculates inter-state IGST instead of CGST/SGST', () => {
    const result = calculateLineTax(
      {
        productId: 'p3',
        unitPrice: 100,
        quantity: 1,
        taxRate: 18,
        isTaxInclusive: false,
      },
      true // isInterState
    );

    expect(result.taxAmount).toBe(18);
    expect(result.igstAmount).toBe(18);
    expect(result.cgstAmount).toBe(0);
    expect(result.sgstAmount).toBe(0);
    expect(result.lineTotal).toBe(118);
  });

  it('handles 0% exempt commodities correctly (e.g. Salt)', () => {
    const result = calculateLineTax({
      productId: 'p4',
      unitPrice: 26,
      quantity: 2,
      taxRate: 0,
      isTaxInclusive: true,
    });

    expect(result.grossAmount).toBe(52);
    expect(result.taxAmount).toBe(0);
    expect(result.cgstAmount).toBe(0);
    expect(result.sgstAmount).toBe(0);
    expect(result.lineTotal).toBe(52);
  });

  it('aggregates multi-item invoice with HSN summary and Indian retail round-off', () => {
    const items = [
      { productId: '1', hsnCode: '1101', unitPrice: 265, quantity: 1, taxRate: 5, isTaxInclusive: true },
      { productId: '2', hsnCode: '0405', unitPrice: 260, quantity: 2, taxRate: 12, isTaxInclusive: true },
      { productId: '3', hsnCode: '1905', unitPrice: 40, quantity: 3, taxRate: 18, isTaxInclusive: true },
    ];

    const totals = calculateInvoiceTotals(items, 10, false); // ₹10 invoice discount

    // Gross = 265 + 520 + 120 = 905
    // Less ₹10 discount = 895
    expect(totals.subtotal).toBe(905);
    expect(totals.totalDiscount).toBe(10);
    expect(totals.finalPayableAmount).toBe(895);
    expect(totals.hsnSummary.length).toBe(3);
  });
});
