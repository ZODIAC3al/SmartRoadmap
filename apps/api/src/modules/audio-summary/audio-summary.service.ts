import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { AudioSummary } from '../../schemas/audio-summary.schema';
import { Roadmap } from '../../schemas/roadmap.schema';
import { AiProviderFactory } from '../../ai/ai-provider.factory';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AudioSummaryService {
  private readonly logger = new Logger(AudioSummaryService.name);
  private readonly audioDir: string;

  constructor(
    @InjectModel(AudioSummary.name)
    private readonly audioSummaryModel: Model<AudioSummary>,
    @InjectModel(Roadmap.name)
    private readonly roadmapModel: Model<Roadmap>,
    private readonly aiProviderFactory: AiProviderFactory,
    private readonly config: ConfigService,
  ) {
    // Set up local storage path inside the API workspace
    this.audioDir = path.join(process.cwd(), 'public', 'audio');
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }
  }

  async get(userId: string, moduleId: string): Promise<AudioSummary | null> {
    return this.audioSummaryModel.findOne({
      userId: new Types.ObjectId(userId),
      moduleId,
    }).exec();
  }

  async getAudioFilePath(filename: string): Promise<string> {
    const filePath = path.join(this.audioDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Audio file not found');
    }
    return filePath;
  }

  async generate(userId: string, moduleId: string): Promise<AudioSummary> {
    const roadmap = await this.roadmapModel.findOne({ userId: new Types.ObjectId(userId), status: 'active' });
    if (!roadmap) throw new NotFoundException('Active roadmap not found');

    const module = roadmap.modules.find((m) => m.id === moduleId);
    if (!module) throw new NotFoundException('Roadmap module not found');

    // Create or update status to pending
    let audioSummary = await this.audioSummaryModel.findOne({
      userId: new Types.ObjectId(userId),
      moduleId,
    });

    if (!audioSummary) {
      audioSummary = new this.audioSummaryModel({
        userId: new Types.ObjectId(userId),
        moduleId,
        status: 'pending',
      });
    } else {
      audioSummary.status = 'pending';
    }
    await audioSummary.save();

    // Trigger async background processing
    setImmediate(async () => {
      try {
        await this.processAudioSynthesis(userId, moduleId, module.title, module.description || '', module.topics);
      } catch (err: any) {
        this.logger.error(`Async audio summary processing failed for module ${moduleId}: ${err.message}`);
        await this.audioSummaryModel.updateOne(
          { userId: new Types.ObjectId(userId), moduleId },
          { $set: { status: 'failed' } },
        );
      }
    });

    return audioSummary;
  }

  private async processAudioSynthesis(
    userId: string,
    moduleId: string,
    title: string,
    description: string,
    topics: string[],
  ) {
    const isMock = this.config.get<boolean>('MOCK_MODE') === true;
    const providers = this.aiProviderFactory.getProvidersChain();
    const activeProviders = providers.filter(p => p.constructor.name !== 'MockProvider');

    if (isMock || activeProviders.length === 0) {
      this.logger.warn(`Mock mode or no real API keys configured. Generating mock audio summary for module ${moduleId}.`);
      
      const script = `This is a mock audio summary for "${title}". To hear dynamic AI audio narrations, please configure an API key for OpenAI, Gemini, or other providers in your environment variables.`;
      
      const silentWavBase64 =
        'UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
      
      const filename = `${userId}-${moduleId}.wav`;
      const localPath = path.join(this.audioDir, filename);
      fs.writeFileSync(localPath, Buffer.from(silentWavBase64, 'base64'));

      const audioUrl = `/audio-summaries/play/${filename}`;

      await this.audioSummaryModel.updateOne(
        { userId: new Types.ObjectId(userId), moduleId },
        {
          $set: {
            status: 'ready',
            script,
            audioUrl,
            durationSeconds: 10,
            provider: 'mock',
          },
        },
      );
      return;
    }

    const prompt = `
Generate a clear, highly conversational audio narration script summarizing the learning module:
Module: "${title}"
Description: "${description}"
Topics: ${topics.join(', ')}

The script should sound like a professional podcast narrator explaining the module simply to a student during their commute. Keep it between 150 to 300 words.
Do not include any sound effect descriptions, titles, or scene directions. Output ONLY the speech narration script.
`;
    const system = 'You are a professional audio educator. Narrate lessons clearly and naturally.';

    let lastError: Error | null = null;

    for (const provider of activeProviders) {
      try {
        const providerName = provider.constructor.name;
        this.logger.log(`Synthesizing script for module ${moduleId} using provider ${providerName}...`);
        const script = await provider.generateText(prompt, system);

        this.logger.log(`Synthesizing TTS audio buffer for module ${moduleId} using provider ${providerName}...`);
        const audioBuffer = await provider.textToSpeech(script, 'en-US-Neural2-F');

        // Save to storage
        const filename = `${userId}-${moduleId}.mp3`;
        const localPath = path.join(this.audioDir, filename);
        fs.writeFileSync(localPath, audioBuffer);

        // Estimate duration: ~130 words per minute (2.1 words per second)
        const wordCount = script.split(/\s+/).length;
        const durationSeconds = Math.max(10, Math.round(wordCount / 2.1));

        const audioUrl = `/audio-summaries/play/${filename}`;

        await this.audioSummaryModel.updateOne(
          { userId: new Types.ObjectId(userId), moduleId },
          {
            $set: {
              status: 'ready',
              script,
              audioUrl,
              durationSeconds,
              provider: providerName.replace('Provider', '').toLowerCase(),
            },
          },
        );
        this.logger.log(`Audio summary successfully generated using ${providerName} and stored locally: ${localPath}`);
        return; // Success, stop looping
      } catch (err: any) {
        this.logger.warn(`Audio synthesis attempt failed with provider ${provider.constructor.name}: ${err.message}`);
        lastError = err;
      }
    }

    // If we get here, all providers failed
    this.logger.error(`All active audio synthesis providers failed for module ${moduleId}. Last error: ${lastError?.message}`);
    await this.audioSummaryModel.updateOne(
      { userId: new Types.ObjectId(userId), moduleId },
      {
        $set: {
          status: 'failed',
          script: `Audio summaries synthesis failed. Details: ${lastError?.message || 'unknown error'}`,
        },
      },
    );
  }
}
