import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(businessId: string) {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [
      totalCustomers,
      totalProducts,
      totalOrders,
      pendingOrders,
      recentOrders,
      inventoryData,
      productionToday,
    ] = await Promise.all([
      this.prisma.customer.count({ where: { businessId, deletedAt: null } }),
      this.prisma.product.count({ where: { businessId, deletedAt: null } }),
      this.prisma.order.count({ where: { businessId } }),
      this.prisma.order.count({ where: { businessId, status: 'PENDING' } }),
      this.prisma.order.findMany({
        where: { businessId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true } } },
      }),
      this.prisma.product.findMany({
        where: { businessId, deletedAt: null },
        take: 5,
        include: {
          inventory: true,
          orderItems: {
            where: { order: { businessId, status: { notIn: ['DELIVERED', 'CANCELLED'] } } },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.productionEntry.aggregate({
        _sum: { quantity: true },
        where: {
          businessId,
          date: { gte: startOfToday, lt: endOfToday },
        },
      }),
    ]);

    const totalAvailableStock = await this.prisma.inventory.aggregate({
      _sum: { availableStock: true },
      where: { product: { businessId } },
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
      pendingOrders,
      ordersInProduction: pendingOrders,
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
