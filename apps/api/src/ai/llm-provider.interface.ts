export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface LLMProvider {
  chat(
    messages: ChatMessage[],
    options?: { isJson?: boolean },
  ): Promise<string>;
}
