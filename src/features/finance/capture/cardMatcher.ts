import type { CardBillItem } from '../domain/types';
import { normalizeCaptureText } from './tokenizer';

export interface MatchedCard {
  id: string;
  name: string;
}

export function matchCard(input: string, cards: CardBillItem[]): MatchedCard | null {
  const normalizedInput = ` ${normalizeCaptureText(input)} `;

  for (const card of cards) {
    const normalizedName = normalizeCaptureText(card.name);
    const normalizedId = normalizeCaptureText(card.id);
    if (
      normalizedInput.includes(` ${normalizedName} `) ||
      normalizedInput.includes(` ${normalizedId} `)
    ) {
      return { id: card.id, name: card.name };
    }
  }

  return null;
}
