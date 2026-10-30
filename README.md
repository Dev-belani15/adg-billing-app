# Zyden Retail ERP & POS (Project: ADG)
### Production-Grade Indian Retail Billing, Live Multi-Counter Inventory & GST Compliance Platform

Designed and engineered for **Zyden IT Solutions** to empower modern supermarket chains, FMCG retailers, and department stores to bill customers faster, maintain real-time inventory across multiple counters, eliminate cashier stock discrepancies, and generate GST-compliant invoices and tax returns.

---

## 🌟 Executive Summary & Key Highlights

- **4 High-Speed Simultaneous Counters**: Designed for peak retail throughput with shared, real-time authoritative stock ledger locking.
- **Indian GST Engine**: Dynamic calculation of CGST (50%), SGST (50%), and IGST (100%), HSN/SAC summary aggregation, B2B/B2C invoice classification, and export-ready GSTR-1 & GSTR-3B schedules.
- **Barcode-Driven POS**: Direct USB scanner support (`input autofocus`, debounce, EAN-13/UPC/Code128 auto-detection), repeat scanning quantity incrementation, line discounts, bill-level discounts, and suspended ("held") bill queues.
- **Dual Printing Formats**: 
  - Standard **80mm Thermal Receipt** with store GSTIN, HSN breakdown, cashier counter ID, and payment breakdown.
  - Full-page **A4 Tax Invoice** for corporate B2B credit sales.
  - Printable **Barcode Product Price Tags** with customizable grid layout.
- **Cashier Shifts & Cash Reconciliation**: Opening float, active sales tracking, cash drop recording, denomination-level physical cash counting, and manager-approved variance tracking.
- **Auditable Stock Ledger**: Every sale, return, adjustment, and receipt writes an immutable `StockMovement` row with before/after balances, preventing silent inventory edits or negative stock.
- **Two-Stage Procurement (GRN)**: Purchase Order (PO) generation -> Goods Receiving Note (GRN) scanning with accepted, damaged, and missing quantity routing.
- **Customer Loyalty & Customer Credit**: Mobile-number lookup, 1% loyalty point accrual, coupon validation, and customer credit ledgers.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Zyden Retail ERP & POS (Next.js 14)                  │
├────────────────────────────────┬───────────────────────────────────────┤
│          Cashier POS           │         Back-Office ERP               │
│  - Counter 1 to 4 Selection    │  - Real-Time Executive Dashboard      │
│  - Barcode Scanner Listener    │  - Product Catalog & Batch Tracking   │
│  - Cart & Price Modifiers      │  - Stock Movement Ledger & Audits     │
│  - Split Tender (Cash/UPI/Card)│  - Purchase Orders & Receiving (GRN)  │
│  - Held Bill Storage & Resume  │  - Suppliers, Payables & Expenses     │
│  - 80mm Thermal Print Engine   │  - Customers, Credit & Loyalty Engine │
│  - Cashier Shift Reconciliation│  - GSTR-1 / GSTR-3B Tax Filing Preps  │
│                                │  - Staff Permissions & Security Logs  │
└────────────────┬───────────────┴───────────────────┬───────────────────┘
                 │                                   │
                 ▼                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 RESTful API & Serverless Middleware                   │
│   - Idempotency Engine (/api/pos/checkout)                             │
│   - Indian GST Tax Calculator (src/lib/gst.ts)                         │
│   - Atomic Inventory Ledger Validator (src/lib/inventory.ts)          │
│   - Role-Based Access Control Middleware (src/lib/auth.ts)             │
└────────────────────────────────┬───────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Prisma Data Access Layer                            │
│  - 35+ Normalized Relational Models                                   │
│  - Foreign Keys, Cascade Protections, Unique Sequential Counters       │
│  - SQLite (Instant Zero-Config Dev) / PostgreSQL (Production Docker)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Demo Accounts & Pre-Configured Roles

All demo accounts use password: `admin123`

| Role | Email | Name | Permitted Capabilities |
|---|---|---|---|
| **Business Owner** | `owner@zyden.com` | Aditya Sharma | Full administrative, financial, GST, profit reports, settings, and staff management |
| **Store Manager** | `manager@zyden.com` | Rajesh Verma | Daily operations, stock adjustments, shift closing, return approvals |
| **Cashier 1** | `cashier1@zyden.com` | Priya Singh | Counter 1 POS billing, barcode scanning, shift opening/closing |
| **Cashier 2** | `cashier2@zyden.com` | Rohan Patel | Counter 2 POS billing, cash collection, customer lookup |
| **Storekeeper / Inventory** | `storekeeper@zyden.com` | Suresh Kumar | Goods receiving (GRN), stock counts, barcode printing, batch tracking |
| **Accountant** | `accountant@zyden.com` | Neha Gupta | GST reporting (GSTR-1/3B), expense cashbook, supplier payments, audit logs |
| **Auditor (Read-Only)** | `auditor@zyden.com` | Amit Trivedi | Read-only inspection of stock ledger, invoices, shifts, and security logs |

> **Quick Switcher**: Click on the user profile badge at the top-right corner of any screen to test different roles on the fly without logging out.

---

## 🖥️ Screen Directory & Workflow Map (28 Implemented Screens)

1. **POS Billing Terminal** (`/pos`): Rapid checkout interface with counter selector (1-4), live USB barcode listener, quick-pick category grid, line discounts, split tender, and instant 80mm thermal receipt generator.
2. **Held-Bill Manager** (`/pos/held-bills`): Suspended cart manager allowing cashiers to park pending customer carts and recall them to any counter.
3. **Sales History** (`/sales`): Chronological register of completed, refunded, and cancelled bills with filters for customer, counter, and date range.
4. **Invoice Detail & Print** (`/sales/[id]`): Detailed invoice view with line-item HSN codes, CGST/SGST breakdowns, and print buttons for thermal slips and A4 invoices.
5. **Returns & Credit Notes** (`/returns`): Invoice-linked returns engine preventing over-returns, routing damaged goods to wastage and undamaged goods to saleable inventory.
6. **Executive Dashboard** (`/dashboard`): Real-time metrics including gross sales, net collections, average bill value, low-stock alerts, hourly sales charts, and top-selling products.
7. **Product Catalog** (`/products`): Full product management supporting EAN-13 barcodes, HSN codes, tax rates (0%, 5%, 12%, 18%, 28%), MRP, cost price, and stock reorder levels.
8. **Live Inventory & Valuation** (`/inventory`): Store-wise physical stock tracking with cost valuation, MRP valuation, and fast stock adjustment dialog.
9. **Stock Movement Ledger** (`/inventory/movements`): Immutable audit trail of every stock change (Sales, Goods Receipt, Returns, Adjustments) with before/after balances and operator attribution.
10. **Physical Stock Audit Sessions** (`/inventory/stock-count`): Barcode-scanned stock reconciliation session comparing counted units vs expected units with variance reporting.
11. **Barcode Label Designer & Print** (`/barcode-print`): Interactive tool to generate and print Code128 barcode labels with product name, price, and MRP in thermal or A4 sticker sheet formats.
12. **Purchase Orders** (`/purchases`): Procurement workflow for raising vendor POs with itemized quantities, costs, and expected delivery dates.
13. **Goods Receiving Note (GRN)** (`/purchases/receive`): Inbound stock receiving screen with barcode scanner verification, tracking received, accepted, damaged, and missing items with auto-ledger updating.
14. **Supplier Management** (`/suppliers`): Vendor directory with GSTINs, contact details, payment terms, outstanding payables, and payment logging.
15. **Customer Management** (`/customers`): Customer profiles with purchase history, outstanding credit balances, and loyalty points.
16. **Promotions & Coupons** (`/loyalty-promotions`): Configuration engine for percentage discounts, flat bill discounts, Buy-X-Get-Y offers, and coupon codes.
17. **Expenses & Cashbook** (`/expenses`): Daily petty cash and operating expense register categorized by utility, salary, rent, and maintenance.
18. **Cashier Shifts** (`/shifts`): Shift management module with opening float declaration, live payment tallies, denomination breakdown entry, and cash variance reporting.
19. **Staff & Permissions** (`/staff`): Employee management and role assignment for Owner, Manager, Cashier, Storekeeper, Accountant, and Auditor.
20. **GST & Tax Reports** (`/reports/gst`): India-specific tax reporting providing GSTR-1 B2B/B2C summaries, GSTR-3B tax payment calculations, and HSN rate-wise summaries.
21. **Business Analytics & Reports** (`/reports`): Multi-tab analytical reports covering sales trends, category performance, payment method breakdowns, and counter throughput.
22. **Branch Management** (`/branches`): Multi-store manager (Mumbai Central Superstore, Pune High Street Outlet) with inter-branch stock transfer logging.
23. **Notification Center** (`/notifications`): Centralized alert system for low stock levels, shift discrepancies, and pending approvals.
24. **Hardware & Printers** (`/settings/hardware`): Setup and diagnostics for USB barcode scanners, thermal receipt printers (80mm/58mm), electronic cash drawers, and weigh scales.
25. **Store Configuration** (`/settings`): Business legal entity profile, GSTIN, place of supply, invoice prefix series, and negative stock policy toggles.
26. **Security Audit Logs** (`/audit-logs`): Tamper-evident activity log tracking price overrides, voided bills, stock manual adjustments, and user authentications.
27. **Business Onboarding** (`/onboarding`): Multi-step setup wizard guiding new stores through GSTIN setup, counter allocation, initial inventory upload, and printer pairing.
28. **Login & Session Portal** (`/login`): Secure credentials-based authentication with quick-access role switcher for instant demonstration.

---

## 🚀 Getting Started & Local Development

### Prerequisites
- Node.js 18.x or 20.x (Recommended: v20 LTS)
- npm or pnpm

### Quick Setup (Zero-Dependency SQLite Mode)
The application comes pre-configured with a local SQLite database (`prisma/dev.db`), allowing you to get up and running without installing or configuring external database servers.

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Seed demo data (2 branches, 4 counters, 12 FMCG products, shifts, invoices)
node prisma/seed.js

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application will automatically direct you to the dashboard or POS terminal.

---

## 🐳 Production Deployment with Docker & PostgreSQL

For enterprise production deployments with managed PostgreSQL:

1. Copy the environment file and update the database URL:
```bash
cp .env.example .env
```

2. Start the application and PostgreSQL containers:
```bash
docker-compose up --build -d
```

3. Run migrations and seed data in the container:
```bash
docker exec -it zyden-retail-erp npx prisma migrate deploy
docker exec -it zyden-retail-erp node prisma/seed.js
```

---

## 🧪 Automated Testing

The platform includes comprehensive automated test suites covering tax algorithms, atomic stock decrements, and POS checkout workflows:

```bash
# Run all unit and integration tests via Vitest
npm run test
```

### Test Coverage Highlights:
- **`tests/gst.test.ts`**:
  - Intra-state tax split: 50% CGST + 50% SGST with exact 2-decimal half-cent precision.
  - Inter-state tax allocation: 100% IGST.
  - Tax-inclusive pricing back-calculation: `Taxable = Gross / (1 + Rate)`.
  - Indian retail rupee round-off: rounding to the nearest integer.
  - HSN aggregation breakdown across multiple cart items.
- **`tests/inventory.test.ts`**:
  - Atomic stock deductions and prevention of negative inventory.
  - Return stock handling: Routing undamaged returns to saleable inventory and damaged items to quarantined wastage ledger.
  - Purchase receipt stock incrementation.
- **`tests/pos.test.ts`**:
  - Barcode lookup and automatic quantity incrementation.
  - Multi-tender split payments (Cash + UPI) totaling exact bill amount.
  - Held bill persistence, retrieval, and removal upon finalization.

---

## 🖨️ Hardware & Barcode Scanner Setup Guide

### 1. USB Barcode Scanners (Honeywell, Zebra, TVS, Datalogic)
- The POS terminal utilizes a global keyboard input listener.
- Configure your scanner to emit a carriage return (`Enter` / `\r\n`) after every scan.
- When an item is scanned, the POS automatically locates the product by EAN-13, SKU, or Barcode and increments the cart line item quantity without cashier mouse clicks.

### 2. ESC/POS 80mm Thermal Receipt Printers (Epson, TVS RP3150, Citizen)
- Formatted with standard 48-column thermal layout.
- In browser print preview, select paper size **80mm / 3.125 inch** and disable "Headers and Footers" for clean, borderless docket printing.

### 3. Electronic Cash Drawer
- Connect the RJ11/RJ12 drawer kick cable to the thermal receipt printer.
- The ESC/POS print job sends the drawer kick pulse (`ESC p 0 25 250`) upon tender confirmation.

---

## 📜 Indian GST Compliance Checklist

- [x] **GSTIN Validation**: Format `27AABCZ1234F1Z5` validated for 15-character structure.
- [x] **Place of Supply Logic**: Compared against store state (`27-Maharashtra`) to accurately decide CGST/SGST vs IGST.
- [x] **HSN Code Snapping**: HSN codes (e.g. `1006` for Basmati Rice, `0402` for Amul Butter) captured immutably per invoice line.
- [x] **Invoice Numbering Sequence**: Consecutively incrementing financial year serial format (e.g., `ZYDEN/2026-27/0001`).
- [x] **Credit Notes**: Linked directly to original invoice with reason for credit and tax reversal calculation.
- [x] **GSTR-1 Preparation**: Distinct tables for B2B Registered Sales and B2C Unregistered Counter Invoices.
- [x] **GSTR-3B Preparation**: Section 3.1 summary of outward taxable supplies and eligible input tax credits (ITC).

---

## 💾 Database Backup & Disaster Recovery

### Automated Backup Script (PostgreSQL)
```bash
#!/bin/bash
# Backup script: backup-db.sh
BACKUP_DIR="/var/backups/zyden-erp"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR
pg_dump -U zyden -h localhost -d zyden_retail_erp -F c -b -v -f "$BACKUP_DIR/zyden_backup_$TIMESTAMP.dump"
# Keep last 30 days of backups
find $BACKUP_DIR -type f -name "*.dump" -mtime +30 -exec rm {} \;
```

### Restore Procedure
```bash
# To restore a backup archive:
pg_restore -U zyden -h localhost -d zyden_retail_erp -v -c "/var/backups/zyden-erp/zyden_backup_YYYYMMDD_HHMMSS.dump"
```

---

## ⚖️ License & Copyright
Developed for **Zyden IT Solutions**. All business workflows, database schemas, and architectural patterns are engineered according to the Indian Retail ERP & POS specification.
