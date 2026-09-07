import { IsOptional, IsString } from 'class-validator';

export class AddressDto {
  @IsString()
  @IsOptional()
  addressLine?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  pincode?: string;
}
