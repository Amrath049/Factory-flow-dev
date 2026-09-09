import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { InventoryService } from '../inventory/inventory.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { UserPayload } from '../auth/decorators/user.decorator';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private readonly inventoryService: InventoryService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  private formatOrderId(num: number): string {
    return `ORD-${num.toString().padStart(3, '0')}`;
  }

  private round(val: number | undefined | null): number {
    if (val === undefined || val === null || isNaN(val)) return 0;
    return Math.round(val * 100) / 100;
  }

  async findAll(
    businessId: string,
    opts?: { search?: string; status?: string; page?: number; limit?: number },
  ) {
    const page = Math.max(1, Number(opts?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(opts?.limit) || 10));
    const skip = (page - 1) * limit;
    const trimmed = opts?.search?.trim() || undefined;
    const cleanNumStr = trimmed ? trimmed.replace(/^ord-?/i, '') : '';
    const isNum = cleanNumStr !== '' && !isNaN(Number(cleanNumStr));
    const orderNum = isNum ? parseInt(cleanNumStr, 10) : undefined;
    const rawStatus = opts?.status?.trim() && opts.status.trim().toUpperCase() !== 'ALL'
      ? opts.status.trim().toUpperCase()
      : undefined;
    const status = rawStatus === 'COMPLETED' ? 'DELIVERED' : rawStatus;

    const where: any = {
      businessId,
      ...(status ? { status } : {}),
      ...(trimmed
        ? {
            OR: [
              {
                customer: { name: { contains: trimmed, mode: 'insensitive' } },
              },
              ...(orderNum !== undefined ? [{ orderNumber: orderNum }] : []),
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders.map((o) => ({
        id: o.id,
        orderId: this.formatOrderId(o.orderNumber),
        orderNumber: o.orderNumber,
        customerName: o.customer.name,
        customerId: o.customerId,
        orderDate: o.createdAt,
        deliveryDate: o.deliveryDate,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        grandTotal: this.round(o.grandTotal),
        productsCount: o._count.items,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, businessId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, businessId },
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
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      subtotal: this.round(order.subtotal),
      discountType: order.discountType,
      discountValue: this.round(order.discountValue),
      discountAmount: this.round(order.discountAmount),
      discountReason: order.discountReason,
      additionalCharges: order.additionalCharges,
      grandTotal: this.round(order.grandTotal),
      orderDate: order.createdAt,
      deliveryDate: order.deliveryDate,
      notes: order.notes,
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
      },
      address: order.address,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: this.round(i.unitPrice),
        priceType: i.priceType,
        totalPrice: this.round(i.totalPrice),
      })),
    };
  }

  async create(dto: CreateOrderDto, user: UserPayload) {
    const businessId = user.businessId!;
    await this.inventoryService.stockCheck(dto.items);

    // Calculate item pricing & total
    let calculatedSubtotal = 0;
    const processedItems = dto.items.map((item) => {
      const unitPrice = this.round(item.unitPrice ?? 0);
      const qty = item.quantity;
      const itemTotal = this.round(unitPrice * qty);
      calculatedSubtotal += itemTotal;

      return {
        productId: item.productId,
        quantity: qty,
        unitPrice,
        priceType: item.priceType || 'STANDARD',
        totalPrice: itemTotal,
      };
    });

    calculatedSubtotal = this.round(calculatedSubtotal);
    const subtotal =
      dto.subtotal !== undefined
        ? this.round(dto.subtotal)
        : calculatedSubtotal;
    const discountAmount = this.round(dto.discountAmount ?? 0);

    // Calculate additional charges sum
    let chargesSum = 0;
    if (dto.additionalCharges) {
      try {
        const parsed = JSON.parse(dto.additionalCharges);
        if (Array.isArray(parsed)) {
          chargesSum = parsed.reduce(
            (sum: number, c: any) => sum + (Number(c.amount) || 0),
            0,
          );
        }
      } catch (e) {
        // ignore parse error
      }
    }
    chargesSum = this.round(chargesSum);

    const calculatedGrandTotal = this.round(
      subtotal - discountAmount + chargesSum,
    );
    const grandTotal =
      dto.grandTotal !== undefined
        ? this.round(dto.grandTotal)
        : calculatedGrandTotal;

    const order = await this.prisma.order.create({
      data: {
        businessId,
        customerId: dto.customerId,
        addressId: dto.addressId,
        deliveryDate: new Date(dto.deliveryDate),
        notes: dto.notes,
        status: 'PENDING',
        paymentStatus: dto.paymentStatus || 'PENDING',
        paymentMethod: dto.paymentMethod || null,
        subtotal,
        discountType: dto.discountType || null,
        discountValue: dto.discountValue ? this.round(dto.discountValue) : null,
        discountAmount,
        discountReason: dto.discountReason || null,
        additionalCharges: dto.additionalCharges || null,
        grandTotal,
        items: {
          create: processedItems,
        },
      },
      include: {
        customer: true,
        address: true,
        items: { include: { product: true } },
      },
    });

    const formattedId = this.formatOrderId(order.orderNumber);

    // Deduct inventory stock and record stock history for newly placed order
    await this.inventoryService.deductStockForOrder(
      order,
      formattedId,
      businessId,
    );

    await this.activityLogs.log({
      businessId,
      userId: user.userId,
      userName: user.name || user.email,
      userEmail: user.email,
      action: 'ORDER_CREATE',
      entity: 'Order',
      entityId: order.id,
      description: `Created order ${formattedId} for customer "${order.customer.name}" with total ₹${grandTotal.toFixed(2)}`,
    });

    return this.findOne(order.id, businessId);
  }

  async updateStatus(id: string, status: string, user: UserPayload) {
    const businessId = user.businessId!;
    const existing = await this.prisma.order.findFirst({
      where: { id, businessId },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Order not found');

    if (existing.status === status) {
      return this.findOne(id, businessId);
    }

    const previousStatus = existing.status;

    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });

    const formattedId = this.formatOrderId(order.orderNumber);

    // Handle stock changes:
    // When cancelled from an active status (PENDING / DELIVERED), restore stock
    if (status === 'CANCELLED' && previousStatus !== 'CANCELLED') {
      await this.inventoryService.restoreStockForOrder(
        order,
        formattedId,
        businessId,
      );
    } else if (previousStatus === 'CANCELLED' && status !== 'CANCELLED') {
      // Re-activating a previously cancelled order: deduct stock again
      await this.inventoryService.deductStockForOrder(
        order,
        formattedId,
        businessId,
      );
    }

    await this.activityLogs.log({
      businessId,
      userId: user.userId,
      userName: user.name || user.email,
      userEmail: user.email,
      action: 'ORDER_STATUS_UPDATE',
      entity: 'Order',
      entityId: order.id,
      description: `Updated status of order ${formattedId} from ${previousStatus} to ${status}`,
    });

    return this.findOne(id, businessId);
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: string,
    paymentMethod: string | undefined,
    user: UserPayload,
  ) {
    const businessId = user.businessId!;
    const existing = await this.prisma.order.findFirst({
      where: { id, businessId },
    });
    if (!existing) throw new NotFoundException('Order not found');

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus,
        ...(paymentMethod && { paymentMethod }),
      },
    });

    const formattedId = this.formatOrderId(updated.orderNumber);

    await this.activityLogs.log({
      businessId,
      userId: user.userId,
      userName: user.name || user.email,
      userEmail: user.email,
      action: 'ORDER_PAYMENT_UPDATE',
      entity: 'Order',
      entityId: updated.id,
      description: `Updated payment status of order ${formattedId} to ${paymentStatus}`,
    });

    return this.findOne(id, businessId);
  }
}
