import { useEffect, useMemo } from 'react';
import { emptyFinanceState } from '../lib/schema';
import { loadFinanceState, saveFinanceState } from '../lib/storage';
import { monthKey } from '../lib/utils';
import { buildMonthView } from '../selectors/buildMonth';
import {
  migrateLegacyCardBills,
  normalizeFixedExpense,
  normalizeInstallment,
  normalizeRevenue,
} from '../domain/actions';
import type { Dispatch, SetStateAction } from 'react';
import type { FinanceState, MonthView, FixedExpense, Installment, Revenue } from '../domain/types';

export const EMPTY_MONTH_VIEW: MonthView = {
  fixedExpenses: [],
  installments: [],
  revenues: [],
  totals: { receitas: 0, despesasFixas: 0, installments: 0 },
};

export function useHydrateFinanceState(
  setState: Dispatch<SetStateAction<FinanceState | null>>,
  setIsReady: Dispatch<SetStateAction<boolean>>
) {
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const loadedRaw = await loadFinanceState();
        const loaded = migrateLegacyCardBills(loadedRaw as unknown as Record<string, unknown>);
        if (!cancelled) {
          setState((prev) => {
            const base = prev || emptyFinanceState();
            const loadedState = loaded as unknown as FinanceState;
            const loadedSettings = loadedState.settings || {};
            return {
              ...base,
              ...loadedState,
              fixedExpenses: (loadedState.fixedExpenses || []).map((item: FixedExpense) =>
                normalizeFixedExpense(item as unknown as Record<string, unknown>)
              ),
              installments: (loadedState.installments || []).map((item: Installment) =>
                normalizeInstallment(item as unknown as Record<string, unknown>)
              ),
              revenues: (loadedState.revenues || []).map((item: Revenue) =>
                normalizeRevenue(item as unknown as Record<string, unknown>)
              ),
               settings: {
                 ...base.settings,
                 ...loadedSettings,
                 cardBills: loadedSettings.cardBills || [],
               },
            };
          });
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [setIsReady, setState]);
}

export function usePersistFinanceState(state: FinanceState | null, isReady: boolean) {
  useEffect(() => {
    if (!isReady || !state) return;
    saveFinanceState(state).catch(() => {});
  }, [isReady, state]);
}

export function useThemeSync(theme: FinanceState['settings']['theme'] | undefined) {
  useEffect(() => {
    if (theme) {
      document.body.dataset.theme = theme;
    }
  }, [theme]);
}

export function useDerivedFinanceState(state: FinanceState | null) {
  const monthView = useMemo(() => {
    if (!state) return EMPTY_MONTH_VIEW;
    return buildMonthView(state, state.currentDate);
  }, [state]);

  const currentKey = monthKey(state?.currentDate || new Date());

  return { monthView, currentKey };
}
