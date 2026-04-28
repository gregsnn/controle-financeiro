import { CATEGORIES, ICONS } from '../../../domain/constants';
import type { FixedExpense } from '../../../domain/types';
import { formatStartMonth } from '../../../lib/utils';
import { RowActions } from '../shared/RowActions';

interface FixedExpenseRowProps {
  item: FixedExpense;
  money: (value: number) => string;
  isPaid: boolean;
  onTogglePaid: (itemId: string, paid: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

function resolvePaymentMethod(item: FixedExpense) {
  if (item.paymentMethod === 'cartao' && item.card) return item.card;
  return item.paymentMethod || 'boleto';
}

export function FixedExpenseRow({ item, money, isPaid, onTogglePaid, onEdit, onDelete }: FixedExpenseRowProps) {
  return (
    <tr>
      <td>{item.name}</td>
      <td>{money(item.amount)}</td>
      <td>{ICONS[resolvePaymentMethod(item)] || '💳'}</td>
      <td>{CATEGORIES[item.category] || '📦 OUTRO'}</td>
      <td>{item.dueDay ? `Dia ${item.dueDay}` : '-'}</td>
      <td>{formatStartMonth(item.startMonth)}</td>
      <td>
        <input
          type="checkbox"
          checked={isPaid}
          onChange={(e) => onTogglePaid(item.id, e.target.checked)}
          aria-label={`Marcar ${item.name} como pago no mês`}
        />
      </td>
      <td>
        <RowActions onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  );
}