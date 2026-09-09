import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private isConfigured = false;

  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.isConfigured = true;
      this.logger.log('Cloudinary initialized successfully.');
    } else {
      this.logger.warn(
        'Cloudinary credentials not provided in .env (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). Direct image URL fallback will be active.',
      );
    }
  }

  /**
   * Uploads a logo file for a specific business tenant.
   * Maps logo specifically to factory-flow/tenants/{businessId}/logo to prevent filename collisions.
   */
  async uploadLogo(
    fileBuffer: Buffer,
    businessId: string,
    originalFilename?: string,
  ): Promise<string> {
    if (!this.isConfigured) {
      // Fallback: Return base64 data URI if Cloudinary is not configured
      const mimeType = originalFilename?.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `factory-flow/tenants/${businessId}`,
          public_id: `logo_${Date.now()}`,
          overwrite: true,
          resource_type: 'image',
        },
        (error, result: UploadApiResponse) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`);
            return reject(error);
          }
          resolve(result.secure_url);
        },
      );

      uploadStream.end(fileBuffer);
    });
  }
}
