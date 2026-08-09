import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Client, Storage, ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

@Injectable()
export class AppwriteService {
  private readonly logger = new Logger(AppwriteService.name);
  private readonly storage: Storage | null = null;
  private readonly endpoint:  string;
  private readonly projectId: string;
  private readonly bucketId:  string;

  constructor() {
    this.endpoint  = process.env.APPWRITE_ENDPOINT        ?? '';
    this.projectId = process.env.APPWRITE_PROJECT_ID      ?? '';
    this.bucketId  = process.env.APPWRITE_AUDIO_BUCKET_ID ?? '';
    const apiKey   = process.env.APPWRITE_API_KEY         ?? '';

    if (this.endpoint && this.projectId && apiKey) {
      const client = new Client()
        .setEndpoint(this.endpoint)
        .setProject(this.projectId)
        .setKey(apiKey);

      this.storage = new Storage(client);
    } else {
      this.logger.warn(
        'Appwrite credentials not configured — audio upload is disabled. ' +
        'Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, and ' +
        'APPWRITE_AUDIO_BUCKET_ID in your .env to enable it.',
      );
    }
  }

  async uploadAudio(file: Express.Multer.File) {
    this.assertReady();
    return this.storage!.createFile(
      this.bucketId,
      ID.unique(),
      InputFile.fromBuffer(file.buffer, file.originalname),
    );
  }

  async uploadAudioBuffer(buffer: Buffer, originalname: string) {
    this.assertReady();
    return this.storage!.createFile(
      this.bucketId,
      ID.unique(),
      InputFile.fromBuffer(buffer, originalname),
    );
  }

  getAudioUrl(fileId: string): string {
    if (!this.endpoint || !this.bucketId || !this.projectId) return '';
    return (
      `${this.endpoint}/storage/buckets/${this.bucketId}` +
      `/files/${fileId}/view?project=${this.projectId}`
    );
  }

  private assertReady(): void {
    if (!this.storage) {
      throw new ServiceUnavailableException(
        'Audio upload is unavailable — Appwrite is not configured.',
      );
    }
  }
}
