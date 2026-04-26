import { formatMoney } from './utils.js';
import { CARD_ORDER, CARD_LABELS, CATEGORY_LABELS } from '../domain/constants.js';
import { getExpenseCard } from '../selectors/summarySelectors.js';

export const CHART_COLORS = [
  '#378ADD',
  '#1D9E75',
  '#D85A30',
  '#7F77DD',
  '#BA7517',
  '#888780',
  '#E85D75',
  '#5DADE2',
];

function sortEntriesByValue(entries) {
  return [...entries].sort((a, b) => b[1] - a[1]);
}

export function buildCategorySeries(monthView) {
  const categoryMap = new Map();

  monthView.fixedExpenses.forEach((item) => {
    const cat = item.category || 'outro';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + Number(item.amount || 0));
  });

  const sorted = sortEntriesByValue(Array.from(categoryMap.entries())).filter(
    ([, value]) => value > 0
  );
  return {
    labels: sorted.map(([key]) => CATEGORY_LABELS[key] || key.toUpperCase()),
    values: sorted.map(([, value]) => value),
  };
}

export function buildCardSeries(monthView) {
  const cardMap = new Map([
    ['santander', 0],
    ['nubank', 0],
    ['outro', 0],
  ]);

  monthView.fixedExpenses.forEach((item) => {
    const card = getExpenseCard(item);
    if (!card) return;
    cardMap.set(card, (cardMap.get(card) || 0) + Number(item.amount || 0));
  });

  monthView.installments.forEach((item) => {
    const card = item.card || 'outro';
    cardMap.set(card, (cardMap.get(card) || 0) + Number(item.installmentValue || 0));
  });

  const sorted = sortEntriesByValue(Array.from(cardMap.entries())).filter(([, value]) => value > 0);
  return {
    labels: sorted.map(([key]) => CARD_LABELS[key] || key.toUpperCase()),
    values: sorted.map(([, value]) => value),
  };
}

export function buildCardStatusSeries(monthView) {
  const cardMap = new Map(CARD_ORDER.map((card) => [card, { total: 0, paid: 0 }]));

  monthView.fixedExpenses.forEach((item) => {
    const card = getExpenseCard(item);
    if (!card) return;
    const amount = Number(item.amount || 0);
    const current = cardMap.get(card) || { total: 0, paid: 0 };
    current.total += amount;
    if (item.paid === true) current.paid += amount;
    cardMap.set(card, current);
  });

  monthView.installments.forEach((item) => {
    const card = item.card || 'outro';
    const amount = Number(item.installmentValue || 0);
    const current = cardMap.get(card) || { total: 0, paid: 0 };
    current.total += amount;
    if (item.paid === true) current.paid += amount;
    cardMap.set(card, current);
  });

  const sorted = sortEntriesByValue(
    Array.from(cardMap.entries()).map(([card, values]) => [card, values.total])
  ).filter(([, total]) => total > 0);

  return {
    labels: sorted.map(([card]) => CARD_LABELS[card] || card.toUpperCase()),
    paidValues: sorted.map(([card]) => Number(cardMap.get(card)?.paid || 0)),
    toPayValues: sorted.map(([card]) => {
      const current = cardMap.get(card) || { total: 0, paid: 0 };
      return Math.max(0, Number(current.total || 0) - Number(current.paid || 0));
    }),
  };
}

export function buildDonutTooltipLabel(context) {
  const value = Number(context.raw || 0);
  const dataset = context.dataset?.data || [];
  const total = dataset.reduce((sum, item) => sum + Number(item || 0), 0);
  const percent = total > 0 ? (value / total) * 100 : 0;
  const percentLabel = percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return `${context.label}: ${formatMoney(value)} (${percentLabel}%)`;
}