import type { FinanceIdPrefix } from '../domain/types';

export function createFinanceId(prefix: FinanceIdPrefix): string {
  const random = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}
