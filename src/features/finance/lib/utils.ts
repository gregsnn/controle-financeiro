export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

import { currencyFormatter, formatCurrency } from './currency';

export const currency = currencyFormatter;

export function formatMoney(value: unknown): string {
  return formatCurrency(value);
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
