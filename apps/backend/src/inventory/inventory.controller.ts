import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UpdateStockDto } from './dto/update-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateProductionEntryDto } from './dto/create-production-entry.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  getOverview() {
    return this.inventoryService.getOverview();
  }

  @Patch(':productId/stock')
  updateStock(
    @Param('productId') productId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.inventoryService.updateStock(productId, dto);
  }

  @Post(':productId/adjust')
  adjustStock(
    @Param('productId') productId: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(productId, dto);
  }

  @Get(':productId/history')
  getStockHistory(@Param('productId') productId: string) {
    return this.inventoryService.getStockHistory(productId);
  }

  @Post('production')
  createProductionEntry(@Body() dto: CreateProductionEntryDto) {
    return this.inventoryService.createProductionEntry(dto);
  }

  @Get('production')
  getProductionHistory() {
    return this.inventoryService.getProductionHistory();
  }
}
