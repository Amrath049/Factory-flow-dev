import { IsInt, IsNotEmpty, IsOptional, IsString, NotEquals } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  @IsNotEmpty()
  @NotEquals(0)
  change: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsString()
  @IsNotEmpty()
  date: string;
}
