import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateInvoiceSettingsDto } from './dto/update-invoice-settings.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { UserPayload } from '../auth/decorators/user.decorator';

@Injectable()
export class InvoiceSettingsService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private activityLogs: ActivityLogsService,
  ) {}

  async getSettings(businessId: string) {
    if (!businessId) throw new BadRequestException('Business ID missing from context');

    let settings = await this.prisma.invoiceSettings.findUnique({
      where: { businessId },
    });

    if (!settings) {
      const business = await this.prisma.business.findUnique({ where: { id: businessId } });
      settings = await this.prisma.invoiceSettings.create({
        data: {
          businessId,
          companyName: business?.name || 'My Factory Business',
          email: business?.email || '',
          phone: business?.phone || '',
          addressLine1: business?.address || '',
          tagline: 'Quality Products Manufacturer',
          termsAndConditions: '1. Goods once sold will not be taken back.\n2. Subject to local jurisdiction.',
          declaration: 'We declare that this invoice shows the actual price of the goods described.',
          signatureTitle: 'Authorized Signatory',
        },
      });
    }

    return settings;
  }

  async updateSettings(user: UserPayload, dto: UpdateInvoiceSettingsDto) {
    const businessId = user.businessId!;
    if (!businessId) throw new BadRequestException('Business ID missing from context');

    // Ensure record exists
    await this.getSettings(businessId);

    const updated = await this.prisma.invoiceSettings.update({
      where: { businessId },
      data: dto,
    });

    await this.activityLogs.log({
      businessId,
      userId: user.userId,
      userName: user.name || user.email,
      userEmail: user.email,
      action: 'INVOICE_SETTINGS_UPDATE',
      entity: 'InvoiceSettings',
      entityId: updated.id,
      description: `Updated company invoice details for "${updated.companyName}"`,
    });

    return updated;
  }

  async uploadLogo(user: UserPayload, file: Express.Multer.File) {
    const businessId = user.businessId!;
    if (!businessId) throw new BadRequestException('Business ID missing from context');
    if (!file) throw new BadRequestException('No image file uploaded');

    const logoUrl = await this.cloudinaryService.uploadLogo(
      file.buffer,
      businessId,
      file.originalname,
    );

    await this.updateSettings(user, { logoUrl });

    return { logoUrl };
  }
}
