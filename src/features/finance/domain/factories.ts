import { createFinanceId } from '../lib/ids';
import type { FixedExpense, Installment, Revenue, VariableExpense } from './types';

export function createDefaultFixedExpense(data: Partial<FixedExpense>): FixedExpense {
  return {
    id: createFinanceId('fixed'),
    active: true,
    notes: '',
    endMonth: null,
    ...data,
  } as FixedExpense;
}

export function createDefaultRevenue(data: Partial<Revenue>): Revenue {
  return {
    id: createFinanceId('rev'),
    active: true,
    recurring: true,
    paymentDay: null,
    notes: '',
    endMonth: null,
    ...data,
  } as Revenue;
}

export function createDefaultInstallment(data: Partial<Installment>): Installment {
  return {
    id: createFinanceId('inst'),
    active: true,
    closedAt: null,
    currentInstallment: 1,
    ...data,
  } as Installment;
}

export function createDefaultVariableExpense(data: Partial<VariableExpense>): VariableExpense {
  return {
    id: createFinanceId('var'),
    name: '',
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    monthKey: new Date().toISOString().slice(0, 7),
    category: 'outro',
    paymentMethod: 'pix',
    card: null,
    paid: true,
    notes: '',
    ...data,
  } as VariableExpense;
}
