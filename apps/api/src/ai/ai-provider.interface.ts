export interface AiProvider {
  generateText(prompt: string, system?: string): Promise<string>;
  generateJSON<T>(prompt: string, schemaDescription: string, system?: string): Promise<T>;
  textToSpeech(text: string, voice?: string): Promise<Buffer>;
}
