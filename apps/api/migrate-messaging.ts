import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MessageThread } from './src/schemas/message-thread.schema';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const threadModel = app.get<Model<MessageThread>>(getModelToken(MessageThread.name));

  console.log('--- Starting Messaging Migration ---');

  // 1. Drop the old problematic index
  try {
    await threadModel.collection.dropIndex('participantIds_1_context_1');
    console.log('✅ Dropped old unique index: participantIds_1_context_1');
  } catch (err: any) {
    if (err.code === 27) {
      console.log('ℹ️ Index participantIds_1_context_1 does not exist, skipping drop.');
    } else {
      console.error('❌ Failed to drop index:', err.message);
    }
  }

  // 2. Backfill participantsKey for existing threads
  const threads = await threadModel.find({ participantsKey: { $exists: false } });
  console.log(`Found ${threads.length} threads missing participantsKey.`);

  let updatedCount = 0;
  for (const thread of threads) {
    if (thread.participantIds && thread.participantIds.length === 2) {
      const sorted = [...thread.participantIds].sort((a, b) => a.toString().localeCompare(b.toString()));
      thread.participantsKey = `${sorted[0].toString()}_${sorted[1].toString()}`;
      await thread.save();
      updatedCount++;
    }
  }
  console.log(`✅ Backfilled participantsKey for ${updatedCount} threads.`);

  // 3. Let Mongoose build the new indexes based on the updated schema
  await threadModel.syncIndexes();
  console.log('✅ Synced indexes.');

  console.log('--- Migration Complete ---');
  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
