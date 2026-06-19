import { Module, Global } from '@nestjs/common';
import { LLMService } from './llm.service';
import { EmbeddingService } from './embedding.service';
import { RAGService } from './rag.service';

@Global()
@Module({
  providers: [LLMService, EmbeddingService, RAGService],
  exports: [LLMService, EmbeddingService, RAGService],
})
export class AIModule {}
