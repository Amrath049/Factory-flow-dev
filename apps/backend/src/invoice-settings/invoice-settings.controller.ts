import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InvoiceSettingsService } from './invoice-settings.service';
import { UpdateInvoiceSettingsDto } from './dto/update-invoice-settings.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, UserPayload } from '../auth/decorators/user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('invoice-settings')
export class InvoiceSettingsController {
  constructor(private readonly invoiceSettingsService: InvoiceSettingsService) {}

  @Get()
  getSettings(@CurrentUser() user: UserPayload) {
    return this.invoiceSettingsService.getSettings(user.businessId!);
  }

  @Patch()
  updateSettings(
    @CurrentUser() user: UserPayload,
    @Body() dto: UpdateInvoiceSettingsDto,
  ) {
    return this.invoiceSettingsService.updateSettings(user, dto);
  }

  @Post('logo')
  @UseInterceptors(FileInterceptor('file'))
  uploadLogo(
    @CurrentUser() user: UserPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.invoiceSettingsService.uploadLogo(user, file);
  }
}
