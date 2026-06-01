import { Plus } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { formatMoney } from '../lib/utils';

interface RuleSectionItem {
  name: string;
  amount?: number;
  installmentValue?: number;
}

interface RuleSectionProps<TItem extends RuleSectionItem> {
  title: string;
  description: string;
  items: TItem[];
  renderItem: (item: TItem, money: (value: number) => string) => ReactNode;
  emptyText: string;
  columns?: string[];
  addLabel?: string;
  onAddClick: () => void;
  sortBy?: 'name' | 'value-asc' | 'value-desc';
  topContent?: ReactNode;
  className?: string;
}

export default function RuleSection<TItem extends RuleSectionItem>({
  title,
  description,
  items,
  renderItem,
  emptyText,
  columns = ['Nome', 'Valor', 'Início', 'Status'],
  addLabel = '+ Adicionar',
  onAddClick,
  sortBy = 'name',
  topContent,
  className = '',
}: RuleSectionProps<TItem>) {
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
  const [descriptionText, descriptionMetric] = description.includes(' - ')
    ? description.split(' - ')
    : [description, ''];
  const normalizedAddLabel = addLabel.replace(/^\+\s*/, '');

  return (
    <section className={`section ${className}`.trim()}>
      <div className="sec-header">
        <div>
          <p className="sec-title">{title}</p>
          {descriptionText || descriptionMetric ? (
            <p className="sec-description">
              {descriptionText}
              {descriptionMetric ? (
                <>
                  {' '}
                  - <span>{descriptionMetric}</span>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="sec-actions">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'name' | 'value-asc' | 'value-desc')}
            className="sort-select"
          >
            <option value="name">Nome A-Z</option>
            <option value="value-asc">Menor valor</option>
            <option value="value-desc">Maior valor</option>
          </select>
          <button type="button" className="add-btn add-btn--primary" onClick={onAddClick}>
            <Plus size={13} strokeWidth={2.4} aria-hidden />
            {normalizedAddLabel}
          </button>
        </div>
      </div>

      {topContent}

      <div className="card rule-table-card">
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
          <div className="rule-empty-state">{emptyText}</div>
        )}
      </div>
    </section>
  );
}
