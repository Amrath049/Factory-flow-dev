import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService,
    private readonly inventoryService: InventoryService
  ) {}

  /** Format orderNumber as ORD-001 */
  private formatOrderId(num: number): string {
    return `ORD-${num.toString().padStart(3, '0')}`;
  }

  async findAll() {
    const orders = await this.prisma.order.findMany({
      include: {
        customer: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => ({
      id: o.id,
      orderId: this.formatOrderId(o.orderNumber),
      orderNumber: o.orderNumber,
      customerName: o.customer.name,
      customerId: o.customerId,
      orderDate: o.createdAt,
      deliveryDate: o.deliveryDate,
      status: o.status,
      productsCount: o._count.items,
    }));
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        address: true,
        items: { include: { product: true } },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    return {
      id: order.id,
      orderId: this.formatOrderId(order.orderNumber),
      orderNumber: order.orderNumber,
      status: order.status,
      orderDate: order.createdAt,
      deliveryDate: order.deliveryDate,
      notes: order.notes,
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone,
      },
      address: order.address,
      items: order.items.map((i) => ({
        productId: i.productId,
        productName: i.product.name,
        quantity: i.quantity,
      })),
    };
  }

  async create(dto: CreateOrderDto) {
    console.log("dto", dto.items);
    await this.inventoryService.stockCheck(dto.items)

    const order = await this.prisma.order.create({
      data: {
        customerId: dto.customerId,
        addressId: dto.addressId,
        deliveryDate: new Date(dto.deliveryDate),
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        customer: true,
        address: true,
        items: { include: { product: true } },
      },
    });

    return {
      id: order.id,
      orderId: this.formatOrderId(order.orderNumber),
      orderNumber: order.orderNumber,
      status: order.status,
      customer: { id: order.customer.id, name: order.customer.name },
      address: order.address,
      deliveryDate: order.deliveryDate,
      items: order.items.map((i) => ({
        productId: i.productId,
        productName: i.product.name,
        quantity: i.quantity,
      })),
    };
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: true,
      },
    });

    if(status === OrderStatus.DELIVERED){
        await this.inventoryService.deductStockForOrder(order, this.formatOrderId(order.orderNumber));
    }

    return {
      id: order.id,
      orderId: this.formatOrderId(order.orderNumber),
      status: order.status,
    };
  }
}
