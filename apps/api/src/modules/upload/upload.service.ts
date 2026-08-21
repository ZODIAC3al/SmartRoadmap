import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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
        'Cloudinary environment keys missing. Defaulting to dynamic base64/S3 fallback.',
      );
    }

    // IDrive e2 / S3 setup
    const s3Endpoint = process.env.S3_ENDPOINT;
    const s3Region = process.env.S3_REGION || 'us-east-1';
    const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID;
    const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    this.s3BucketName = process.env.S3_BUCKET_NAME || 'smartroadmap-audio';

    if (s3Endpoint && s3AccessKeyId && s3SecretAccessKey) {
      try {
        this.s3Client = new S3Client({
          endpoint: s3Endpoint,
          region: s3Region,
          credentials: {
            accessKeyId: s3AccessKeyId,
            secretAccessKey: s3SecretAccessKey,
          },
          forcePathStyle: true,
        });
        this.isS3Configured = true;
        this.logger.log(
          `IDrive e2 S3 client successfully configured on endpoint ${s3Endpoint}`,
        );
      } catch (err: any) {
        this.isS3Configured = false;
        this.logger.error(`Failed to initialize S3 client: ${err.message}`);
      }
    } else {
      this.isS3Configured = false;
      this.logger.warn(
        'IDrive S3 credentials missing (S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY).',
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
          `Cloudinary upload failed: ${message}. Falling back to S3/base64 encoding.`,
        );
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
   * Uploads PDF evidence / documents to IDrive e2 S3 bucket.
   */
  async uploadEvidencePdf(
    file: UploadFilePayload,
    folder = 'evidence',
  ): Promise<{ url: string; key: string }> {
    if (!file || !file.buffer) {
      throw new Error('Invalid file upload payload: missing buffer data.');
    }

    if (this.isS3Configured && this.s3Client) {
      try {
        const originalName = file.originalname || 'document.pdf';
        const sanitizeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `${folder}/${Date.now()}-${sanitizeName}`;
        const contentType = file.mimetype || 'application/pdf';

        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.s3BucketName,
            Key: key,
            Body: file.buffer,
            ContentType: contentType,
          }),
        );

        const endpointUrl = (process.env.S3_ENDPOINT || '').replace(/\/$/, '');
        const url = `${endpointUrl}/${this.s3BucketName}/${key}`;
        this.logger.log(`PDF evidence uploaded successfully to IDrive S3: ${url}`);
        return { url, key };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `IDrive S3 PDF upload failed: ${message}. Falling back to base64 encoding.`,
        );
      }
    }

    return { url: this.encodeAsBase64(file), key: '' };
  }

  /**
   * Uploads a certificate file (PDF / JPG / JPEG / PNG) to IDrive S3 (or Cloudinary fallback).
   */
  async uploadCertificateFile(
    file: UploadFilePayload,
  ): Promise<{ url: string; publicId?: string }> {
    if (!file || !file.buffer) {
      throw new Error('Invalid file upload payload: missing buffer data.');
    }

    // Try IDrive e2 S3 first for PDF/evidence files
    if (this.isS3Configured) {
      const s3Result = await this.uploadEvidencePdf(file, 'certificates');
      if (s3Result.url && !s3Result.url.startsWith('data:')) {
        return { url: s3Result.url, publicId: s3Result.key };
      }
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
      }
    }

    return { url: this.encodeAsBase64(file) };
  }
}
