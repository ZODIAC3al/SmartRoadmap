import {
  estimateTokens,
  trimHistoryToBudget,
  truncateMiddle,
} from './token-budget';

describe('token budget', () => {
  describe('estimateTokens', () => {
    it('scales with length', () => {
      expect(estimateTokens('a'.repeat(400))).toBeGreaterThan(
        estimateTokens('a'.repeat(100)),
      );
    });

    it('charges Arabic more per character than Latin', () => {
      // Same character count, roughly double the token cost — which is why
      // trimming by character count alone under-budgets Arabic conversations.
      const latin = estimateTokens('a'.repeat(100));
      const arabic = estimateTokens('ب'.repeat(100));
      expect(arabic).toBeGreaterThan(latin);
      expect(arabic / latin).toBeCloseTo(2, 0);
    });

    it('treats empty input as free', () => {
      expect(estimateTokens('')).toBe(0);
    });
  });

  describe('truncateMiddle', () => {
    it('leaves short text untouched', () => {
      expect(truncateMiddle('short message', 100)).toBe('short message');
    });

    it('keeps both ends of a long paste', () => {
      const text = 'START' + 'x'.repeat(8000) + 'END';
      const out = truncateMiddle(text, 100);

      expect(out.length).toBeLessThan(text.length);
      expect(out.startsWith('START')).toBe(true);
      expect(out.endsWith('END')).toBe(true);
      expect(out).toContain('trimmed');
    });
  });

  describe('trimHistoryToBudget', () => {
    const msg = (content: string) => ({ role: 'user', content });

    it('keeps everything when it already fits', () => {
      const messages = [msg('hello'), msg('hi'), msg('how are you')];
      const { kept, dropped } = trimHistoryToBudget(messages, { maxTokens: 1000 });

      expect(kept).toHaveLength(3);
      expect(dropped).toBe(0);
    });

    it('drops the oldest messages first', () => {
      const messages = [msg('a'.repeat(4000)), msg('b'.repeat(4000)), msg('recent')];
      const { kept } = trimHistoryToBudget(messages, { maxTokens: 300 });

      // The newest turn must survive; the oldest is the first to go.
      expect(kept[kept.length - 1].content).toBe('recent');
      expect(kept.length).toBeLessThan(3);
    });

    it('stays within the budget', () => {
      const messages = Array.from({ length: 40 }, (_, i) => msg(`message ${i} `.repeat(50)));
      const { kept, tokens } = trimHistoryToBudget(messages, {
        maxTokens: 500,
        maxPerMessageTokens: 200,
      });

      expect(tokens).toBeLessThanOrEqual(500);
      expect(kept.length).toBeLessThan(messages.length);
    });

    it('bounds a single oversized message instead of dropping the turn', () => {
      const messages = [msg('x'.repeat(100_000))];
      const { kept, tokens } = trimHistoryToBudget(messages, {
        maxTokens: 500,
        maxPerMessageTokens: 200,
        minMessages: 1,
      });

      // minMessages guarantees the turn survives; the per-message cap keeps the
      // cost bounded rather than letting one paste through uncapped.
      expect(kept).toHaveLength(1);
      expect(tokens).toBeLessThanOrEqual(250);
    });

    it('is a real reduction against the previous slice(-10) behaviour', () => {
      // Ten turns where one is a large pasted stack trace.
      const messages = [
        ...Array.from({ length: 9 }, (_, i) => msg(`short turn ${i}`)),
        msg('ERROR '.repeat(5000)),
      ];

      const oldCost = messages
        .slice(-10)
        .reduce((sum, m) => sum + estimateTokens(m.content), 0);
      const { tokens: newCost } = trimHistoryToBudget(messages, {
        maxTokens: 1500,
        maxPerMessageTokens: 500,
      });

      expect(newCost).toBeLessThan(oldCost);
      expect(newCost).toBeLessThanOrEqual(1500);
    });
  });
});
