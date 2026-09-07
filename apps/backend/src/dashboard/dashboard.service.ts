import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [
      totalCustomers,
      totalProducts,
      totalOrders,
      ordersInProduction,
      recentOrders,
      inventoryData,
      productionToday,
    ] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.IN_PRODUCTION } }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } } },
      }),
      this.prisma.product.findMany({
        take: 5,
        include: {
          inventory: true,
          orderItems: {
            where: { order: { status: { not: OrderStatus.DELIVERED } } },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.productionEntry.aggregate({
        _sum: { quantity: true },
        where: {
          date: { gte: startOfToday, lt: endOfToday },
        },
      }),
    ]);

    const totalAvailableStock = await this.prisma.inventory.aggregate({
      _sum: { availableStock: true },
    });

    const stockOverview = inventoryData.map((p) => {
      const availableStock = p.inventory?.availableStock ?? 0;
      const bookedStock = p.orderItems.reduce((sum, i) => sum + i.quantity, 0);
      return {
        productId: p.id,
        productName: p.name,
        availableStock,
        bookedStock,
        freeStock: Math.max(0, availableStock - bookedStock),
        dailyProductionRate: p.inventory?.dailyProductionRate ?? 0,
      };
    });

    return {
      totalCustomers,
      totalProducts,
      totalOrders,
      ordersInProduction,
      totalAvailableStock: totalAvailableStock._sum.availableStock ?? 0,
      productionToday: productionToday._sum.quantity ?? 0,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderId: `ORD-${o.orderNumber.toString().padStart(3, '0')}`,
        customerName: o.customer.name,
        deliveryDate: o.deliveryDate,
        status: o.status,
      })),
      stockOverview,
    };
  }
}
