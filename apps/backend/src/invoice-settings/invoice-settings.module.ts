import { Module } from '@nestjs/common';
import { InvoiceSettingsService } from './invoice-settings.service';
import { InvoiceSettingsController } from './invoice-settings.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [InvoiceSettingsController],
  providers: [InvoiceSettingsService],
  exports: [InvoiceSettingsService],
})
export class InvoiceSettingsModule {}
