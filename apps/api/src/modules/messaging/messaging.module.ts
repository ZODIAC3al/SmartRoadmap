import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageThread, MessageThreadSchema } from '../../schemas/message-thread.schema';
import { Message, MessageSchema } from '../../schemas/message.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Subscription, SubscriptionSchema } from '../../schemas/subscription.schema';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../events/events.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MessageThread.name, schema: MessageThreadSchema },
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    EventsModule,
    NotificationsModule,
    UploadModule,
  ],
  controllers: [MessagingController],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}
