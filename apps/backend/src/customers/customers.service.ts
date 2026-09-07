import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AddressDto } from './dto/address.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const customers = await this.prisma.customer.findMany({
      include: {
        addresses: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      city: c.addresses[0]?.city ?? '',
      totalOrders: c._count.orders,
      addresses: c.addresses,
      createdAt: c.createdAt,
    }));
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: {
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
        orderDate: o.createdAt,
        deliveryDate: o.deliveryDate,
        productsCount: o.items.length,
        items: o.items.map((i) => ({
          productId: i.productId,
          productName: i.product.name,
          quantity: i.quantity,
        })),
      })),
    };
  }

  async create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        addresses: dto.addresses?.length
          ? { create: dto.addresses }
          : undefined,
      },
      include: { addresses: true },
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    return this.prisma.customer.update({
      where: { id },
      data: dto,
      include: { addresses: true },
    });
  }

  async addAddress(customerId: string, dto: AddressDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
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

  async updateAddress(addressId: string, dto: AddressDto) {
    const address = await this.prisma.address.findUnique({ where: { id: addressId } });
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
