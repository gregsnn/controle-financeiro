import type { Dispatch, SetStateAction } from 'react';
import { createFinanceId } from '../lib/ids';
import { resetFinanceDatabase } from '../lib/storage';
import { monthKey, previousMonthKey } from '../lib/utils';
import { OVERRIDE_TYPES } from './constants';
import type { FinanceState, FixedExpense, Installment, OverrideType, Revenue } from './types';

type SetStateFunc = Dispatch<SetStateAction<FinanceState | null>>;

export function createActions(_state: FinanceState, setState: SetStateFunc, currentDate: Date) {
  return {
    changeMonth: (step: number) => {
      const next = new Date(currentDate);
      next.setMonth(next.getMonth() + step);
      setState((prev) => {
        if (!prev) return prev;
        return { ...prev, currentDate: next };
      });
    },
    resetDatabase: async () => {
      await resetFinanceDatabase();
      setState(null);
    },
    importFinanceState: (nextState: FinanceState) => {
      setState(() => nextState);
    },
    setTheme: (theme: 'default' | 'premium') =>
      setState((prev) => {
        if (!prev) return prev;
        return { ...prev, settings: { ...prev.settings, theme } };
      }),
    setCardBills: (cardBills: FinanceState['settings']['cardBills']) =>
      setState((prev) => {
        if (!prev) return prev;
        return { ...prev, settings: { ...prev.settings, cardBills } };
      }),
    addFixedExpense: (data: Partial<FixedExpense>) =>
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          fixedExpenses: [
            ...prev.fixedExpenses,
            {
              id: createFinanceId('fixed'),
              active: true,
              notes: '',
              endMonth: null,
              ...data,
            } as FixedExpense,
          ],
        };
      }),
    addRevenue: (data: Partial<Revenue>) =>
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          revenues: [
            ...prev.revenues,
            {
              id: createFinanceId('rev'),
              active: true,
              notes: '',
              endMonth: null,
              ...data,
            } as Revenue,
          ],
        };
      }),
    addInstallment: (data: Partial<Installment>) =>
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          installments: [
            ...prev.installments,
            {
              id: createFinanceId('inst'),
              active: true,
              closedAt: null,
              currentInstallment: 1,
              ...data,
            } as Installment,
          ],
        };
      }),
    updateFixedExpense: (id: string, updates: Partial<FixedExpense>) =>
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          fixedExpenses: prev.fixedExpenses.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        };
      }),
    removeFixedExpense: (id: string) =>
      setState((prev) => {
        if (!prev) return prev;
        const closingMonth = previousMonthKey(monthKey(prev.currentDate));
        return {
          ...prev,
          fixedExpenses: prev.fixedExpenses.map((item) =>
            item.id === id
              ? {
                  ...item,
                  endMonth: item.endMonth && item.endMonth < closingMonth ? item.endMonth : closingMonth,
                }
              : item
          ),
        };
      }),
    updateRevenue: (id: string, updates: Partial<Revenue>) =>
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          revenues: prev.revenues.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        };
      }),
    removeRevenue: (id: string) =>
      setState((prev) => {
        if (!prev) return prev;
        const closingMonth = previousMonthKey(monthKey(prev.currentDate));
        return {
          ...prev,
          revenues: prev.revenues.map((item) =>
            item.id === id
              ? {
                  ...item,
                  endMonth:
                    item.endMonth && item.endMonth < closingMonth ? item.endMonth : closingMonth,
                }
              : item
          ),
        };
      }),
    updateInstallment: (id: string, updates: Partial<Installment>) =>
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          installments: prev.installments.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        };
      }),
    removeInstallment: (id: string) =>
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          installments: prev.installments.filter((item) => item.id !== id),
          monthOverrides: prev.monthOverrides.filter(
            (override) =>
              !(override.type === OVERRIDE_TYPES.INSTALLMENT_PAYMENT && override.itemId === id)
          ),
        };
      }),
    upsertMonthOverride: ({
      type,
      itemId,
      monthKey: overrideMonthKey,
      amount,
      name,
      hidden,
      paid,
    }: {
      type: OverrideType;
      itemId: string;
      monthKey: string;
      amount?: number;
      name?: string;
      hidden?: boolean;
      paid?: boolean;
    }) =>
      setState((prev) => {
        if (!prev) return prev;
        const idx = prev.monthOverrides.findIndex(
          (override) =>
            override.type === type &&
            override.itemId === itemId &&
            override.monthKey === overrideMonthKey
        );

        const cleaned = {
          ...(amount !== undefined ? { amount: Number(amount) } : {}),
          ...(name !== undefined ? { name } : {}),
          ...(hidden !== undefined ? { hidden } : {}),
          ...(typeof paid === 'boolean' ? { paid } : {}),
        };

        if (idx === -1) {
          return {
            ...prev,
            monthOverrides: [
              ...prev.monthOverrides,
              {
                id: createFinanceId('ovr'),
                type,
                itemId,
                monthKey: overrideMonthKey,
                ...cleaned,
              },
            ],
          };
        }

        const nextOverrides = [...prev.monthOverrides];
        nextOverrides[idx] = { ...nextOverrides[idx], ...cleaned };
        return { ...prev, monthOverrides: nextOverrides };
      }),
    clearMonthOverride: ({
      type,
      itemId,
      monthKey: overrideMonthKey,
    }: {
      type: OverrideType;
      itemId: string;
      monthKey: string;
    }) =>
      setState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          monthOverrides: prev.monthOverrides.filter(
            (override) =>
              !(
                override.type === type &&
                override.itemId === itemId &&
                override.monthKey === overrideMonthKey
              )
          ),
        };
      }),
  };
}
