import type { Revenue } from '../../../domain/types';
import { formatMoneyInput } from '../../../lib/moneyInput';
import { RowActions } from '../shared/RowActions';

interface RevenueRowProps {
  item: Revenue & { received?: boolean };
  money: (value: number) => string;
  displayAmount: number;
  tempValue?: string;
  hasOverride: boolean;
  onMonthAmountInput: (itemId: string, value: string | HTMLInputElement) => void;
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
  const paymentLabel = item.paymentDay ? `Dia ${item.paymentDay}` : 'Sem dia definido';
  const statusLabel = item.received ? 'Recebido' : 'Previsto';
  const recurringLabel = item.recurring === false ? 'Não recorrente' : 'Recorrente';

  return (
    <tr>
      <td>
        <span className="desktop-cell-value">{item.name}</span>
        <div className="mobile-finance-item">
          <div className="mobile-finance-main">
            <div>
              <strong>{item.name}</strong>
              <span>
                {paymentLabel} · {statusLabel}
              </span>
            </div>
            <p>{money(displayAmount)}</p>
          </div>
          <details className="mobile-finance-details">
            <summary>Detalhes</summary>
            <dl>
              <div>
                <dt>Recorrência</dt>
                <dd>{recurringLabel}</dd>
              </div>
              <div>
                <dt>Valor do mês</dt>
                <dd>
                  <div className="month-amount-cell">
                    <input
                      type="text"
                      className={`month-amount-input ${hasOverride ? 'has-override' : ''}`}
                      value={tempValue !== undefined ? tempValue : formatMoneyInput(displayAmount)}
                      onChange={(e) => onMonthAmountInput(item.id, e.target)}
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
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <button
                    type="button"
                    className={`installment-paid-toggle ${item.received ? 'paid' : 'pending'}`}
                    onClick={onToggleReceived}
                    aria-pressed={item.received === true}
                    aria-label={`${statusLabel} ${item.name} pelo card mobile`}
                  >
                    {statusLabel}
                  </button>
                </dd>
              </div>
            </dl>
            <RowActions
              onEdit={onEdit}
              onDelete={onDelete}
              ariaContext={`${item.name} pelo card mobile`}
            />
          </details>
        </div>
      </td>
      <td>{item.paymentDay ? `Dia ${item.paymentDay}` : '-'}</td>
      <td>{item.recurring === false ? 'Não' : 'Sim'}</td>
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
            onChange={(e) => onMonthAmountInput(item.id, e.target)}
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
