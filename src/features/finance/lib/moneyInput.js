const moneyInputFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoneyInput(value, { hideNonPositive = false } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '';
  if (hideNonPositive && parsed <= 0) return '';
  return moneyInputFormatter.format(parsed);
}

export function applyMoneyMask(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  const parsed = Number(digits) / 100;
  return moneyInputFormatter.format(parsed);
}

export function parseMoneyInput(maskedValue, { allowZero = true } = {}) {
  if (maskedValue === null || maskedValue === undefined || maskedValue === '') return null;
  const normalized = String(maskedValue).replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  if (!allowZero && parsed <= 0) return null;
  if (allowZero && parsed < 0) return null;
  return parsed;
}
