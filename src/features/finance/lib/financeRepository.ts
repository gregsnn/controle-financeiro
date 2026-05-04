import type { FinanceState } from '../domain/types';

export interface IFinanceRepository {
  loadState(): Promise<FinanceState>;
  saveState(state: FinanceState | null): Promise<void>;
  reset(): Promise<void>;
}
