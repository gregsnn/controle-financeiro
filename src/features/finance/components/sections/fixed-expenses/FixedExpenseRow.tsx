import type { FixedExpense } from '../../../domain/types';
import { formatMoneyInput } from '../../../lib/moneyInput';
import { resolvePaymentMethod } from '../../../lib/utils';
import { CATEGORY_LABELS } from '../../../ui/constants';
import { RowActions } from '../shared/RowActions';

interface FixedExpenseRowProps {
  item: FixedExpense;
  money: (value: number) => string;
  displayAmount: number;
  tempValue?: string;
  hasOverride: boolean;
  isPaid: boolean;
  onMonthAmountInput: (itemId: string, value: string) => void;
  onMonthAmountBlur: (item: Pick<FixedExpense, 'id' | 'amount'>) => void;
  onMonthAmountChange: (itemId: string, amount: string | null) => void;
  onTogglePaid: (itemId: string, paid: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  cardLabelMap?: Record<string, string>;
}

export function FixedExpenseRow({
  item,
  money,
  displayAmount,
  tempValue,
  hasOverride,
  isPaid,
  onMonthAmountInput,
  onMonthAmountBlur,
  onMonthAmountChange,
  onTogglePaid,
  onEdit,
  onDelete,
  cardLabelMap,
}: FixedExpenseRowProps) {
  const methodOrCard = resolvePaymentMethod(item);
  const paymentLabel =
    item.paymentMethod === 'cartao' && item.card
      ? cardLabelMap?.[item.card] || item.card
      : methodOrCard === 'pix'
        ? 'Pix'
        : methodOrCard === 'boleto'
          ? 'Boleto'
          : 'Cartao';
  const categoryLabel = CATEGORY_LABELS[item.category] || 'OUTRO';

  return (
    <tr>
      <td>{item.name}</td>
      <td>{categoryLabel}</td>
      <td>{paymentLabel}</td>
      <td>{item.dueDay ? `Dia ${item.dueDay}` : '-'}</td>
      <td>
        <div className="month-amount-cell">
          <input
            type="text"
            className={`month-amount-input ${hasOverride ? 'has-override' : ''}`}
            value={tempValue !== undefined ? tempValue : formatMoneyInput(displayAmount)}
            onChange={(e) => onMonthAmountInput(item.id, e.target.value)}
            onBlur={() => onMonthAmountBlur(item)}
            inputMode="numeric"
            autoComplete="off"
            placeholder={money(item.amount)}
          />
          {hasOverride ? (
            <button
              type="button"
              className="clear-override"
              onClick={() => onMonthAmountChange(item.id, null)}
              title="Restaurar valor original"
            >
              x
            </button>
          ) : null}
        </div>
      </td>
      <td>
        <label className={`table-status-toggle ${isPaid ? 'paid' : 'pending'}`}>
          <input
            type="checkbox"
            checked={isPaid}
            onChange={(e) => onTogglePaid(item.id, e.target.checked)}
            aria-label={`Marcar ${item.name} como pago no mes`}
          />
          <span>{isPaid ? 'Pago' : 'Pendente'}</span>
        </label>
      </td>
      <td>
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  );
}
