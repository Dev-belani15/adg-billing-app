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
    const query = searchParams.get('q')?.trim() || '';
    const categoryId = searchParams.get('categoryId');
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 50)));
    const skip = (page - 1) * limit;

    const whereClause: any = {
      businessId: session.businessId,
    };

    if (query) {
      whereClause.OR = [
        { name: { contains: query } },
        { barcode: { contains: query } },
        { sku: { contains: query } },
      ];
    }

    if (categoryId && categoryId !== 'ALL') {
      whereClause.categoryId = categoryId;
    }

    const [total, products, categories, brands] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        include: {
          category: true,
          brand: true,
          stockBalances: {
            where: { storeId: session.storeId },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.category.findMany({ where: { businessId: session.businessId } }),
      prisma.brand.findMany({ where: { businessId: session.businessId } }),
    ]);

    const formatted = products.map((p) => ({
      ...p,
      stockQuantity: p.stockBalances[0]?.quantity || 0,
    }));

    return NextResponse.json({
      products: formatted,
      categories,
      brands,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Products error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      sku,
      barcode,
      categoryId,
      brandId,
      hsnCode = '1905',
      unit = 'PCS',
      costPrice = 0,
      sellingPrice = 0,
      mrp = 0,
      taxRate = 5.0,
      isTaxInclusive = true,
      minStockLevel = 5,
      openingStock = 0,
    } = body;

    if (!name || !barcode || !sku) {
      return NextResponse.json({ error: 'Product name, SKU, and barcode are required' }, { status: 400 });
    }

    // Check duplicate barcode
    const duplicate = await prisma.product.findFirst({
      where: {
        businessId: session.businessId,
        OR: [{ barcode: barcode.trim() }, { sku: sku.trim() }],
      },
    });

    if (duplicate) {
      return NextResponse.json({
        error: `A product with barcode "${barcode}" or SKU "${sku}" already exists (${duplicate.name})`,
      }, { status: 409 });
    }

    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          businessId: session.businessId,
          categoryId: categoryId || null,
          brandId: brandId || null,
          name: name.trim(),
          description: description || null,
          sku: sku.trim(),
          barcode: barcode.trim(),
          hsnCode: hsnCode.trim(),
          unit,
          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
          mrp: Number(mrp) || Number(sellingPrice),
          taxRate: Number(taxRate),
          isTaxInclusive: Boolean(isTaxInclusive),
          minStockLevel: Number(minStockLevel),
          isActive: true,
        },
      });

      // Initialize stock balance
      const stock = Number(openingStock) || 0;
      await tx.stockBalance.create({
        data: {
          storeId: session.storeId,
          productId: product.id,
          quantity: stock,
        },
      });

      if (stock > 0) {
        await tx.stockMovement.create({
          data: {
            storeId: session.storeId,
            productId: product.id,
            type: 'OPENING',
            quantity: stock,
            balanceAfter: stock,
            unitCost: Number(costPrice),
            reason: 'Opening stock on product creation',
            performedBy: session.userName,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          businessId: session.businessId,
          userId: session.userId,
          userName: session.userName,
          action: 'PRODUCT_CREATE',
          entity: 'Product',
          entityId: product.id,
          details: `Created product "${product.name}" (SKU: ${product.sku}, Barcode: ${product.barcode}) with opening stock ${stock}`,
        },
      });

      return product;
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
