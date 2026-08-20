import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export interface UploadFilePayload {
  mimetype?: string;
  buffer?: Buffer;
  originalname?: string;
}

export interface UploadFilePayload {
  mimetype?: string;
  buffer?: Buffer;
  originalname?: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly isCloudinaryConfigured: boolean;
  private readonly isS3Configured: boolean;
  private readonly s3Client?: S3Client;
  private readonly s3BucketName: string;

  constructor() {
    // Cloudinary setup
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

  async uploadImage(file: UploadFilePayload): Promise<string> {
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
                return reject(
                  error instanceof Error ? error : new Error(String(error)),
                );
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
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Cloudinary upload failed: ${message}. Falling back to base64 encoding.`,
        );
        return this.encodeAsBase64(file);
      }
    }

    // S3 upload if configured
    if (this.isS3Configured) {
      const s3Res = await this.uploadEvidencePdf(file, 'images');
      return s3Res.url;
    }

    return this.encodeAsBase64(file);
  }

  private encodeAsBase64(file: UploadFilePayload): string {
    const mimeType = file.mimetype || 'image/png';
    const base64Data = file.buffer ? file.buffer.toString('base64') : '';
    return `data:${mimeType};base64,${base64Data}`;
  }

  /**
   * Uploads a certificate file (PDF / JPG / JPEG / PNG).
   * Returns the public URL plus the Cloudinary public id (used for deletion).
   * Falls back to a base64 data URL when Cloudinary is not configured.
   */
  async uploadCertificateFile(
    file: UploadFilePayload,
  ): Promise<{ url: string; publicId?: string }> {
    if (!file || !file.buffer) {
      throw new Error('Invalid file upload payload: missing buffer data.');
    }

    if (this.isCloudinaryConfigured) {
      try {
        return await new Promise<{ url: string; publicId?: string }>(
          (resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'smartroadmap/certificates',
                resource_type: 'auto',
                allowed_formats: ['pdf', 'jpg', 'jpeg', 'png'],
              },
              (error, result) => {
                if (error) {
                  this.logger.error(
                    'Cloudinary certificate upload failed:',
                    error.message,
                  );
                  return reject(
                    error instanceof Error ? error : new Error(String(error)),
                  );
                }
                if (!result || !result.secure_url) {
                  return reject(
                    new Error('Cloudinary response missing secure URL link.'),
                  );
                }
                resolve({ url: result.secure_url, publicId: result.public_id });
              },
            );
            uploadStream.end(file.buffer);
          },
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Cloudinary upload failed: ${message}. Falling back to base64.`,
        );
        return { url: this.encodeAsBase64(file) };
      }
    }

    return { url: this.encodeAsBase64(file) };
  }
}
