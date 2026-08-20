import { Global, Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { EmbeddingService } from './embedding.service';
import { RAGService } from './rag.service';
import { AiProviderFactory } from './ai-provider.factory';
import { AppCacheService } from '../common/cache/app-cache.service';

@Global()
@Module({
  providers: [
    LLMService,
    EmbeddingService,
    RAGService,
    AiProviderFactory,
    AppCacheService,
  ],
  exports: [
    LLMService,
    EmbeddingService,
    RAGService,
    AiProviderFactory,
    AppCacheService,
  ],
})
export class AIModule {}
