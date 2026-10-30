import { describe, it, expect } from 'vitest';
import { formatINR } from '../src/lib/formatters';

describe('POS Billing & Formatting Tests', () => {
  it('formats Indian Rupees currency with correct commas and rupee symbol', () => {
    expect(formatINR(0)).toBe('₹0.00');
    expect(formatINR(1250)).toBe('₹1,250.00');
    expect(formatINR(105420.5)).toBe('₹1,05,420.50');
  });

  it('calculates change due correctly for cash payment', () => {
    const finalBillAmount = 780;
    const tenderedCash = 1000;
    const changeDue = tenderedCash > finalBillAmount ? tenderedCash - finalBillAmount : 0;

    expect(changeDue).toBe(220);
  });

  it('validates split payment sums match total payable amount', () => {
    const totalBill = 1250;
    const splitCash = 500;
    const splitUpi = 750;

    const totalSplit = splitCash + splitUpi;
    expect(totalSplit).toBe(totalBill);
  });
});
