import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStockDto } from './dto/update-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateProductionEntryDto } from './dto/create-production-entry.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const products = await this.prisma.product.findMany({
      include: {
        inventory: true,
        orderItems: {
          where: {
            order: {
              status: { not: OrderStatus.DELIVERED },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((p) => {
      const availableStock = p.inventory?.availableStock ?? 0;
      const dailyProductionRate = p.inventory?.dailyProductionRate ?? 0;
      const bookedStock = p.orderItems.reduce((sum, i) => sum + i.quantity, 0);
      const freeStock = Math.max(0, availableStock - bookedStock);

      return {
        productId: p.id,
        productName: p.name,
        availableStock,
        bookedStock,
        freeStock,
        dailyProductionRate,
      };
    });
  }

  async updateStock(productId: string, dto: UpdateStockDto) {
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

  async adjustStock(productId: string, dto: AdjustStockDto) {
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

  async getStockHistory(productId: string) {
    const entries = await this.prisma.stockHistory.findMany({
      where: { productId },
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

  async createProductionEntry(dto: CreateProductionEntryDto) {
    const entry = await this.prisma.productionEntry.create({
      data: {
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

  async getProductionHistory() {
    const entries = await this.prisma.productionEntry.findMany({
      include: { product: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    return entries.map((e) => ({
      id: e.id,
      productId: e.productId,
      productName: e.product.name,
      quantity: e.quantity,
      date: e.date,
      createdAt: e.createdAt,
    }));
  }

  async deductStockForOrder(order: any, formattedOrderId: string) {
    
    if(!order || order.items.length === 0){
      return { message: "Order is empty" }
    }

    for(const item of order.items){
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId: item.productId },
      });

      if (!inventory) throw new NotFoundException('Inventory not found');

      if (inventory.availableStock < item.quantity) {
        throw new Error('Insufficient stock');
      }

      const previousStock = inventory.availableStock;
      const newStock = previousStock - item.quantity;

      await this.prisma.inventory.update({
        where: { productId: item.productId },
        data: { availableStock: newStock },
      });

      await this.prisma.stockHistory.create({
        data: {
          productId: item.productId,
          previousStock,
          change: -item.quantity,
          newStock,
          reason: `Deducted for Order ${formattedOrderId}`,
          date: new Date(),
        },
      });
    }

    return { message: "Stock deducted successfully" }
  }

  async stockCheck(items: any[]) {
    if(!items || items.length === 0){
      return { message: "Order is empty" }
    }

    for(const item of items){
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId: item.productId },
      });

      if (!inventory) throw new NotFoundException('Inventory not found');

      if (inventory.availableStock < item.quantity) {
        throw new BadRequestException('Insufficient stock');
      }
    }

    return { message: "Stock is sufficient" }
  }
}
