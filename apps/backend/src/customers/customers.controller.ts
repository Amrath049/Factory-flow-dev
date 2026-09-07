import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AddressDto } from './dto/address.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  findAll() {
    return this.customersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const customer = await this.customersService.findOne(id);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Post(':id/addresses')
  addAddress(@Param('id') customerId: string, @Body() dto: AddressDto) {
    return this.customersService.addAddress(customerId, dto);
  }

  @Patch('addresses/:addressId')
  updateAddress(@Param('addressId') addressId: string, @Body() dto: AddressDto) {
    return this.customersService.updateAddress(addressId, dto);
  }
}
