import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantStatusDto } from './dto/create-tenant.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * Provisions a new Business Tenant + Default Invoice Settings + Initial Business Admin User.
   * Can be triggered via Postman or Super Admin interface.
   */
  async createTenant(dto: CreateTenantDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new BadRequestException('User email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Business
      const business = await tx.business.create({
        data: {
          name: dto.businessName,
          email: dto.businessEmail,
          phone: dto.phone,
          address: dto.address,
          plan: dto.plan || 'BASIC',
          status: 'ACTIVE',
        },
      });

      // 2. Create Initial Invoice Settings with business defaults
      await tx.invoiceSettings.create({
        data: {
          businessId: business.id,
          companyName: dto.businessName,
          email: dto.businessEmail || '',
          phone: dto.phone || '',
          addressLine1: dto.address || '',
          tagline: 'Quality Products Manufacturer',
          termsAndConditions: '1. Goods once sold will not be taken back.\n2. Subject to local jurisdiction.',
          declaration: 'We declare that this invoice shows the actual price of the goods described.',
          signatureTitle: 'Authorized Signatory',
        },
      });

      // 3. Create Admin User
      const user = await tx.user.create({
        data: {
          name: dto.adminName,
          email: dto.adminEmail.toLowerCase().trim(),
          password: hashedPassword,
          role: 'BUSINESS_ADMIN',
          businessId: business.id,
        },
      });

      return {
        message: 'Tenant provisioned successfully',
        business: {
          id: business.id,
          name: business.name,
          plan: business.plan,
          status: business.status,
        },
        adminUser: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    });
  }

  /**
   * List all tenants (Super Admin view).
   */
  async findAllTenants() {
    const businesses = await this.prisma.business.findMany({
      include: {
        _count: {
          select: {
            users: true,
            customers: true,
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return businesses.map((b) => ({
      id: b.id,
      name: b.name,
      email: b.email,
      phone: b.phone,
      address: b.address,
      status: b.status,
      plan: b.plan,
      usersCount: b._count.users,
      customersCount: b._count.customers,
      productsCount: b._count.products,
      ordersCount: b._count.orders,
      createdAt: b.createdAt,
    }));
  }

  /**
   * Update tenant status (ACTIVE / SUSPENDED).
   */
  async updateTenantStatus(businessId: string, dto: UpdateTenantStatusDto) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business tenant not found');

    return this.prisma.business.update({
      where: { id: businessId },
      data: { status: dto.status as any },
    });
  }
}
