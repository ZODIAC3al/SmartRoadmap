import { Global, Module } from '@nestjs/common';
import { LLMService } from './llm.service';
import { EmbeddingService } from './embedding.service';
import { RAGService } from './rag.service';
import { AiProviderFactory } from './ai-provider.factory';

@Global()
@Module({
  providers: [LLMService, EmbeddingService, RAGService, AiProviderFactory],
  exports: [LLMService, EmbeddingService, RAGService, AiProviderFactory],
})
export class AIModule {}
