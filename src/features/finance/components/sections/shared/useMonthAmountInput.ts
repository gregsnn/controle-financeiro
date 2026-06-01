import { useCallback, useState } from 'react';
import { applyMoneyMask, parseMoneyInput } from '../../../lib/moneyInput';

interface MonthAmountItem {
  id: string;
  amount?: number;
  baseAmount?: number;
}

export function useMonthAmountInput(
  onMonthAmount?: (itemId: string, amount: number | null) => void
) {
  const [tempInputValues, setTempInputValues] = useState<Record<string, string>>({});

  const clearTempValue = useCallback((itemId: string) => {
    setTempInputValues((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  const handleMonthAmountChange = useCallback(
    (itemId: string, newAmount: string | null) => {
      if (!onMonthAmount) return;
      if (newAmount === null) {
        onMonthAmount(itemId, null);
        clearTempValue(itemId);
        return;
      }

      const parsed = parseMoneyInput(newAmount);
      if (parsed !== null) {
        onMonthAmount(itemId, parsed);
      }
    },
    [clearTempValue, onMonthAmount]
  );

  const handleMonthAmountInput = useCallback((itemId: string, value: string) => {
    const masked = applyMoneyMask(value);
    setTempInputValues((prev) => ({ ...prev, [itemId]: masked }));
  }, []);

  const handleMonthAmountBlur = useCallback(
    (item: MonthAmountItem) => {
      const currentInputValue = tempInputValues[item.id];
      if (currentInputValue === undefined) return;

      if (onMonthAmount) {
        const parsed = parseMoneyInput(currentInputValue);
        const baseAmount = item.baseAmount ?? item.amount;
        if (parsed === null || parsed === baseAmount) {
          onMonthAmount(item.id, null);
        } else {
          onMonthAmount(item.id, parsed);
        }
      }
      clearTempValue(item.id);
    },
    [clearTempValue, onMonthAmount, tempInputValues]
  );

  return {
    tempInputValues,
    handleMonthAmountChange,
    handleMonthAmountInput,
    handleMonthAmountBlur,
  };
}
