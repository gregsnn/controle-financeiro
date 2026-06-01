import type { Revenue } from '../../domain/types';
import { useActiveRevenues } from '../../hooks/useActiveRevenues';
import { formatMoney } from '../../lib/utils';
import { RevenueForm, type RevenueFormState } from './revenues/RevenueForm';
import { RevenueRow } from './revenues/RevenueRow';
import {
  buildRevenuePayload,
  toRevenueCreateItem,
  toRevenueEditItem,
} from './revenues/revenueFormHelpers';
import { REVENUE_LABELS } from './revenues/revenueSectionLabels';
import { useRevenueCrudState } from './revenues/useRevenueCrudState';
import { CrudSection } from './shared/CrudSection';
import type { CrudSectionCommonProps } from './shared/types';
import { useRevenueMonthAmountInput } from './shared/useRevenueMonthAmountInput';

type RevenuePayload = {
  name: string;
  amount: number;
  startMonth: string;
  paymentDay: number | null;
  recurring: boolean;
};
type RevenuesSectionProps = CrudSectionCommonProps<Revenue, RevenuePayload> & {
  currentMonthKey: string;
  monthRevenueAmounts: Record<string, number>;
  onMonthRevenueAmount?: (itemId: string, amount: number | null) => void;
};

export function RevenuesSection({
  items,
  currentMonthKey,
  monthRevenueAmounts,
  onAdd,
  onEdit,
  onDelete,
  onMonthRevenueAmount,
}: RevenuesSectionProps) {
  const { form, setForm, canSubmit, openCreateForm, openEditForm, resetForm } = useRevenueCrudState(
    {
      currentMonthKey,
      onDelete,
    }
  );

  const activeItems = useActiveRevenues(items, currentMonthKey);
  const totalRevenue = activeItems.reduce((sum, item) => {
    const amount =
      monthRevenueAmounts && monthRevenueAmounts[item.id] !== undefined
        ? monthRevenueAmounts[item.id]
        : item.baseAmount;
    return sum + Number(amount || 0);
  }, 0);
  const today = new Date();
  const [currentYear, currentMonth] = currentMonthKey.split('-').map(Number);
  const selectedMonthIndex = new Date(currentYear, currentMonth - 1, 1).getTime();
  const realMonthIndex = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  const receivedTotal = activeItems.reduce((sum, item) => {
    const amount =
      monthRevenueAmounts && monthRevenueAmounts[item.id] !== undefined
        ? monthRevenueAmounts[item.id]
        : item.baseAmount;
    const paymentDay = item.paymentDay || 1;
    const received =
      selectedMonthIndex < realMonthIndex ||
      (selectedMonthIndex === realMonthIndex && paymentDay <= today.getDate());
    return received ? sum + Number(amount || 0) : sum;
  }, 0);
  const pendingTotal = Math.max(0, totalRevenue - receivedTotal);

  const buildPayload = (currentForm: RevenueFormState) =>
    buildRevenuePayload(currentForm, currentMonthKey);

  const {
    tempInputValues,
    handleMonthAmountChange,
    handleMonthAmountInput,
    handleMonthAmountBlur,
  } = useRevenueMonthAmountInput(onMonthRevenueAmount);

  return (
    <CrudSection
      className="revenues-section"
      labels={REVENUE_LABELS}
      items={activeItems}
      form={form}
      canSubmit={canSubmit}
      resetForm={resetForm}
      openCreateForm={openCreateForm}
      openEditForm={openEditForm}
      buildPayload={buildPayload}
      onAdd={(payload) => onAdd(toRevenueCreateItem(payload!))}
      onEdit={(id, payload) => onEdit(id, toRevenueEditItem(payload!))}
      onDelete={onDelete}
      topContent={
        <section className="revenue-summary-row" aria-label="Resumo de receitas">
          <div className="mcard">
            <p className="mcard-label">TOTAL DO MES</p>
            <p className="mcard-val pos">{formatMoney(totalRevenue)}</p>
          </div>
          <div className="mcard">
            <p className="mcard-label">JA RECEBIDO</p>
            <p className="mcard-val">{formatMoney(receivedTotal)}</p>
          </div>
          <div className="mcard">
            <p className="mcard-label">A RECEBER</p>
            <p className="mcard-val info">{formatMoney(pendingTotal)}</p>
          </div>
        </section>
      }
      renderForm={() => <RevenueForm form={form} setForm={setForm} />}
      renderItem={(item, money, { openEdit, openDelete }) => {
        const hasOverride = monthRevenueAmounts && monthRevenueAmounts[item.id] !== undefined;

        return (
          <RevenueRow
            key={item.id}
            item={item}
            money={money}
            displayAmount={hasOverride ? monthRevenueAmounts[item.id] : item.baseAmount}
            tempValue={tempInputValues[item.id]}
            hasOverride={hasOverride}
            onMonthAmountInput={handleMonthAmountInput}
            onMonthAmountBlur={handleMonthAmountBlur}
            onMonthAmountChange={handleMonthAmountChange}
            onEdit={() => openEdit(item)}
            onDelete={() => openDelete(item)}
          />
        );
      }}
    />
  );
}
