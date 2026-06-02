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

function caretAfterDigitCount(value: string, digitCount: number) {
  if (digitCount <= 0) {
    const firstDigitIndex = value.search(/\d/);
    return firstDigitIndex >= 0 ? firstDigitIndex : value.length;
  }

  let seenDigits = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) {
      seenDigits += 1;
      if (seenDigits === digitCount) return index + 1;
    }
  }
  return value.length;
}

function restoreInputCaret(input: HTMLInputElement, caret: number) {
  window.requestAnimationFrame(() => {
    if (document.activeElement !== input) return;
    input.setSelectionRange(caret, caret);
  });
}

export function applyMoneyMaskPreservingCaret(input: HTMLInputElement): string {
  const rawValue = input.value;
  const selectionStart = input.selectionStart ?? rawValue.length;
  const digitsBeforeCaret = rawValue.slice(0, selectionStart).replace(/\D/g, '').length;
  const masked = applyMoneyMask(rawValue);
  const nextCaret = caretAfterDigitCount(masked, digitsBeforeCaret);

  restoreInputCaret(input, nextCaret);
  return masked;
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
