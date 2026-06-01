import { useMemo } from 'react';
import type { CardBillItem } from '../domain/types';

export function useCardList(cardList?: CardBillItem[]): CardBillItem[] {
  return useMemo(() => cardList ?? [], [cardList]);
}
