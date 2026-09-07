import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [PrismaModule, AuthModule, InventoryModule],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
