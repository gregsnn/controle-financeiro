export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(value: unknown): string {
  return currencyFormatter.format(Number(value || 0));
}

export default {
  currencyFormatter,
  formatCurrency,
};

export function createCurrencyFormatter(locale = 'pt-BR') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseCurrencyString(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const raw = String(value).trim();
  if (!raw) return 0;
  // remove currency symbols and whitespace
  let normalized = raw.replace(/\s/g, '').replace(/[R$]/g, '');
  // If contains comma as decimal separator, convert to dot after removing thousands separator
  if (normalized.includes(',')) {
    normalized = normalized.replace(/\./g, '').replace(',', '.');
  }
  const parsed = Number(normalized.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}
