import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class UpdateStockDto {
  @IsInt()
  @Min(0)
  availableStock: number;

  @IsInt()
  @Min(0)
  dailyProductionRate: number;
}
