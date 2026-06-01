import type { InstallmentItem } from '../../../domain/types';
import { formatStartMonth } from '../../../lib/utils';
import { RowActions } from '../shared/RowActions';

interface InstallmentRowProps {
  item: InstallmentItem;
  money: (value: number) => string;
  isPaid: boolean;
  onTogglePaid: (itemId: string, paid: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function InstallmentRow({
  item,
  money,
  isPaid,
  onTogglePaid,
  onEdit,
  onDelete,
}: InstallmentRowProps) {
  return (
    <tr>
      <td>{item.name}</td>
      <td>{money(item.installmentValue)}</td>
      <td>{item.card || 'Sem cartao'}</td>
      <td>{formatStartMonth(item.startMonth)}</td>
      <td>
        <div
          className="progress-cell"
          data-progress={`${item.currentInstallment}/${item.totalInstallments}`}
        >
          <div className="progress-bar">
            <div
              className="progress-fill"
              data-progress={`${item.currentInstallment}/${item.totalInstallments}`}
              style={{
                width: `${(item.currentInstallment / item.totalInstallments) * 100}%`,
              }}
            />
          </div>
        </div>
      </td>
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
