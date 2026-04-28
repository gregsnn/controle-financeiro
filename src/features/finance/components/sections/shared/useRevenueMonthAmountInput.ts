import { useCallback, useState } from 'react';
import { applyMoneyMask, parseMoneyInput } from '../../../lib/moneyInput';

interface RevenueLike {
  id: string;
  baseAmount: number;
}

export function useRevenueMonthAmountInput(
  onMonthRevenueAmount?: (itemId: string, amount: number | null) => void
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
      if (!onMonthRevenueAmount) return;
      if (newAmount === null) {
        onMonthRevenueAmount(itemId, null);
        clearTempValue(itemId);
        return;
      }

      const parsed = parseMoneyInput(newAmount);
      if (parsed !== null) {
        onMonthRevenueAmount(itemId, parsed);
      }
    },
    [clearTempValue, onMonthRevenueAmount]
  );

  const handleMonthAmountInput = useCallback((itemId: string, value: string) => {
    const masked = applyMoneyMask(value);
    setTempInputValues((prev) => ({ ...prev, [itemId]: masked }));
  }, []);

  const handleMonthAmountBlur = useCallback(
    (item: RevenueLike) => {
      const currentInputValue = tempInputValues[item.id];
      if (onMonthRevenueAmount) {
        const parsed = parseMoneyInput(currentInputValue);
        if (parsed === null || parsed === item.baseAmount) {
          onMonthRevenueAmount(item.id, null);
        } else {
          onMonthRevenueAmount(item.id, parsed);
        }
      }
      clearTempValue(item.id);
    },
    [clearTempValue, onMonthRevenueAmount, tempInputValues]
  );

  return {
    tempInputValues,
    handleMonthAmountChange,
    handleMonthAmountInput,
    handleMonthAmountBlur,
  };
}
