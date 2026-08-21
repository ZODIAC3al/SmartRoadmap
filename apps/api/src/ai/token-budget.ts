/**
 * Token accounting for LLM calls.
 *
 * Every provider bills by token, so the two things that actually control cost
 * are how much context we send and how much output we allow back. Trimming a
 * chat history by message *count* does neither: ten short greetings cost almost
 * nothing, while a single pasted stack trace can cost more than the previous
 * fifty turns combined. These helpers budget by size instead.
 *
 * Counts are estimates. Running a real BPE tokenizer server-side would cost
 * more CPU than it saves in tokens, and the numbers only need to be good enough
 * to keep a prompt under a ceiling — so we approximate, then leave headroom.
 */

/** Rough characters-per-token for Latin script under a BPE tokenizer. */
const CHARS_PER_TOKEN_LATIN = 4;

/**
 * Arabic encodes far less efficiently: most letters fall outside the byte-level
 * merges that BPE vocabularies optimise for Latin text, so the same character
 * count costs roughly twice as many tokens.
 */
const CHARS_PER_TOKEN_ARABIC = 2;

const ARABIC_RANGE = /[؀-ۿ]/g;

/**
 * Approximate the token cost of a string, weighting Arabic characters higher.
 * Deliberately errs on the high side — an overestimate wastes a little context
 * window, an underestimate produces a provider error.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  const arabicChars = (text.match(ARABIC_RANGE) || []).length;
  const otherChars = text.length - arabicChars;

  return Math.ceil(
    arabicChars / CHARS_PER_TOKEN_ARABIC + otherChars / CHARS_PER_TOKEN_LATIN,
  );
}

export interface BudgetedMessage {
  role: string;
  content: string;
}

export interface TrimOptions {
  /** Ceiling for the whole history, in estimated tokens. */
  maxTokens: number;
  /**
   * Longest single message to keep intact. Anything above this is truncated
   * from the middle, which preserves both the opening (usually the question)
   * and the tail (usually the error) of a long paste.
   */
  maxPerMessageTokens?: number;
  /** Never drop below this many of the most recent messages. */
  minMessages?: number;
}

/** Truncate a single message from the middle, keeping both ends readable. */
export function truncateMiddle(text: string, maxTokens: number): string {
  if (estimateTokens(text) <= maxTokens) return text;

  // Convert the token budget back to an approximate character budget using the
  // same weighting, so Arabic text is not cut far shorter than intended.
  const arabicRatio = (text.match(ARABIC_RANGE) || []).length / text.length;
  const charsPerToken =
    arabicRatio * CHARS_PER_TOKEN_ARABIC + (1 - arabicRatio) * CHARS_PER_TOKEN_LATIN;

  const budgetChars = Math.max(200, Math.floor(maxTokens * charsPerToken));
  const notice = '\n\n[… trimmed to stay within the context budget …]\n\n';
  const half = Math.floor((budgetChars - notice.length) / 2);
  if (half <= 0) return text.slice(0, budgetChars);

  return text.slice(0, half) + notice + text.slice(-half);
}

/**
 * Keep the most recent messages that fit inside `maxTokens`, walking backwards
 * from the newest so the immediate conversation always survives.
 *
 * Returns the kept messages in their original order, plus what was spent and
 * dropped, so callers can log the saving rather than guess at it.
 */
export function trimHistoryToBudget(
  messages: BudgetedMessage[],
  options: TrimOptions,
): { kept: BudgetedMessage[]; tokens: number; dropped: number } {
  const { maxTokens, maxPerMessageTokens, minMessages = 1 } = options;

  const capped = maxPerMessageTokens
    ? messages.map((m) => ({
        ...m,
        content: truncateMiddle(m.content, maxPerMessageTokens),
      }))
    : messages;

  const kept: BudgetedMessage[] = [];
  let tokens = 0;

  for (let i = capped.length - 1; i >= 0; i--) {
    const cost = estimateTokens(capped[i].content);

    // Always honour the minimum, even if it overshoots — a chat with no recent
    // turn in it is useless, and an overshoot here is bounded by the per-message
    // cap above.
    if (tokens + cost > maxTokens && kept.length >= minMessages) break;

    kept.unshift(capped[i]);
    tokens += cost;
  }

  return { kept, tokens, dropped: messages.length - kept.length };
}
