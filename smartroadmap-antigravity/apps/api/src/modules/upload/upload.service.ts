import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly isCloudinaryConfigured: boolean;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.isCloudinaryConfigured = true;
      this.logger.log(
        'Cloudinary successfully configured for secure image uploads.',
      );
    } else {
      this.isCloudinaryConfigured = false;
      this.logger.warn(
        'Cloudinary environment keys missing (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET). ' +
          'Defaulting to dynamic base64/local uploader fallback.',
      );
    }
  }

  async uploadImage(file: any): Promise<string> {
    if (!file || !file.buffer) {
      throw new Error('Invalid file upload payload: missing buffer data.');
    }

    if (this.isCloudinaryConfigured) {
      try {
        return await new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'smartroadmap',
              resource_type: 'image',
              allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            },
            (error, result) => {
              if (error) {
                this.logger.error(
                  'Cloudinary upload stream failed:',
                  error.message,
                );
                return reject(error);
              }
              if (!result || !result.secure_url) {
                return reject(
                  new Error('Cloudinary response missing secure URL link.'),
                );
              }
              resolve(result.secure_url);
            },
          );
          uploadStream.end(file.buffer);
        });
      } catch (err: any) {
        this.logger.error(
          `Cloudinary upload failed: ${err.message}. Falling back to base64 encoding.`,
        );
        return this.encodeAsBase64(file);
      }
    } else {
      // Fallback: zero-config base64 string uploader so the app continues working perfectly
      return this.encodeAsBase64(file);
    }
  }

  private encodeAsBase64(file: any): string {
    const mimeType = file.mimetype || 'image/png';
    const base64Data = file.buffer.toString('base64');
    return `data:${mimeType};base64,${base64Data}`;
  }
}
