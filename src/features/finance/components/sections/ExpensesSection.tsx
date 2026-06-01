import type {
  CardBillItem,
  FixedExpense,
  MonthOverride,
  VariableExpense,
} from '../../domain/types';
import { FixedExpensesSection } from './FixedExpensesSection';
import type { MonthPaidSectionProps } from './shared/types';
import { useState } from 'react';
import { VariableExpensesSection } from './VariableExpensesSection';

type FixedExpensePayload = {
  name: string;
  amount: number;
  dueDay: number | null;
  startMonth: string;
  paymentMethod: string;
  card: string | null;
  category: string;
};

type VariableExpensePayload = {
  name: string;
  amount: number;
  date: string;
  monthKey: string;
  category: string;
  paymentMethod: string;
  card: string | null;
  paid: boolean;
  notes: string;
};

interface ExpensesSectionProps extends MonthPaidSectionProps {
  items: FixedExpense[];
  variableItems: VariableExpense[];
  currentMonthKey: string;
  monthOverrides: MonthOverride[];
  cardList?: CardBillItem[];
  onAdd: (payload: FixedExpensePayload) => void | Promise<void>;
  onEdit: (id: string, payload: FixedExpensePayload) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onAddVariable: (payload: VariableExpensePayload) => void | Promise<void>;
  onEditVariable: (id: string, payload: VariableExpensePayload) => void | Promise<void>;
  onDeleteVariable: (id: string) => void | Promise<void>;
  onToggleVariablePaid: (id: string, paid: boolean) => void | Promise<void>;
  onMonthFixedExpenseAmount?: (itemId: string, amount: number | null) => void;
}

export function ExpensesSection(props: ExpensesSectionProps) {
  const [activeMode, setActiveMode] = useState<'fixed' | 'variable'>('fixed');

  return (
    <section className="expenses-section">
      <div className="expense-mode-tabs" role="tablist" aria-label="Tipos de despesas">
        <button
          type="button"
          className={`expense-mode-tab ${activeMode === 'fixed' ? 'active' : ''}`}
          role="tab"
          aria-selected={activeMode === 'fixed'}
          onClick={() => setActiveMode('fixed')}
        >
          Fixas
        </button>
        <button
          type="button"
          className={`expense-mode-tab ${activeMode === 'variable' ? 'active' : ''}`}
          role="tab"
          aria-selected={activeMode === 'variable'}
          onClick={() => setActiveMode('variable')}
        >
          Variaveis
        </button>
      </div>

      {activeMode === 'fixed' ? (
        <FixedExpensesSection {...props} />
      ) : (
        <VariableExpensesSection
          items={props.variableItems}
          currentMonthKey={props.currentMonthKey}
          cardList={props.cardList}
          onAdd={props.onAddVariable}
          onEdit={props.onEditVariable}
          onDelete={props.onDeleteVariable}
          onTogglePaid={props.onToggleVariablePaid}
        />
      )}
    </section>
  );
}
