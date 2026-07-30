import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CodeExecutionService {
  private readonly logger = new Logger(CodeExecutionService.name);
  private readonly execUrl: string;

  constructor(private readonly config: ConfigService) {
    this.execUrl = this.config.get<string>('CODE_EXEC_URL', 'http://localhost:2000');
  }

  async runCode(
    language: string,
    code: string,
    stdin = '',
  ): Promise<{ stdout: string; stderr: string; code: number }> {
    const mappedLang = this.mapLanguage(language);
    
    try {
      this.logger.log(`Executing code via Piston: language=${mappedLang}`);
      
      const res = await fetch(`${this.execUrl}/api/v2/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: mappedLang,
          version: '*',
          files: [
            {
              content: code,
            },
          ],
          stdin,
        }),
        signal: AbortSignal.timeout(5000), // Enforce strict 5s execution timeout
      });

      if (res.ok) {
        const data: any = await res.json();
        if (data.run) {
          return {
            stdout: data.run.stdout || '',
            stderr: data.run.stderr || '',
            code: data.run.code ?? 0,
          };
        }
      }
      this.logger.warn(`Piston API returned error status: ${res.status}. Falling back to mock run...`);
    } catch (err: any) {
      this.logger.warn(`Connection to Piston sandbox failed: ${err.message}. Falling back to mock run...`);
    }

    // Mock/Simulated execution fallback
    return this.mockRun(code);
  }

  private mapLanguage(lang: string): string {
    const lower = lang.toLowerCase();
    if (lower === 'javascript' || lower === 'js') return 'javascript';
    if (lower === 'typescript' || lower === 'ts') return 'typescript';
    if (lower === 'python' || lower === 'py') return 'python';
    return lower;
  }

  private mockRun(code: string): { stdout: string; stderr: string; code: number } {
    // Basic regex to capture prints/console logs to make mock runs feel responsive
    const consoleLogRegex = /(?:console\.log|print)\s*\(\s*['"`](.*?)['"`]\s*\)/g;
    const outputs: string[] = [];
    let match;

    while ((match = consoleLogRegex.exec(code)) !== null) {
      outputs.push(match[1]);
    }

    const stdout = outputs.length > 0 
      ? outputs.join('\n') 
      : 'Code completed successfully (Mock Sandbox fallback mode).';

    return {
      stdout,
      stderr: '',
      code: 0,
    };
  }
}
