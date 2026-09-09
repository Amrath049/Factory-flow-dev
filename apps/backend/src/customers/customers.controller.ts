import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AddressDto } from './dto/address.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/decorators/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get()
  findAll(
    @CurrentUser() user: UserPayload,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customersService.findAll(user.businessId!, {
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get(':id')
  async findOne(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    const customer = await this.customersService.findOne(id, user.businessId!);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  @Post()
  create(@CurrentUser() user: UserPayload, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto, user);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, dto, user);
  }

  @Delete(':id')
  remove(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.customersService.remove(id, user);
  }

  @Post(':id/addresses')
  addAddress(
    @CurrentUser() user: UserPayload,
    @Param('id') customerId: string,
    @Body() dto: AddressDto,
  ) {
    return this.customersService.addAddress(customerId, dto, user.businessId!);
  }

  @Patch('addresses/:addressId')
  updateAddress(
    @CurrentUser() user: UserPayload,
    @Param('addressId') addressId: string,
    @Body() dto: AddressDto,
  ) {
    return this.customersService.updateAddress(addressId, dto, user.businessId!);
  }
}
