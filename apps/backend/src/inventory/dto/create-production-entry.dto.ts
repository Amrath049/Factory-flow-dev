import { IsDateString, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateProductionEntryDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsDateString()
  date: string;
}
