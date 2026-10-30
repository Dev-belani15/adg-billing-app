const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Zyden ADG Retail ERP & POS Database...');

  // Clean existing data for clean seed
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.salesReturnLine.deleteMany();
  await prisma.salesReturn.deleteMany();
  await prisma.salesInvoiceLine.deleteMany();
  await prisma.salesInvoice.deleteMany();
  await prisma.cashierShift.deleteMany();
  await prisma.stockTransferLine.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.stockCountLine.deleteMany();
  await prisma.stockCount.deleteMany();
  await prisma.goodsReceipt.deleteMany();
  await prisma.purchaseOrderLine.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockBalance.deleteMany();
  await prisma.inventoryBatch.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.loyaltyTransaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.counter.deleteMany();
  await prisma.user.deleteMany();
  await prisma.businessSettings.deleteMany();
  await prisma.store.deleteMany();
  await prisma.business.deleteMany();
  await prisma.notification.deleteMany();

  // 1. Create Business
  const business = await prisma.business.create({
    data: {
      name: 'Zyden Retail Mart',
      legalName: 'Zyden IT Solutions & Retail Enterprises Pvt Ltd',
      gstin: '27AABCA1234F1Z8',
      email: 'contact@zydenretail.com',
      phone: '+91 98200 12345',
      address: 'Shop 12-15, Phoenix Grand Galleria, S.B. Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400013',
      currencySymbol: '₹',
      settings: {
        create: {
          invoicePrefix: 'ZYD-',
          invoiceNextNumber: 1042,
          financialYear: '2026-27',
          isTaxInclusiveDefault: true,
          maxCashierDiscountPct: 15.0,
          enableLoyalty: true,
          loyaltyPointsPer100: 1.0,
          loyaltyRedeemValue: 1.0,
          thermalPrinterWidth: '80mm',
          enableBarcodeScanner: true,
          allowNegativeStock: false,
        },
      },
    },
  });

  // 2. Create Stores
  const mainStore = await prisma.store.create({
    data: {
      businessId: business.id,
      name: 'Mumbai Central Superstore',
      code: 'MUM-01',
      address: 'Phoenix Grand Galleria, Lower Parel, Mumbai',
      phone: '+91 98200 12345',
      email: 'mumbai@zydenretail.com',
      gstin: '27AABCA1234F1Z8',
      state: 'Maharashtra',
      isMainBranch: true,
    },
  });

  const puneStore = await prisma.store.create({
    data: {
      businessId: business.id,
      name: 'Pune FC Road Express',
      code: 'PUN-02',
      address: '102 Fergusson College Road, Shivajinagar, Pune',
      phone: '+91 98200 54321',
      email: 'pune@zydenretail.com',
      gstin: '27AABCA1234F1Z8',
      state: 'Maharashtra',
      isMainBranch: false,
    },
  });

  // 3. Create 4 Billing Counters for Main Store
  const counters = [];
  const counterConfigs = [
    { num: 1, name: 'Counter 1 (Express Checkout - Scan & Go)', desc: 'Optimized for <10 items & quick UPI' },
    { num: 2, name: 'Counter 2 (Grocery & FMCG Counter)', desc: 'General supermarket billing counter' },
    { num: 3, name: 'Counter 3 (Dairy, Staples & Produce)', desc: 'Weighing scale & barcode terminal' },
    { num: 4, name: 'Counter 4 (Customer Service & Bulk POS)', desc: 'Bulk billing & returns processing' },
  ];

  for (const c of counterConfigs) {
    const counter = await prisma.counter.create({
      data: {
        storeId: mainStore.id,
        counterNumber: c.num,
        name: c.name,
        description: c.desc,
        isActive: true,
      },
    });
    counters.push(counter);
  }

  // 4. Create Users (Roles: OWNER, ADMIN, STORE_MANAGER, CASHIER, STOREKEEPER, ACCOUNTANT, AUDITOR)
  // Password hash for 'admin123' / demo accounts: using clean sha256 or bcrypt representation
  const users = [
    { name: 'Aditya Sharma', email: 'owner@zyden.com', role: 'OWNER', phone: '9820111111' },
    { name: 'Rajesh Verma', email: 'admin@zyden.com', role: 'ADMIN', phone: '9820222222' },
    { name: 'Pooja Kulkarni', email: 'manager@zyden.com', role: 'STORE_MANAGER', phone: '9820333333' },
    { name: 'Suresh Patil', email: 'cashier1@zyden.com', role: 'CASHIER', phone: '9820444444' },
    { name: 'Neha Deshmukh', email: 'cashier2@zyden.com', role: 'CASHIER', phone: '9820555555' },
    { name: 'Ganesh More', email: 'inventory@zyden.com', role: 'STOREKEEPER', phone: '9820666666' },
    { name: 'Sunil Mehta', email: 'accountant@zyden.com', role: 'ACCOUNTANT', phone: '9820777777' },
    { name: 'Amitabh Sen', email: 'auditor@zyden.com', role: 'AUDITOR', phone: '9820888888' },
  ];

  const createdUsers = {};
  for (const u of users) {
    const user = await prisma.user.create({
      data: {
        businessId: business.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        passwordHash: 'admin123', // Demo authentication
        role: u.role,
        isActive: true,
      },
    });
    createdUsers[u.email] = user;
  }

  // 5. Create Categories
  const categoriesData = [
    { name: 'Grocery & Staples', desc: 'Atta, Rice, Dal, Edible Oils, Sugar & Spices', color: '#10b981' },
    { name: 'Dairy & Bakery', desc: 'Milk, Butter, Cheese, Bread, Eggs & Paneer', color: '#f59e0b' },
    { name: 'Beverages & Drinks', desc: 'Tea, Coffee, Cold Drinks, Juices & Health Drinks', color: '#3b82f6' },
    { name: 'Snacks & Packaged Food', desc: 'Biscuits, Noodles, Chips, Namkeen & Chocolates', color: '#8b5cf6' },
    { name: 'Personal & Home Care', desc: 'Soaps, Shampoos, Detergents, Toothpaste & Cleaners', color: '#ec4899' },
  ];

  const catMap = {};
  for (const c of categoriesData) {
    const cat = await prisma.category.create({
      data: {
        businessId: business.id,
        name: c.name,
        description: c.desc,
        colorTag: c.color,
      },
    });
    catMap[c.name] = cat.id;
  }

  // 6. Create Brands
  const brandsList = ['Aashirvaad', 'Amul', 'Tata', 'Fortune', 'Britannia', 'Nestle', 'Cadbury', 'Surf Excel', 'Dabur', 'Colgate', 'Paper Boat'];
  const brandMap = {};
  for (const b of brandsList) {
    const brand = await prisma.brand.create({
      data: {
        businessId: business.id,
        name: b,
      },
    });
    brandMap[b] = brand.id;
  }

  // 7. Create Products with EAN-13 Barcodes, HSN Codes, Taxes & Stock
  const productsSeed = [
    {
      name: 'Aashirvaad Shudh Chakki Atta 5kg',
      sku: 'ATT-AAS-05K',
      barcode: '8901030012345',
      category: 'Grocery & Staples',
      brand: 'Aashirvaad',
      hsnCode: '1101',
      unit: 'PACK',
      costPrice: 230.0,
      sellingPrice: 265.0,
      mrp: 290.0,
      taxRate: 5.0,
      isTaxInclusive: true,
      minStock: 10,
      stockQty: 85,
    },
    {
      name: 'Amul Butter Pasteurised 500g',
      sku: 'BUT-AMU-500',
      barcode: '8901262010111',
      category: 'Dairy & Bakery',
      brand: 'Amul',
      hsnCode: '0405',
      unit: 'PACK',
      costPrice: 235.0,
      sellingPrice: 260.0,
      mrp: 275.0,
      taxRate: 12.0,
      isTaxInclusive: true,
      minStock: 15,
      stockQty: 120,
    },
    {
      name: 'Tata Tea Gold 500g Pet Jar',
      sku: 'TEA-TAT-500',
      barcode: '8901491101010',
      category: 'Beverages & Drinks',
      brand: 'Tata',
      hsnCode: '0902',
      unit: 'PACK',
      costPrice: 270.0,
      sellingPrice: 310.0,
      mrp: 340.0,
      taxRate: 5.0,
      isTaxInclusive: true,
      minStock: 8,
      stockQty: 60,
    },
    {
      name: 'Fortune Sunlite Refined Sunflower Oil 1L Pouch',
      sku: 'OIL-FOR-01L',
      barcode: '8901719101015',
      category: 'Grocery & Staples',
      brand: 'Fortune',
      hsnCode: '1512',
      unit: 'PACK',
      costPrice: 135.0,
      sellingPrice: 155.0,
      mrp: 175.0,
      taxRate: 5.0,
      isTaxInclusive: true,
      minStock: 20,
      stockQty: 140,
    },
    {
      name: 'Britannia Good Day Butter Cookies 200g',
      sku: 'BIS-BRI-200',
      barcode: '8901063012345',
      category: 'Snacks & Packaged Food',
      brand: 'Britannia',
      hsnCode: '1905',
      unit: 'PCS',
      costPrice: 32.0,
      sellingPrice: 40.0,
      mrp: 45.0,
      taxRate: 18.0,
      isTaxInclusive: true,
      minStock: 25,
      stockQty: 250,
    },
    {
      name: 'Maggi 2-Minute Masala Noodles 280g (Pack of 4)',
      sku: 'NOD-MAG-280',
      barcode: '8901058852233',
      category: 'Snacks & Packaged Food',
      brand: 'Nestle',
      hsnCode: '1902',
      unit: 'PACK',
      costPrice: 45.0,
      sellingPrice: 54.0,
      mrp: 60.0,
      taxRate: 18.0,
      isTaxInclusive: true,
      minStock: 30,
      stockQty: 180,
    },
    {
      name: 'Surf Excel Easy Wash Detergent Powder 1kg',
      sku: 'DET-SUR-01K',
      barcode: '8901030383829',
      category: 'Personal & Home Care',
      brand: 'Surf Excel',
      hsnCode: '3402',
      unit: 'PACK',
      costPrice: 112.0,
      sellingPrice: 132.0,
      mrp: 145.0,
      taxRate: 18.0,
      isTaxInclusive: true,
      minStock: 15,
      stockQty: 90,
    },
    {
      name: 'Cadbury Dairy Milk Silk Chocolate 150g',
      sku: 'CHO-CAD-150',
      barcode: '8901233024823',
      category: 'Snacks & Packaged Food',
      brand: 'Cadbury',
      hsnCode: '1806',
      unit: 'PCS',
      costPrice: 140.0,
      sellingPrice: 165.0,
      mrp: 180.0,
      taxRate: 18.0,
      isTaxInclusive: true,
      minStock: 20,
      stockQty: 110,
    },
    {
      name: 'Dabur 100% Pure Honey 500g Squeezy',
      sku: 'HON-DAB-500',
      barcode: '8902080001010',
      category: 'Grocery & Staples',
      brand: 'Dabur',
      hsnCode: '0409',
      unit: 'PCS',
      costPrice: 170.0,
      sellingPrice: 199.0,
      mrp: 230.0,
      taxRate: 5.0,
      isTaxInclusive: true,
      minStock: 12,
      stockQty: 75,
    },
    {
      name: 'Tata Salt Vacuum Evaporated Iodised Salt 1kg',
      sku: 'SLT-TAT-01K',
      barcode: '8906010501012',
      category: 'Grocery & Staples',
      brand: 'Tata',
      hsnCode: '2501',
      unit: 'PACK',
      costPrice: 21.0,
      sellingPrice: 26.0,
      mrp: 28.0,
      taxRate: 0.0,
      isTaxInclusive: true,
      minStock: 30,
      stockQty: 200,
    },
    {
      name: 'Colgate Strong Teeth Anticavity Toothpaste 300g Saver',
      sku: 'PAS-COL-300',
      barcode: '8901030022211',
      category: 'Personal & Home Care',
      brand: 'Colgate',
      hsnCode: '3306',
      unit: 'PCS',
      costPrice: 130.0,
      sellingPrice: 155.0,
      mrp: 175.0,
      taxRate: 18.0,
      isTaxInclusive: true,
      minStock: 15,
      stockQty: 85,
    },
    {
      name: 'Paper Boat Aamras Mango Fruit Juice 1L',
      sku: 'JUC-PAP-01L',
      barcode: '8901112223334',
      category: 'Beverages & Drinks',
      brand: 'Paper Boat',
      hsnCode: '2202',
      unit: 'PCS',
      costPrice: 92.0,
      sellingPrice: 110.0,
      mrp: 125.0,
      taxRate: 12.0,
      isTaxInclusive: true,
      minStock: 15,
      stockQty: 65,
    },
  ];

  const createdProducts = [];
  for (const p of productsSeed) {
    const prod = await prisma.product.create({
      data: {
        businessId: business.id,
        categoryId: catMap[p.category],
        brandId: brandMap[p.brand],
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        hsnCode: p.hsnCode,
        unit: p.unit,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        mrp: p.mrp,
        taxRate: p.taxRate,
        isTaxInclusive: p.isTaxInclusive,
        minStockLevel: p.minStock,
        reorderQty: 25,
        isActive: true,
      },
    });
    createdProducts.push(prod);

    // Seed stock balance for Main Store
    await prisma.stockBalance.create({
      data: {
        storeId: mainStore.id,
        productId: prod.id,
        quantity: p.stockQty,
      },
    });

    // Seed initial stock balance for Pune Store (approx 40% of main)
    await prisma.stockBalance.create({
      data: {
        storeId: puneStore.id,
        productId: prod.id,
        quantity: Math.floor(p.stockQty * 0.4),
      },
    });

    // Record Opening Stock Movement
    await prisma.stockMovement.create({
      data: {
        storeId: mainStore.id,
        productId: prod.id,
        type: 'OPENING',
        quantity: p.stockQty,
        balanceAfter: p.stockQty,
        unitCost: p.costPrice,
        reason: 'Initial opening stock ledger entry',
        performedBy: 'Ganesh More (Storekeeper)',
      },
    });
  }

  // 8. Create Customers
  const customers = [
    { name: 'Vikram Joshi', phone: '9820011223', email: 'vikram.j@gmail.com', address: 'B-402, Raheja Gardens, Worli', points: 145.0 },
    { name: 'Sunita Rao', phone: '9833344556', email: 'sunita.rao@outlook.com', address: 'Flat 12, Sunrise Apts, Lower Parel', points: 80.0 },
    { name: 'Rohit Khandelwal', phone: '9819988776', email: 'rohit.k@yahoo.com', address: 'Plot 77, Dadar West, Mumbai', points: 220.0 },
    { name: 'Walk-in Retail Customer', phone: '9999999999', email: 'cash@retail.local', address: 'Mumbai', points: 0.0 },
  ];

  const createdCustomers = [];
  for (const c of customers) {
    const cust = await prisma.customer.create({
      data: {
        businessId: business.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        loyaltyPoints: c.points,
      },
    });
    createdCustomers.push(cust);
  }

  // 9. Create Suppliers
  const suppliers = [
    {
      name: 'Metro Cash & Carry India Pvt Ltd',
      companyName: 'Metro Wholesalers',
      gstin: '27AABCM8901D1Z2',
      phone: '+91 22 6677 8899',
      email: 'sales@metroindia.com',
      address: 'Plot 3, Thane Belapur Road, Navi Mumbai',
      balance: 45200.0,
    },
    {
      name: 'Amul Dairy Distributors Mumbai',
      companyName: 'GCMMF Mumbai Depot',
      gstin: '27AAACG1234M1Z5',
      phone: '+91 22 2411 2233',
      email: 'order@amuldairy.in',
      address: 'Kurla West Industrial Estate, Mumbai',
      balance: 18400.0,
    },
    {
      name: 'Tata Consumer Products Supply Hub',
      companyName: 'Tata Consumer Logistics',
      gstin: '27AAACT9988K1Z1',
      phone: '+91 22 6123 4567',
      email: 'orders@tataconsumer.com',
      address: 'Godown 14, Bhiwandi Logistics Park',
      balance: 29000.0,
    },
  ];

  for (const s of suppliers) {
    await prisma.supplier.create({
      data: {
        businessId: business.id,
        name: s.name,
        companyName: s.companyName,
        gstin: s.gstin,
        phone: s.phone,
        email: s.email,
        address: s.address,
        currentBalance: s.balance,
      },
    });
  }

  // 10. Create Active Cashier Shifts for Counter 1 and Counter 2
  const shift1 = await prisma.cashierShift.create({
    data: {
      storeId: mainStore.id,
      counterId: counters[0].id,
      userId: createdUsers['cashier1@zyden.com'].id,
      shiftNumber: 1,
      openingCash: 2000.0,
      expectedCash: 2000.0,
      totalSales: 0.0,
      cashSales: 0.0,
      upiSales: 0.0,
      cardSales: 0.0,
      status: 'OPEN',
      notes: 'Morning shift started with Rs 2,000 float',
    },
  });

  const shift2 = await prisma.cashierShift.create({
    data: {
      storeId: mainStore.id,
      counterId: counters[1].id,
      userId: createdUsers['cashier2@zyden.com'].id,
      shiftNumber: 1,
      openingCash: 2500.0,
      expectedCash: 2500.0,
      totalSales: 0.0,
      cashSales: 0.0,
      upiSales: 0.0,
      cardSales: 0.0,
      status: 'OPEN',
      notes: 'Morning shift float verified',
    },
  });

  // 11. Create Promotions / Coupons
  const promos = [
    { code: 'WELCOME50', title: 'Flat ₹50 Off on First Order', type: 'FIXED_AMOUNT', val: 50.0, min: 499.0 },
    { code: 'FESTIVE10', title: 'Festive Season 10% Discount', type: 'PERCENTAGE', val: 10.0, min: 999.0, max: 250.0 },
    { code: 'SUPER100', title: 'Super Saver ₹100 Off on Grocery', type: 'FIXED_AMOUNT', val: 100.0, min: 1499.0 },
  ];

  for (const pr of promos) {
    await prisma.promotion.create({
      data: {
        code: pr.code,
        title: pr.title,
        discountType: pr.type,
        value: pr.val,
        minBillTotal: pr.min,
        maxDiscount: pr.max || null,
        isActive: true,
      },
    });
  }

  // 12. Create Sample Real Invoices (Today) with realistic GST calculations
  // Invoice 1: Customer Vikram Joshi at Counter 1
  const inv1Items = [
    { prod: createdProducts[0], qty: 1, price: 265.0, disc: 0.0 }, // Atta 5kg (5% GST)
    { prod: createdProducts[1], qty: 2, price: 260.0, disc: 10.0 }, // Butter 500g (12% GST)
    { prod: createdProducts[4], qty: 3, price: 40.0, disc: 0.0 },   // Good Day (18% GST)
  ];

  let subtotal1 = 0;
  let tax1 = 0;
  let cgst1 = 0;
  let sgst1 = 0;

  for (const it of inv1Items) {
    const lineGross = (it.price * it.qty) - it.disc;
    subtotal1 += lineGross;
    // tax inclusive calculation
    const taxRate = it.prod.taxRate;
    const lineTax = (lineGross * taxRate) / (100 + taxRate);
    tax1 += lineTax;
    cgst1 += lineTax / 2;
    sgst1 += lineTax / 2;
  }

  const invoice1 = await prisma.salesInvoice.create({
    data: {
      storeId: mainStore.id,
      counterId: counters[0].id,
      cashierId: createdUsers['cashier1@zyden.com'].id,
      shiftId: shift1.id,
      customerId: createdCustomers[0].id,
      invoiceNumber: 'ZYD-1001',
      subtotal: subtotal1,
      discountAmount: 10.0,
      taxAmount: Math.round(tax1 * 100) / 100,
      cgstAmount: Math.round(cgst1 * 100) / 100,
      sgstAmount: Math.round(sgst1 * 100) / 100,
      totalAmount: subtotal1,
      paidAmount: subtotal1,
      changeAmount: 0.0,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      lines: {
        create: inv1Items.map((it) => {
          const lineGross = (it.price * it.qty) - it.disc;
          const taxAmt = (lineGross * it.prod.taxRate) / (100 + it.prod.taxRate);
          return {
            productId: it.prod.id,
            productName: it.prod.name,
            sku: it.prod.sku,
            hsnCode: it.prod.hsnCode,
            unit: it.prod.unit,
            quantity: it.qty,
            unitPrice: it.price,
            discountAmount: it.disc,
            taxRate: it.prod.taxRate,
            taxAmount: Math.round(taxAmt * 100) / 100,
            cgstAmount: Math.round((taxAmt / 2) * 100) / 100,
            sgstAmount: Math.round((taxAmt / 2) * 100) / 100,
            lineTotal: lineGross,
          };
        }),
      },
      payments: {
        create: {
          method: 'UPI',
          amount: subtotal1,
          referenceNumber: 'UPI/AXIS/20261015/998822',
          status: 'SUCCESS',
        },
      },
    },
  });

  // Update shift 1 totals
  await prisma.cashierShift.update({
    where: { id: shift1.id },
    data: {
      totalSales: subtotal1,
      upiSales: subtotal1,
    },
  });

  // 13. Create Sample Expenses
  await prisma.expense.create({
    data: {
      storeId: mainStore.id,
      userId: createdUsers['manager@zyden.com'].id,
      title: 'Store Cleaning & Sanitization Supplies',
      category: 'UTILITIES',
      amount: 450.0,
      paymentMode: 'CASH',
      payeeName: 'Safai Mart Lower Parel',
      notes: 'Monthly cleaning supplies voucher #88',
    },
  });

  await prisma.expense.create({
    data: {
      storeId: mainStore.id,
      userId: createdUsers['manager@zyden.com'].id,
      title: 'Packaging & Thermal Paper Rolls',
      category: 'PACKAGING',
      amount: 850.0,
      paymentMode: 'CASH',
      payeeName: 'Paper King Stationers',
      notes: '10 rolls 80mm thermal rolls',
    },
  });

  // 14. Create Sample Notifications
  await prisma.notification.create({
    data: {
      type: 'LOW_STOCK',
      title: 'Low Stock Alert: Tata Tea Gold 500g',
      message: 'Current stock is 60 units. Minimum threshold is 8 units. Consider restocking soon.',
      link: '/inventory',
    },
  });

  await prisma.notification.create({
    data: {
      type: 'SYSTEM',
      title: 'Four Billing Counters Active',
      message: 'All 4 billing terminals connected to live synchronized stock ledger.',
      link: '/pos',
    },
  });

  // 15. Create Audit Log entries
  await prisma.auditLog.create({
    data: {
      businessId: business.id,
      userId: createdUsers['owner@zyden.com'].id,
      userName: 'Aditya Sharma',
      action: 'SYSTEM_SETUP',
      entity: 'Business',
      entityId: business.id,
      details: 'Initialized Zyden ADG Retail ERP & POS with 4 billing terminals & GST tax profile.',
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('Business:', business.name);
  console.log('Stores:', mainStore.name, '&', puneStore.name);
  console.log('Counters:', counters.map(c => c.name).join(', '));
  console.log('Products seeded:', createdProducts.length);
  console.log('Credentials:');
  console.log('  Owner: owner@zyden.com / admin123');
  console.log('  Admin: admin@zyden.com / admin123');
  console.log('  Manager: manager@zyden.com / manager123');
  console.log('  Cashier 1: cashier1@zyden.com / cashier123');
  console.log('  Cashier 2: cashier2@zyden.com / cashier123');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
