import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { createActions } from '../domain/actions';
import type { FinanceState, MonthView, FixedExpense, Installment, Revenue, MonthOverride, Settings, Meta, OverrideType } from '../domain/types';
import {
  EMPTY_MONTH_VIEW,
  useDerivedFinanceState,
  useHydrateFinanceState,
  usePersistFinanceState,
  useThemeSync,
} from './financeContextInternals';

interface FinanceContextValue {
  isReady: boolean;
  currentDate: Date;
  currentKey: string;
  monthView: MonthView;
  fixedExpenses: FixedExpense[];
  installments: Installment[];
  revenues: Revenue[];
  monthOverrides: MonthOverride[];
  settings: Settings;
  meta: Meta;
  changeMonth: (step: number) => void;
  resetDatabase: () => Promise<void>;
  setTheme: (theme: 'default' | 'premium') => void;
  setCardBills: (cardBills: Settings['cardBills']) => void;
  addFixedExpense: (data: Partial<FixedExpense>) => void;
  addRevenue: (data: Partial<Revenue>) => void;
  addInstallment: (data: Partial<Installment>) => void;
  updateFixedExpense: (id: string, updates: Partial<FixedExpense>) => void;
  removeFixedExpense: (id: string) => void;
  updateRevenue: (id: string, updates: Partial<Revenue>) => void;
  removeRevenue: (id: string) => void;
  updateInstallment: (id: string, updates: Partial<Installment>) => void;
  removeInstallment: (id: string) => void;
  upsertMonthOverride: (params: {
    type: OverrideType;
    itemId: string;
    monthKey: string;
    amount?: number;
    name?: string;
    hidden?: boolean;
    paid?: boolean;
  }) => void;
  clearMonthOverride: (params: {
    type: OverrideType;
    itemId: string;
    monthKey: string;
  }) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

interface FinanceProviderProps {
  children: ReactNode;
}

export function FinanceProvider({ children }: FinanceProviderProps) {
  const [state, setState] = useState<FinanceState | null>(null);
  const [isReady, setIsReady] = useState(false);

  useHydrateFinanceState(setState, setIsReady);
  usePersistFinanceState(state, isReady);
  useThemeSync(state?.settings?.theme);
  const { monthView, currentKey } = useDerivedFinanceState(state);

  const actions = useMemo(() => {
    if (!state) return {} as FinanceContextValue;
    return createActions(state, setState as Dispatch<SetStateAction<FinanceState | null>>, state.currentDate);
  }, [state]);

  const defaultValue = useMemo<FinanceContextValue>(
    () => ({
      isReady: false,
      currentDate: new Date(),
      currentKey: '',
      monthView: EMPTY_MONTH_VIEW,
      fixedExpenses: [],
      installments: [],
      revenues: [],
      monthOverrides: [],
      settings: { theme: 'default' },
      meta: { schemaVersion: 3, createdAt: new Date(), lastResetAt: null },
      changeMonth: () => {},
      resetDatabase: async () => {},
      setTheme: () => {},
      setCardBills: () => {},
      addFixedExpense: () => {},
      addRevenue: () => {},
      addInstallment: () => {},
      updateFixedExpense: () => {},
      removeFixedExpense: () => {},
      updateRevenue: () => {},
      removeRevenue: () => {},
      updateInstallment: () => {},
      removeInstallment: () => {},
      upsertMonthOverride: () => {},
      clearMonthOverride: () => {},
    }),
    []
  );

  const value = useMemo((): FinanceContextValue => {
    if (!state) return defaultValue;

    return {
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
      changeMonth: actions.changeMonth,
      resetDatabase: actions.resetDatabase,
      setTheme: actions.setTheme,
      setCardBills: actions.setCardBills,
      addFixedExpense: actions.addFixedExpense,
      addRevenue: actions.addRevenue,
      addInstallment: actions.addInstallment,
      updateFixedExpense: actions.updateFixedExpense,
      removeFixedExpense: actions.removeFixedExpense,
      updateRevenue: actions.updateRevenue,
      removeRevenue: actions.removeRevenue,
      updateInstallment: actions.updateInstallment,
      removeInstallment: actions.removeInstallment,
      upsertMonthOverride: actions.upsertMonthOverride,
      clearMonthOverride: actions.clearMonthOverride,
    };
  }, [actions, currentKey, isReady, monthView, state, defaultValue]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used inside FinanceProvider');
  return context;
}