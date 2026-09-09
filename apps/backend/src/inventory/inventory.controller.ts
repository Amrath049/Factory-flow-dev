import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UpdateStockDto } from './dto/update-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateProductionEntryDto } from './dto/create-production-entry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/decorators/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  getOverview(
    @CurrentUser() user: UserPayload,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getOverview(user.businessId!, {
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Patch(':productId/stock')
  updateStock(
    @CurrentUser() user: UserPayload,
    @Param('productId') productId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.inventoryService.updateStock(productId, dto, user.businessId!);
  }

  @Post(':productId/adjust')
  adjustStock(
    @CurrentUser() user: UserPayload,
    @Param('productId') productId: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(productId, dto, user.businessId!);
  }

  @Get(':productId/history')
  getStockHistory(
    @CurrentUser() user: UserPayload,
    @Param('productId') productId: string,
  ) {
    return this.inventoryService.getStockHistory(productId, user.businessId!);
  }

  @Post('production')
  createProductionEntry(
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateProductionEntryDto,
  ) {
    return this.inventoryService.createProductionEntry(dto, user.businessId!);
  }

  @Get('production')
  getProductionHistory(
    @CurrentUser() user: UserPayload,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getProductionHistory(user.businessId!, {
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }
}
