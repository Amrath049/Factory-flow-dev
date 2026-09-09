import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';

export class UpdatePaymentStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['PENDING', 'COMPLETED'])
  paymentStatus: string;

  @IsString()
  @IsOptional()
  paymentMethod?: string;
}
