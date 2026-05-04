import { ReactNode, useState } from 'react';
import { formatMoney } from '../lib/utils';

interface RuleSectionProps {
  title: string;
  description: string;
  items: Array<{ name: string; amount?: number; installmentValue?: number }>;
  renderItem: (
    item: { name: string; amount?: number; installmentValue?: number },
    money: (value: number) => string
  ) => ReactNode;
  emptyText: string;
  columns?: string[];
  addLabel?: string;
  onAddClick: () => void;
  sortBy?: 'name' | 'value-asc' | 'value-desc';
}

export default function RuleSection({
  title,
  description,
  items,
  renderItem,
  emptyText,
  columns = ['Nome', 'Valor', 'Início', 'Status'],
  addLabel = '+ Adicionar',
  onAddClick,
  sortBy = 'name',
}: RuleSectionProps) {
  const [sort, setSort] = useState(sortBy);

  const sortedItems = [...items].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'value-asc')
      return (
        Number(a.amount || a.installmentValue || 0) - Number(b.amount || b.installmentValue || 0)
      );
    if (sort === 'value-desc')
      return (
        Number(b.amount || b.installmentValue || 0) - Number(a.amount || a.installmentValue || 0)
      );
    return 0;
  });

  return (
    <section className="section">
      <div className="sec-header">
        <div>
          <p className="sec-title">{title}</p>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'name' | 'value-asc' | 'value-desc')}
            className="sort-select"
          >
            <option value="name">Nome A-Z</option>
            <option value="value-asc">Menor valor</option>
            <option value="value-desc">Maior valor</option>
          </select>
          <button type="button" className="add-btn" onClick={onAddClick}>
            {addLabel}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '10px', overflow: 'hidden' }}>
        {sortedItems.length ? (
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>{sortedItems.map((item) => renderItem(item, formatMoney))}</tbody>
          </table>
        ) : (
          <div style={{ padding: '14px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            {emptyText}
          </div>
        )}
      </div>
    </section>
  );
}
