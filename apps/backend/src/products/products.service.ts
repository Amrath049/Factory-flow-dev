import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { UserPayload } from '../auth/decorators/user.decorator';
import { UpdateProductDto } from './dto/UpdateProductDto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private activityLogs: ActivityLogsService,
  ) {}

  private round(val: number | undefined | null): number | null {
    if (val === undefined || val === null) return null;
    return Math.round(val * 100) / 100;
  }

  findAll(
    businessId: string,
    opts?: { search?: string; page?: number; limit?: number },
  ) {
    const page = Math.max(1, Number(opts?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(opts?.limit) || 10));
    const skip = (page - 1) * limit;
    const search = opts?.search?.trim() || undefined;

    const where: any = {
      businessId,
      deletedAt: null,
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };

    return Promise.all([
      this.prisma.product.findMany({
        where,
        include: { inventory: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]).then(([products, total]) => ({
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }));
  }

  async create(dto: CreateProductDto, user: UserPayload) {
    const price = this.round(dto.price);
    const discountedPrice = this.round(dto.discountedPrice);
    const initialStock = dto.initialStock ?? 0;

    if (
      price !== undefined &&
      price !== null &&
      discountedPrice !== undefined &&
      discountedPrice !== null &&
      discountedPrice >= price
    ) {
      throw new BadRequestException('Discounted price must be less than price');
    }

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        price: price ?? null,
        discountedPrice: discountedPrice ?? null,
        businessId: user.businessId!,
        inventory: {
          create: {
            availableStock: initialStock,
          },
        },
      },
      include: { inventory: true },
    });

    await this.activityLogs.log({
      businessId: user.businessId!,
      userId: user.userId,
      userName: user.name || user.email,
      userEmail: user.email,
      action: 'PRODUCT_CREATE',
      entity: 'Product',
      entityId: product.id,
      description: `Created product "${product.name}" with stock ${initialStock}, price ₹${price ?? 'N/A'}, discount price ₹${discountedPrice ?? 'N/A'}`,
    });

    return product;
  }

  async update(id: string, dto: UpdateProductDto, user: UserPayload) {
    const product = await this.prisma.product.findFirst({
      where: { id, businessId: user.businessId!, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');

    const price =
      dto.price !== undefined ? this.round(dto.price) : product.price;
    const discountedPrice =
      dto.discountedPrice !== undefined
        ? this.round(dto.discountedPrice)
        : product.discountedPrice;

    if (
      price !== undefined &&
      price !== null &&
      discountedPrice !== undefined &&
      discountedPrice !== null &&
      discountedPrice >= price
    ) {
      throw new BadRequestException('Discounted price must be less than price');
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        price: price ?? null,
        discountedPrice: discountedPrice ?? null,
      },
      include: { inventory: true },
    });

    await this.activityLogs.log({
      businessId: user.businessId!,
      userId: user.userId,
      userName: user.name || user.email,
      userEmail: user.email,
      action: 'PRODUCT_UPDATE',
      entity: 'Product',
      entityId: updated.id,
      description: `Updated product "${updated.name}" details`,
    });

    return updated;
  }

  async delete(id: string, user: UserPayload) {
    const product = await this.prisma.product.findFirst({
      where: { id, businessId: user.businessId!, deletedAt: null },
    });
    if (!product) throw new NotFoundException('Product not found');

    const deleted = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.activityLogs.log({
      businessId: user.businessId!,
      userId: user.userId,
      userName: user.name || user.email,
      userEmail: user.email,
      action: 'PRODUCT_DELETE',
      entity: 'Product',
      entityId: id,
      description: `Deleted product "${product.name}"`,
    });

    return deleted;
  }
}
