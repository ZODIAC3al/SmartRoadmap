export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}

export interface LLMChatOptions {
  /** Ask the provider for a JSON response rather than prose. */
  isJson?: boolean;
  /** Ceiling on generated tokens. Providers apply their own default if unset. */
  maxOutputTokens?: number;
  /** Sampling temperature; leave unset to use the provider default. */
  temperature?: number;
}

export interface LLMProvider {
  chat(messages: ChatMessage[], options?: LLMChatOptions): Promise<string>;
}
