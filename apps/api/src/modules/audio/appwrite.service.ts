import { Injectable } from '@nestjs/common';
import { Client, Storage, ID } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

@Injectable()
export class AppwriteService {
  private storage: Storage;

  constructor() {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT!)
      .setProject(process.env.APPWRITE_PROJECT_ID!)
      .setKey(process.env.APPWRITE_API_KEY!);

    this.storage = new Storage(client);
  }

  async uploadAudio(file: Express.Multer.File) {
    const uploaded = await this.storage.createFile(
      process.env.APPWRITE_AUDIO_BUCKET_ID!,
      ID.unique(),
      InputFile.fromBuffer(file.buffer, file.originalname),
    );

    return uploaded;
  }

  async uploadAudioBuffer(buffer: Buffer, originalname: string) {
    const uploaded = await this.storage.createFile(
      process.env.APPWRITE_AUDIO_BUCKET_ID!,
      ID.unique(),
      InputFile.fromBuffer(buffer, originalname),
    );

    return uploaded;
  }

  getAudioUrl(fileId: string) {
    return `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${
      process.env.APPWRITE_AUDIO_BUCKET_ID
    }/files/${fileId}/view?project=${process.env.APPWRITE_PROJECT_ID}`;
  }
}
