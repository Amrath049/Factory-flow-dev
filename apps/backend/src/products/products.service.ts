import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: { name: dto.name },
    });
  }

  update(id: string, dto: Partial<CreateProductDto>) {
    return this.prisma.product.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  delete(id: string) {  
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
