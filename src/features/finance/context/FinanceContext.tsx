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
import type {
  FinanceState,
  FixedExpense,
  Installment,
  Meta,
  MonthOverride,
  MonthView,
  OverrideType,
  Revenue,
  Settings,
  VariableExpense,
} from '../domain/types';
import {
  useDerivedFinanceState,
  useHydrateFinanceState,
  usePersistFinanceState,
  useThemeSync,
} from './financeContextInternals';

interface FinanceStateValue {
  fixedExpenses: FixedExpense[];
  variableExpenses: VariableExpense[];
  installments: Installment[];
  revenues: Revenue[];
  monthOverrides: MonthOverride[];
  settings: Settings;
  meta: Meta;
}

interface FinanceDerivedValue {
  isReady: boolean;
  currentDate: Date;
  currentKey: string;
  monthView: MonthView;
}

interface FinanceActionsValue {
  changeMonth: (step: number) => void;
  resetDatabase: () => Promise<void>;
  importFinanceState: (state: FinanceState) => void;
  setTheme: (theme: 'default' | 'premium') => void;
  setCardBills: (cardBills: Settings['cardBills']) => void;
  addFixedExpense: (data: Partial<FixedExpense>) => void;
  addVariableExpense: (data: Partial<VariableExpense>) => void;
  addRevenue: (data: Partial<Revenue>) => void;
  addInstallment: (data: Partial<Installment>) => void;
  updateFixedExpense: (id: string, updates: Partial<FixedExpense>) => void;
  updateVariableExpense: (id: string, updates: Partial<VariableExpense>) => void;
  removeFixedExpense: (id: string) => void;
  removeVariableExpense: (id: string) => void;
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
  clearMonthOverride: (params: { type: OverrideType; itemId: string; monthKey: string }) => void;
}

interface FinanceContextValue extends FinanceStateValue, FinanceDerivedValue, FinanceActionsValue {}

const FinanceStateContext = createContext<FinanceStateValue | null>(null);
const FinanceDerivedContext = createContext<FinanceDerivedValue | null>(null);
const FinanceActionsContext = createContext<FinanceActionsValue | null>(null);

// Backward compatibility context that combines all three
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
    if (!state) return {} as FinanceActionsValue;
    return createActions(
      state,
      setState as Dispatch<SetStateAction<FinanceState | null>>,
      state.currentDate
    );
  }, [state]);

  // Default values for when state is not ready
  const defaultState = useMemo<FinanceStateValue>(
    () => ({
      fixedExpenses: [],
      variableExpenses: [],
      installments: [],
      revenues: [],
      monthOverrides: [],
      settings: { theme: 'default' },
      meta: { schemaVersion: 5, createdAt: new Date(), lastResetAt: null },
    }),
    []
  );

  const defaultActions = useMemo<FinanceActionsValue>(
    () => ({
      changeMonth: () => {},
      resetDatabase: async () => {},
      importFinanceState: () => {},
      setTheme: () => {},
      setCardBills: () => {},
      addFixedExpense: () => {},
      addVariableExpense: () => {},
      addRevenue: () => {},
      addInstallment: () => {},
      updateFixedExpense: () => {},
      updateVariableExpense: () => {},
      removeFixedExpense: () => {},
      removeVariableExpense: () => {},
      updateRevenue: () => {},
      removeRevenue: () => {},
      updateInstallment: () => {},
      removeInstallment: () => {},
      upsertMonthOverride: () => {},
      clearMonthOverride: () => {},
    }),
    []
  );

  // Memoize each context value separately to prevent unnecessary re-renders
  const stateValue = useMemo<FinanceStateValue>(() => {
    if (!state) return defaultState;
    return {
      fixedExpenses: state.fixedExpenses,
      variableExpenses: state.variableExpenses || [],
      installments: state.installments,
      revenues: state.revenues,
      monthOverrides: state.monthOverrides,
      settings: state.settings,
      meta: state.meta,
    };
  }, [defaultState, state]);

  const derivedValue = useMemo<FinanceDerivedValue>(() => {
    return {
      isReady,
      currentDate: state?.currentDate ?? new Date(),
      currentKey,
      monthView,
    };
  }, [isReady, state?.currentDate, currentKey, monthView]);

  const actionsValue = useMemo<FinanceActionsValue>(() => {
    if (!actions || Object.keys(actions).length === 0) return defaultActions;
    return {
      changeMonth: actions.changeMonth,
      resetDatabase: actions.resetDatabase,
      importFinanceState: actions.importFinanceState,
      setTheme: actions.setTheme,
      setCardBills: actions.setCardBills,
      addFixedExpense: actions.addFixedExpense,
      addVariableExpense: actions.addVariableExpense,
      addRevenue: actions.addRevenue,
      addInstallment: actions.addInstallment,
      updateFixedExpense: actions.updateFixedExpense,
      updateVariableExpense: actions.updateVariableExpense,
      removeFixedExpense: actions.removeFixedExpense,
      removeVariableExpense: actions.removeVariableExpense,
      updateRevenue: actions.updateRevenue,
      removeRevenue: actions.removeRevenue,
      updateInstallment: actions.updateInstallment,
      removeInstallment: actions.removeInstallment,
      upsertMonthOverride: actions.upsertMonthOverride,
      clearMonthOverride: actions.clearMonthOverride,
    };
  }, [actions, defaultActions]);

  // Combined value for backward compatibility
  const value = useMemo((): FinanceContextValue => {
    return {
      ...stateValue,
      ...derivedValue,
      ...actionsValue,
    };
  }, [stateValue, derivedValue, actionsValue]);

  return (
    <FinanceStateContext.Provider value={stateValue}>
      <FinanceDerivedContext.Provider value={derivedValue}>
        <FinanceActionsContext.Provider value={actionsValue}>
          <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
        </FinanceActionsContext.Provider>
      </FinanceDerivedContext.Provider>
    </FinanceStateContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used inside FinanceProvider');
  return context;
}
