"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const mongoose_1 = require("@nestjs/mongoose");
const message_thread_schema_1 = require("./src/schemas/message-thread.schema");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const threadModel = app.get((0, mongoose_1.getModelToken)(message_thread_schema_1.MessageThread.name));
    console.log('--- Starting Messaging Migration ---');
    try {
        await threadModel.collection.dropIndex('participantIds_1_context_1');
        console.log('✅ Dropped old unique index: participantIds_1_context_1');
    }
    catch (err) {
        if (err.code === 27) {
            console.log('ℹ️ Index participantIds_1_context_1 does not exist, skipping drop.');
        }
        else {
            console.error('❌ Failed to drop index:', err.message);
        }
    }
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
//# sourceMappingURL=migrate-messaging.js.map