import { Global, Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { EmbeddingService } from './embedding.service';
import { RAGService } from './rag.service';
import { RAGEvalService } from './rag-eval.service';
import { AiProviderFactory } from './ai-provider.factory';
import { AppCacheService } from '../common/cache/app-cache.service';
import { AiGatewayService } from './gateway/ai-gateway.service';

@Global()
@Module({
  providers: [
    LLMService,
    EmbeddingService,
    RAGService,
    RAGEvalService,
    AiProviderFactory,
    AppCacheService,
    AiGatewayService,
  ],
  exports: [
    LLMService,
    EmbeddingService,
    RAGService,
    RAGEvalService,
    AiProviderFactory,
    AppCacheService,
    AiGatewayService,
  ],
})
export class AIModule {}
