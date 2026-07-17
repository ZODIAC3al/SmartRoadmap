import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactSubmission, ContactSubmissionSchema } from '../../schemas/contact-submission.schema';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContactSubmission.name, schema: ContactSubmissionSchema },
    ]),
  ],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
