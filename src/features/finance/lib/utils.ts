export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

import type { FixedExpense } from '../domain/types';

import { currencyFormatter, formatCurrency } from './currency';

export const currency = currencyFormatter;

export function formatMoney(value: unknown): string {
  return formatCurrency(value);
}

export function resolvePaymentMethod(item: Pick<FixedExpense, 'paymentMethod' | 'card'>) {
  if (item.paymentMethod === 'cartao' && item.card) return item.card;
  return item.paymentMethod || 'boleto';
}

export function monthKey(date?: Date | null): string {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function monthLabel(date: Date): string {
  return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
}

export function previousMonthKey(key: string): string {
  const date = new Date(`${key}-01T00:00:00`);
  date.setMonth(date.getMonth() - 1);
  return monthKey(date);
}

export function softDeleteItem<T extends Record<string, unknown>>(
  item: T,
  currentDate: Date,
  dateField = 'endMonth'
): T {
  const closingMonth = previousMonthKey(new Date(currentDate).toISOString().slice(0, 7));
  const currentValue = item[dateField];
  return {
    ...item,
    [dateField]:
      typeof currentValue === 'string' && currentValue < closingMonth ? currentValue : closingMonth,
  };
}

export function isMonthInRange(
  monthKeyValue: string,
  startMonth: string | null,
  endMonth: string | null
): boolean {
  if (startMonth && monthKeyValue < startMonth) return false;
  if (endMonth && monthKeyValue > endMonth) return false;
  return true;
}

export function formatStartMonth(monthKeyValue: string | null): string {
  if (!monthKeyValue) return '-';
  const [year, month] = monthKeyValue.split('-');
  const monthNames = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  const monthName = monthNames[parseInt(month, 10) - 1] || month;
  return `${monthName}/${year}`;
}
