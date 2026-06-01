import { moneyInputFormatter } from './currency';

interface FormatOptions {
  hideNonPositive?: boolean;
}

interface ParseOptions {
  allowZero?: boolean;
}

export function formatMoneyInput(value: unknown, options: FormatOptions = {}): string {
  const { hideNonPositive = false } = options;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '';
  if (hideNonPositive && parsed <= 0) return '';
  return moneyInputFormatter.format(parsed);
}

export function applyMoneyMask(raw: unknown): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  const parsed = Number(digits) / 100;
  return moneyInputFormatter.format(parsed);
}

export function parseMoneyInput(maskedValue: unknown, options: ParseOptions = {}): number | null {
  const { allowZero = true } = options;
  if (maskedValue === null || maskedValue === undefined || maskedValue === '') return null;

  const normalized = String(maskedValue).replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) return null;
  if (!allowZero && parsed <= 0) return null;
  if (allowZero && parsed < 0) return null;
  return parsed;
}
