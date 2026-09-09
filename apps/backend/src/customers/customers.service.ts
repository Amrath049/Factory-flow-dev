import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AddressDto } from './dto/address.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { UserPayload } from '../auth/decorators/user.decorator';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  async findAll(businessId: string, opts?: { search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number(opts?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(opts?.limit) || 10));
    const skip = (page - 1) * limit;
    const search = opts?.search?.trim() || undefined;

    const where: any = {
      businessId,
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { addresses: { some: { city: { contains: search, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          addresses: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        city: c.addresses[0]?.city ?? '',
        totalOrders: c._count.orders,
        addresses: c.addresses,
        createdAt: c.createdAt,
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
    const customer = await this.prisma.customer.findFirst({
      where: { id, businessId, deletedAt: null },
      include: {
        addresses: true,
        orders: {
          where: { businessId },
          orderBy: { createdAt: 'desc' },
          include: {
            items: { include: { product: true } },
            address: true,
          },
        },
      },
    });

    if (!customer) return null;

    return {
      ...customer,
      orders: customer.orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        orderId: `ORD-${o.orderNumber.toString().padStart(3, '0')}`,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        grandTotal: o.grandTotal,
        orderDate: o.createdAt,
        deliveryDate: o.deliveryDate,
        productsCount: o.items.length,
        items: o.items.map((i) => ({
          productId: i.productId,
          productName: i.product.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          priceType: i.priceType,
          totalPrice: i.totalPrice,
        })),
      })),
    };
  }

  async create(dto: CreateCustomerDto, user: UserPayload) {
    const customer = await this.prisma.customer.create({
      data: {
        businessId: user.businessId!,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        addresses: dto.addresses?.length
          ? { create: dto.addresses }
          : undefined,
      },
      include: { addresses: true },
    });

    await this.activityLogs.log({
      businessId: user.businessId!,
      userId: user.userId,
      userName: user.name || user.email,
      userEmail: user.email,
      action: 'CUSTOMER_CREATE',
      entity: 'Customer',
      entityId: customer.id,
      description: `Created customer "${customer.name}" (${customer.phone})`,
    });

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, user: UserPayload) {
    const existing = await this.prisma.customer.findFirst({ where: { id, businessId: user.businessId!, deletedAt: null } });
    if (!existing) throw new NotFoundException('Customer not found');

    const updated = await this.prisma.customer.update({
      where: { id },
      data: dto,
      include: { addresses: true },
    });

    await this.activityLogs.log({
      businessId: user.businessId!,
      userId: user.userId,
      userName: user.name || user.email,
      userEmail: user.email,
      action: 'CUSTOMER_UPDATE',
      entity: 'Customer',
      entityId: updated.id,
      description: `Updated customer "${updated.name}" details`,
    });

    return updated;
  }

  async remove(id: string, user: UserPayload) {
    const existing = await this.prisma.customer.findFirst({ where: { id, businessId: user.businessId!, deletedAt: null } });
    if (!existing) throw new NotFoundException('Customer not found');

    const softDeleted = await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.activityLogs.log({
      businessId: user.businessId!,
      userId: user.userId,
      userName: user.name || user.email,
      userEmail: user.email,
      action: 'CUSTOMER_DELETE',
      entity: 'Customer',
      entityId: id,
      description: `Deleted customer "${existing.name}"`,
    });

    return softDeleted;
  }

  async addAddress(customerId: string, dto: AddressDto, businessId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, businessId, deletedAt: null } });
    if (!customer) throw new NotFoundException('Customer not found');

    return this.prisma.address.create({
      data: {
        customerId,
        addressLine: dto.addressLine ?? '',
        city: dto.city ?? '',
        state: dto.state ?? '',
        pincode: dto.pincode ?? '',
      },
    });
  }

  async updateAddress(addressId: string, dto: AddressDto, businessId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, customer: { businessId, deletedAt: null } },
    });
    if (!address) throw new NotFoundException('Address not found');

    return this.prisma.address.update({
      where: { id: addressId },
      data: {
        ...(dto.addressLine !== undefined && { addressLine: dto.addressLine }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode }),
      },
    });
  }
}

