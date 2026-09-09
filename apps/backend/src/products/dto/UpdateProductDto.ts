import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  discountedPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  initialStock?: number;
}
