import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  getHello(): string {
    return 'SmartRoadmap API is running. See /health or /docs.';
  }

  async subscribeToNewsletter(email: string) {
    const collection = this.connection.collection('newsletter_subscribers');
    await collection.updateOne(
      { email: email.toLowerCase().trim() },
      { $setOnInsert: { email: email.toLowerCase().trim(), createdAt: new Date() } },
      { upsert: true },
    );
    this.logger.log(`Newsletter subscription stored for ${email}`);
    return { success: true, message: 'Subscribed successfully.' };
  }
}
