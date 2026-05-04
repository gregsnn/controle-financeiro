import { useMemo } from 'react';
import type { CardBillItem, FixedExpense, MonthView } from '../domain/types';
import { isMonthInRange } from '../lib/utils';

interface UseCardDeleteReasonsParams {
  cardBills: CardBillItem[];
  fixedExpenses: FixedExpense[];
  monthViewInstallments: MonthView['installments'];
  monthCardBills: Record<string, number>;
  currentKey: string;
}

export function useCardDeleteReasons({
  cardBills,
  fixedExpenses,
  monthViewInstallments,
  monthCardBills,
  currentKey,
}: UseCardDeleteReasonsParams): Record<string, string> {
  return useMemo(() => {
    const existingCardIds = new Set(cardBills.map((card) => card.id));
    const reasons: Record<string, string> = {};

    const allUsedCardIds = new Set<string>([
      ...fixedExpenses
        .filter(
          (item) =>
            item.paymentMethod === 'cartao' &&
            !!item.card &&
            isMonthInRange(currentKey, item.startMonth, item.endMonth)
        )
        .map((item) => item.card as string),
      ...monthViewInstallments
        .filter((item) => !!item.card && item.currentInstallment <= item.totalInstallments)
        .map((item) => item.card as string),
      ...Object.keys(monthCardBills || {}),
    ]);

    allUsedCardIds.forEach((cardId) => {
      if (!existingCardIds.has(cardId)) return;

      const labels: string[] = [];
      if (
        fixedExpenses.some(
          (item) =>
            item.paymentMethod === 'cartao' &&
            item.card === cardId &&
            isMonthInRange(currentKey, item.startMonth, item.endMonth)
        )
      ) {
        labels.push('gastos fixos');
      }
      if (
        monthViewInstallments.some(
          (item) => item.card === cardId && item.currentInstallment <= item.totalInstallments
        )
      ) {
        labels.push('parcelamentos');
      }
      if (Object.prototype.hasOwnProperty.call(monthCardBills, cardId)) {
        labels.push('fatura do mês');
      }

      if (labels.length > 0) {
        reasons[cardId] = labels.join(', ');
      }
    });

    return reasons;
  }, [cardBills, fixedExpenses, monthViewInstallments, monthCardBills, currentKey]);
}
