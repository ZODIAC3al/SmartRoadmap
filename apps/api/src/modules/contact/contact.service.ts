import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContactSubmission } from '../../schemas/contact-submission.schema';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectModel(ContactSubmission.name)
    private readonly contactModel: Model<ContactSubmission>,
  ) {}

  async submit(data: {
    name: string;
    email: string;
    phone?: string;
    interest?: string;
    message: string;
  }) {
    this.logger.log(`New contact submission from: ${data.email}`);
    const submission = new this.contactModel(data);
    return submission.save();
  }
}
