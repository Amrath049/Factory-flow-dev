import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getStatus() {
    let dbStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      db: dbStatus,
      message: 'FactoryFlow API is running',
      timestamp: new Date().toISOString(),
    };
  }
}
