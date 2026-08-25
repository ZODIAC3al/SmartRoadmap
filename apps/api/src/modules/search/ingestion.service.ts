import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PDFParse } from 'pdf-parse';
import { RAGService, RESOURCES_COLLECTION } from '../../ai/rag.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  
  private readonly PARENT_CHUNK_SIZE = 512; 
  private readonly CHILD_CHUNK_SIZE = 128;

  constructor(private readonly ragService: RAGService) {}

  async processDocuments() {
    const docsDir = path.join(process.cwd(), 'data', 'docs');
    if (!fs.existsSync(docsDir)) {
      this.logger.warn(`Docs directory not found: ${docsDir}. Automatic ingestion skipped.`);
      return;
    }

    const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.pdf'));
    if (files.length === 0) {
      this.logger.log(`No PDF files found in ${docsDir}. Skipping ingestion.`);
      return;
    }

    this.logger.log(`Found ${files.length} PDFs. Starting ingestion...`);
    const allNodes: any[] = [];

    for (const file of files) {
      const filePath = path.join(docsDir, file);
      try {
        const dataBuffer = fs.readFileSync(filePath);
        // Extract text using PDFParse
        const parser = new PDFParse({ data: dataBuffer });
        const data = await parser.getText();
        const text = data.text;
        const title = file.replace('.pdf', '');

        // 1. Generate Sentence Window Nodes
        const sentenceNodes = this.createSentenceNodes(text, title, file);
        allNodes.push(...sentenceNodes);

        // 2. Generate Hierarchical Parent/Child Chunks
        const hierarchicalNodes = this.createHierarchicalChunks(text, title, file);
        allNodes.push(...hierarchicalNodes);

      } catch (err: any) {
        this.logger.error(`Failed to process PDF ${file}: ${err.message}`);
      }
    }

    if (allNodes.length > 0) {
      this.logger.log(`Upserting ${allNodes.length} extracted nodes to Qdrant...`);
      await this.ragService.upsert(RESOURCES_COLLECTION, allNodes);
      this.logger.log(`Successfully completed PDF ingestion.`);
    }
  }

  private createSentenceNodes(text: string, title: string, documentId: string) {
    // Split text into reasonable sentence chunks.
    const sentences = text.match(/[^.!?]+[.!?]+(?:\s|\n|$)/g) || [text];
    const cleanSentences = sentences.map(s => s.replace(/\s+/g, ' ').trim()).filter(s => s.length > 10);

    const nodes = [];
    for (let i = 0; i < cleanSentences.length; i++) {
      const s = cleanSentences[i];
      const windowBefore = cleanSentences.slice(Math.max(0, i - 2), i).join(' ');
      const windowAfter = cleanSentences.slice(i + 1, Math.min(cleanSentences.length, i + 3)).join(' ');
      
      const chunkId = crypto.randomUUID();
      nodes.push({
        id: chunkId,
        text: s,
        payload: {
          documentId,
          title,
          nodeType: 'sentence',
          chunkId,
          windowBefore,
          windowAfter,
        }
      });
    }
    return nodes;
  }

  private createHierarchicalChunks(text: string, title: string, documentId: string) {
    const words = text.replace(/\s+/g, ' ').trim().split(' ');
    const nodes = [];
    
    for (let i = 0; i < words.length; i += this.PARENT_CHUNK_SIZE) {
      const parentWords = words.slice(i, i + this.PARENT_CHUNK_SIZE);
      const parentText = parentWords.join(' ');
      if (parentText.length < 20) continue; 
      
      const parentId = crypto.randomUUID();
      // Store the parent chunk.
      nodes.push({
        id: parentId,
        text: parentText,
        payload: {
          documentId,
          title,
          nodeType: 'parent_chunk',
          chunkId: parentId,
          parentId: parentId,
        }
      });

      // Split parent into children
      for (let j = 0; j < parentWords.length; j += this.CHILD_CHUNK_SIZE) {
        const childWords = parentWords.slice(j, j + this.CHILD_CHUNK_SIZE);
        const childText = childWords.join(' ');
        if (childText.length < 20) continue;

        const childId = crypto.randomUUID();
        nodes.push({
          id: childId,
          text: childText,
          payload: {
            documentId,
            title,
            nodeType: 'child_chunk',
            chunkId: childId,
            parentId: parentId,
          }
        });
      }
    }
    return nodes;
  }
}
