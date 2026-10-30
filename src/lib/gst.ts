/**
 * Indian GST and Financial Calculation Utility
 * High-precision rounding and tax breakdowns for Retail ERP & POS
 */

export interface LineItemInput {
  productId: string;
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
  taxRate: number; // e.g. 0, 5, 12, 18, 28
  isTaxInclusive?: boolean;
}

export interface CalculatedLineTax {
  grossAmount: number;
  discountAmount: number;
  netTaxableAmount: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  lineTotal: number;
}

export interface InvoiceTaxSummary {
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff: number;
  finalPayableAmount: number;
  hsnSummary: Array<{
    hsnCode: string;
    taxRate: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalTax: number;
  }>;
}

export function roundToTwoDecimals(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates tax for an individual line item
 */
export function calculateLineTax(
  item: LineItemInput,
  isInterState: boolean = false
): CalculatedLineTax {
  const quantity = Math.max(0, item.quantity);
  const unitPrice = Math.max(0, item.unitPrice);
  const discount = Math.min(unitPrice * quantity, Math.max(0, item.discountAmount || 0));
  const isInclusive = item.isTaxInclusive !== false; // default true
  const taxRate = Math.max(0, item.taxRate);

  const gross = roundToTwoDecimals(unitPrice * quantity);
  const netAfterDiscount = roundToTwoDecimals(gross - discount);

  let netTaxableAmount = 0;
  let taxAmount = 0;

  if (taxRate === 0) {
    netTaxableAmount = netAfterDiscount;
    taxAmount = 0;
  } else if (isInclusive) {
    // Price includes tax: Taxable = Net / (1 + Rate / 100)
    netTaxableAmount = roundToTwoDecimals((netAfterDiscount * 100) / (100 + taxRate));
    taxAmount = roundToTwoDecimals(netAfterDiscount - netTaxableAmount);
  } else {
    // Price excludes tax: Taxable = Net
    netTaxableAmount = netAfterDiscount;
    taxAmount = roundToTwoDecimals((netTaxableAmount * taxRate) / 100);
  }

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isInterState) {
    igst = taxAmount;
  } else {
    // Intra-state split equally into CGST & SGST
    cgst = roundToTwoDecimals(taxAmount / 2);
    sgst = roundToTwoDecimals(taxAmount - cgst); // Ensure exact sum
  }

  const lineTotal = isInclusive
    ? netAfterDiscount
    : roundToTwoDecimals(netTaxableAmount + taxAmount);

  return {
    grossAmount: gross,
    discountAmount: discount,
    netTaxableAmount,
    taxAmount,
    cgstAmount: cgst,
    sgstAmount: sgst,
    igstAmount: igst,
    lineTotal,
  };
}

/**
 * Calculates full invoice totals including rounding off
 */
export function calculateInvoiceTotals(
  items: Array<LineItemInput & { hsnCode?: string }>,
  invoiceDiscount: number = 0,
  isInterState: boolean = false
): InvoiceTaxSummary {
  let subtotal = 0;
  let totalLineDiscounts = 0;
  let taxableAmount = 0;
  let totalTax = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const hsnMap: { [key: string]: { hsnCode: string; taxRate: number; taxable: number; cgst: number; sgst: number; igst: number; tax: number } } = {};

  for (const item of items) {
    const lineRes = calculateLineTax(item, isInterState);
    subtotal += lineRes.grossAmount;
    totalLineDiscounts += lineRes.discountAmount;
    taxableAmount += lineRes.netTaxableAmount;
    totalTax += lineRes.taxAmount;
    totalCgst += lineRes.cgstAmount;
    totalSgst += lineRes.sgstAmount;
    totalIgst += lineRes.igstAmount;

    const hsnKey = `${item.hsnCode || 'GENERAL'}-${item.taxRate}`;
    if (!hsnMap[hsnKey]) {
      hsnMap[hsnKey] = {
        hsnCode: item.hsnCode || 'GENERAL',
        taxRate: item.taxRate,
        taxable: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
        tax: 0,
      };
    }
    hsnMap[hsnKey].taxable += lineRes.netTaxableAmount;
    hsnMap[hsnKey].cgst += lineRes.cgstAmount;
    hsnMap[hsnKey].sgst += lineRes.sgstAmount;
    hsnMap[hsnKey].igst += lineRes.igstAmount;
    hsnMap[hsnKey].tax += lineRes.taxAmount;
  }

  const totalDiscount = roundToTwoDecimals(totalLineDiscounts + Math.max(0, invoiceDiscount));
  const rawPayable = Math.max(0, subtotal - totalDiscount + (items.some(i => i.isTaxInclusive === false) ? totalTax : 0));
  
  // Standard Indian Retail: round off to nearest integer
  const finalPayableAmount = Math.round(rawPayable);
  const roundOff = roundToTwoDecimals(finalPayableAmount - rawPayable);

  const hsnSummary = Object.values(hsnMap).map((h) => ({
    hsnCode: h.hsnCode,
    taxRate: h.taxRate,
    taxableAmount: roundToTwoDecimals(h.taxable),
    cgstAmount: roundToTwoDecimals(h.cgst),
    sgstAmount: roundToTwoDecimals(h.sgst),
    igstAmount: roundToTwoDecimals(h.igst),
    totalTax: roundToTwoDecimals(h.tax),
  }));

  return {
    subtotal: roundToTwoDecimals(subtotal),
    totalDiscount,
    taxableAmount: roundToTwoDecimals(taxableAmount),
    taxAmount: roundToTwoDecimals(totalTax),
    cgstAmount: roundToTwoDecimals(totalCgst),
    sgstAmount: roundToTwoDecimals(totalSgst),
    igstAmount: roundToTwoDecimals(totalIgst),
    roundOff,
    finalPayableAmount,
    hsnSummary,
  };
}
