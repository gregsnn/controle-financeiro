import type { Revenue } from '../../../domain/types';
import { formatMoneyInput } from '../../../lib/moneyInput';
import { RowActions } from '../shared/RowActions';

interface RevenueRowProps {
  item: Revenue & { received?: boolean };
  money: (value: number) => string;
  displayAmount: number;
  tempValue?: string;
  hasOverride: boolean;
  onMonthAmountInput: (itemId: string, value: string) => void;
  onMonthAmountBlur: (item: Pick<Revenue, 'id' | 'baseAmount'>) => void;
  onMonthAmountChange: (itemId: string, amount: string | null) => void;
  onToggleReceived: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function RevenueRow({
  item,
  money,
  displayAmount,
  tempValue,
  hasOverride,
  onMonthAmountInput,
  onMonthAmountBlur,
  onMonthAmountChange,
  onToggleReceived,
  onEdit,
  onDelete,
}: RevenueRowProps) {
  return (
    <tr>
      <td>{item.name}</td>
      <td>{item.paymentDay ? `Dia ${item.paymentDay}` : '-'}</td>
      <td>{item.recurring === false ? 'Nao' : 'Sim'}</td>
      <td>
        <button
          type="button"
          className={`installment-paid-toggle ${item.received ? 'paid' : 'pending'}`}
          onClick={onToggleReceived}
          aria-pressed={item.received === true}
        >
          {item.received ? 'Recebido' : 'Previsto'}
        </button>
      </td>
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
            placeholder={money(item.baseAmount)}
          />
          {hasOverride && (
            <button
              type="button"
              className="clear-override"
              onClick={() => onMonthAmountChange(item.id, null)}
              title="Restaurar valor original"
            >
              x
            </button>
          )}
        </div>
      </td>
      <td>
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  );
}
