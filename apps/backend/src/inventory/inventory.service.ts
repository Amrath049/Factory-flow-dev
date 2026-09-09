import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStockDto } from './dto/update-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateProductionEntryDto } from './dto/create-production-entry.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getOverview(businessId: string, opts?: { search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(opts?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(opts?.limit) || 10));
    const skip = (page - 1) * limit;
    const trimmed = opts?.search?.trim() || undefined;

    const where: any = {
      businessId,
      ...(trimmed ? { name: { contains: trimmed, mode: 'insensitive' } } : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          inventory: true,
          orderItems: {
            where: {
              order: {
                businessId,
                status: { notIn: ['DELIVERED', 'CANCELLED'] },
              },
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map((p) => {
        const availableStock = p.inventory?.availableStock ?? 0;
        const dailyProductionRate = p.inventory?.dailyProductionRate ?? 0;
        const bookedStock = p.orderItems.reduce((sum, i) => sum + i.quantity, 0);
        const freeStock = Math.max(0, availableStock - bookedStock);
        return { productId: p.id, productName: p.name, availableStock, bookedStock, freeStock, dailyProductionRate };
      }),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateStock(productId: string, dto: UpdateStockDto, businessId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, businessId } });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.inventory.upsert({
      where: { productId },
      update: {
        availableStock: dto.availableStock,
        dailyProductionRate: dto.dailyProductionRate,
      },
      create: {
        productId,
        availableStock: dto.availableStock,
        dailyProductionRate: dto.dailyProductionRate,
      },
    });
  }

  async adjustStock(productId: string, dto: AdjustStockDto, businessId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, businessId } });
    if (!product) throw new NotFoundException('Product not found');

    const inventory = await this.prisma.inventory.findUnique({ where: { productId } });
    const previousStock = inventory?.availableStock ?? 0;
    const newStock = previousStock + dto.change;

    if (newStock < 0) {
      throw new BadRequestException(`Cannot reduce stock below 0. Current stock: ${previousStock}.`);
    }

    await this.prisma.inventory.upsert({
      where: { productId },
      update: { availableStock: newStock },
      create: { productId, availableStock: newStock, dailyProductionRate: 0 },
    });

    const entry = await this.prisma.stockHistory.create({
      data: {
        businessId,
        productId,
        previousStock,
        change: dto.change,
        newStock,
        reason: dto.reason ?? null,
        date: new Date(dto.date),
      },
      include: { product: true },
    });

    return {
      id: entry.id,
      productId: entry.productId,
      productName: entry.product.name,
      previousStock: entry.previousStock,
      change: entry.change,
      newStock: entry.newStock,
      reason: entry.reason,
      date: entry.date,
      createdAt: entry.createdAt,
    };
  }

  async getStockHistory(productId: string, businessId: string) {
    const entries = await this.prisma.stockHistory.findMany({
      where: { productId, businessId },
      include: { product: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return entries.map((e) => ({
      id: e.id,
      productId: e.productId,
      productName: e.product.name,
      previousStock: e.previousStock,
      change: e.change,
      newStock: e.newStock,
      reason: e.reason,
      date: e.date,
      createdAt: e.createdAt,
    }));
  }

  async createProductionEntry(dto: CreateProductionEntryDto, businessId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: dto.productId, businessId } });
    if (!product) throw new NotFoundException('Product not found');

    const entry = await this.prisma.productionEntry.create({
      data: {
        businessId,
        productId: dto.productId,
        quantity: dto.quantity,
        date: new Date(dto.date),
      },
      include: { product: true },
    });

    return {
      id: entry.id,
      productId: entry.productId,
      productName: entry.product.name,
      quantity: entry.quantity,
      date: entry.date,
      createdAt: entry.createdAt,
    };
  }

  async getProductionHistory(businessId: string, opts?: { search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(opts?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(opts?.limit) || 10));
    const skip = (page - 1) * limit;
    const trimmed = opts?.search?.trim() || undefined;

    const where: any = {
      businessId,
      ...(trimmed ? { product: { name: { contains: trimmed, mode: 'insensitive' } } } : {}),
    };

    const [entries, total] = await Promise.all([
      this.prisma.productionEntry.findMany({
        where,
        include: { product: true },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.productionEntry.count({ where }),
    ]);

    return {
      data: entries.map((e) => ({
        id: e.id,
        productId: e.productId,
        productName: e.product.name,
        quantity: e.quantity,
        date: e.date,
        createdAt: e.createdAt,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async deductStockForOrder(order: any, formattedOrderId: string, businessId: string) {
    if (!order || order.items.length === 0) {
      return { message: 'Order is empty' };
    }

    for (const item of order.items) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId: item.productId },
      });

      if (!inventory) throw new NotFoundException('Inventory not found');

      if (inventory.availableStock < item.quantity) {
        throw new BadRequestException('Insufficient stock');
      }

      const previousStock = inventory.availableStock;
      const newStock = previousStock - item.quantity;

      await this.prisma.inventory.update({
        where: { productId: item.productId },
        data: { availableStock: newStock },
      });

      await this.prisma.stockHistory.create({
        data: {
          businessId,
          productId: item.productId,
          previousStock,
          change: -item.quantity,
          newStock,
          reason: `Deducted for Order ${formattedOrderId}`,
          date: new Date(),
        },
      });
    }

    return { message: 'Stock deducted successfully' };
  }

  async restoreStockForOrder(order: any, formattedOrderId: string, businessId: string) {
    if (!order || !order.items || order.items.length === 0) {
      return { message: 'Order is empty' };
    }

    for (const item of order.items) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId: item.productId },
      });

      const previousStock = inventory?.availableStock ?? 0;
      const newStock = previousStock + item.quantity;

      await this.prisma.inventory.upsert({
        where: { productId: item.productId },
        update: { availableStock: newStock },
        create: { productId: item.productId, availableStock: newStock },
      });

      await this.prisma.stockHistory.create({
        data: {
          businessId,
          productId: item.productId,
          previousStock,
          change: item.quantity,
          newStock,
          reason: `Restored due to Order Cancellation (${formattedOrderId})`,
          date: new Date(),
        },
      });
    }

    return { message: 'Stock restored successfully' };
  }

  async stockCheck(items: any[]) {
    if (!items || items.length === 0) {
      return { message: 'Order is empty' };
    }

    for (const item of items) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId: item.productId },
      });

      if (!inventory) throw new NotFoundException('Inventory not found');

      if (inventory.availableStock < item.quantity) {
        throw new BadRequestException('Insufficient stock');
      }
    }

    return { message: 'Stock is sufficient' };
  }
}
