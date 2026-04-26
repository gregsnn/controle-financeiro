import type { MonthOverride } from '../../../domain/types';

export interface CrudSectionCommonProps<TItem, TPayload> {
  items: TItem[];
  onAdd: (payload: TPayload) => Promise<void> | void;
  onEdit: (id: string, payload: TPayload) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

export interface MonthPaidSectionProps {
  currentMonthKey: string;
  monthOverrides: MonthOverride[];
  onTogglePaid: (itemId: string, paid: boolean) => void;
}
