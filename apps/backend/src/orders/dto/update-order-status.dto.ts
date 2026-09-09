import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['PENDING', 'DELIVERED', 'CANCELLED'])
  status: string;
}
