export const clone = (value) => JSON.parse(JSON.stringify(value));

export const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatMoney(value) {
  return currency.format(Number(value || 0));
}

export function monthKey(date) {
  const d = date || new Date();
  return d.toISOString().slice(0, 7);
}

export function monthLabel(date) {
  return date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
}

export function previousMonthKey(key) {
  const date = new Date(`${key}-01T00:00:00`);
  date.setMonth(date.getMonth() - 1);
  return monthKey(date);
}

export function isMonthInRange(monthKeyValue, startMonth, endMonth) {
  if (startMonth && monthKeyValue < startMonth) return false;
  if (endMonth && monthKeyValue > endMonth) return false;
  return true;
}

export function formatStartMonth(monthKey) {
  if (!monthKey) return '-';
  const [year, month] = monthKey.split('-');
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
