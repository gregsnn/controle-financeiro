import { useMemo } from 'react';
import { OVERRIDE_TYPES } from '../../domain/constants';
import type { CardBillItem, FixedExpense } from '../../domain/types';
import { useActiveFixedExpenses } from '../../hooks/useActiveFixedExpenses';
import { useCardList } from '../../hooks/useCardList';
import { useMonthPaymentMap } from '../../hooks/useMonthPaymentMap';
import { useI18n } from '../../lib/i18n';
import { formatMoney } from '../../lib/utils';
import { selectMonthFixedExpenseAmounts } from '../../selectors/monthOverrideSelectors';
import { FixedExpenseForm, type FixedExpenseFormState } from './fixed-expenses/FixedExpenseForm';
import { buildFixedExpensePayload } from './fixed-expenses/fixedExpenseFormHelpers';
import { FixedExpenseRow } from './fixed-expenses/FixedExpenseRow';
import { FIXED_EXPENSE_LABELS } from './fixed-expenses/fixedExpenseSectionLabels';
import { useFixedExpenseCrudState } from './fixed-expenses/useFixedExpenseCrudState';
import { CrudSection } from './shared/CrudSection';
import type { CrudSectionCommonProps, MonthPaidSectionProps } from './shared/types';
import { useMonthAmountInput } from './shared/useMonthAmountInput';

type FixedExpensePayload = {
  name: string;
  amount: number;
  dueDay: number | null;
  startMonth: string;
  paymentMethod: string;
  card: string | null;
  category: string;
};

type FixedExpensesSectionProps = CrudSectionCommonProps<FixedExpense, FixedExpensePayload> &
  MonthPaidSectionProps & {
    cardList?: CardBillItem[];
    onMonthFixedExpenseAmount?: (itemId: string, amount: number | null) => void;
  };

export function FixedExpensesSection({
  items,
  currentMonthKey,
  monthOverrides,
  onAdd,
  onEdit,
  onDelete,
  onTogglePaid,
  onMonthFixedExpenseAmount,
  cardList,
}: FixedExpensesSectionProps) {
  const { normalizeCardName } = useI18n();
  const cards = useCardList(cardList);

  const cardLabelMap = useMemo(
    () =>
      cards.reduce(
        (acc, card) => {
          acc[card.id] = normalizeCardName(card.name);
          return acc;
        },
        {} as Record<string, string>
      ),
    [cards, normalizeCardName]
  );

  const activeItems = useActiveFixedExpenses(items, currentMonthKey);
  const fixedTotal = activeItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const fixedLabels = useMemo(
    () => ({
      ...FIXED_EXPENSE_LABELS,
      description: `${activeItems.length} lancamento${activeItems.length === 1 ? '' : 's'} - ${formatMoney(fixedTotal)}`,
    }),
    [activeItems.length, fixedTotal]
  );

  const { form, setForm, canSubmit, openCreateForm, openEditForm, resetForm } =
    useFixedExpenseCrudState({
      currentMonthKey,
      defaultCardId: cards[0]?.id || '',
      onDelete,
    });

  const monthPaymentMap = useMonthPaymentMap(
    monthOverrides,
    currentMonthKey,
    OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT
  );
  const monthFixedExpenseAmounts = useMemo(
    () => selectMonthFixedExpenseAmounts(monthOverrides, currentMonthKey),
    [currentMonthKey, monthOverrides]
  );

  const buildPayload = (currentForm: FixedExpenseFormState) =>
    buildFixedExpensePayload(currentForm, cards);

  const {
    tempInputValues,
    handleMonthAmountChange,
    handleMonthAmountInput,
    handleMonthAmountBlur,
  } = useMonthAmountInput(onMonthFixedExpenseAmount);

  return (
    <CrudSection
      className="expense-content-section"
      labels={fixedLabels}
      items={activeItems}
      form={form}
      canSubmit={canSubmit}
      resetForm={resetForm}
      openCreateForm={openCreateForm}
      openEditForm={openEditForm}
      buildPayload={buildPayload}
      onAdd={(payload) => onAdd(payload!)}
      onEdit={(id, payload) => onEdit(id, payload!)}
      onDelete={onDelete}
      renderForm={() => <FixedExpenseForm form={form} setForm={setForm} cards={cards} />}
      renderItem={(item, money, { openEdit, openDelete }) => {
        const hasOverride =
          monthFixedExpenseAmounts && monthFixedExpenseAmounts[item.id] !== undefined;

        return (
          <FixedExpenseRow
            key={item.id}
            item={item}
            money={money}
            displayAmount={hasOverride ? monthFixedExpenseAmounts[item.id] : item.amount}
            tempValue={tempInputValues[item.id]}
            hasOverride={hasOverride}
            isPaid={monthPaymentMap.get(item.id)?.paid === true}
            cardLabelMap={cardLabelMap}
            onMonthAmountInput={handleMonthAmountInput}
            onMonthAmountBlur={handleMonthAmountBlur}
            onMonthAmountChange={handleMonthAmountChange}
            onTogglePaid={onTogglePaid}
            onEdit={() => openEdit(item)}
            onDelete={() => openDelete(item)}
          />
        );
      }}
    />
  );
}
