import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { emptyFinanceState } from '../lib/schema';
import { loadFinanceState, saveFinanceState } from '../lib/storage';
import { monthKey } from '../lib/utils';
import { buildMonthView } from '../selectors/buildMonth';
import { createActions, normalizeFixedExpense, normalizeInstallment, migrateLegacyCardBills } from '../domain/actions';

const FinanceContext = createContext(null);

export function FinanceProvider({ children }) {
  const [state, setState] = useState(emptyFinanceState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const loadedRaw = await loadFinanceState();
        const loaded = migrateLegacyCardBills(loadedRaw);
        if (!cancelled) {
          setState((prev) => ({
            ...prev,
            ...loaded,
            fixedExpenses: (loaded.fixedExpenses || []).map(normalizeFixedExpense),
            installments: (loaded.installments || []).map(normalizeInstallment),
          }));
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    saveFinanceState(state).catch(() => {
    });
  }, [isReady, state]);

  useEffect(() => {
    document.body.dataset.theme = state.settings.theme || 'default';
  }, [state.settings.theme]);

  const monthView = useMemo(() => buildMonthView(state, state.currentDate), [state]);
  const currentKey = monthKey(state.currentDate);

  const actions = useMemo(
    () => createActions(state, setState, state.currentDate),
    [state.currentDate]
  );

  const value = useMemo(
    () => ({
      isReady,
      currentDate: state.currentDate,
      currentKey,
      monthView,
      fixedExpenses: state.fixedExpenses,
      installments: state.installments,
      revenues: state.revenues,
      monthOverrides: state.monthOverrides,
      settings: state.settings,
      meta: state.meta,
      ...actions,
    }),
    [
      actions,
      currentKey,
      isReady,
      monthView,
      state.currentDate,
      state.fixedExpenses,
      state.installments,
      state.meta,
      state.monthOverrides,
      state.revenues,
      state.settings,
    ]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used inside FinanceProvider');
  return context;
}