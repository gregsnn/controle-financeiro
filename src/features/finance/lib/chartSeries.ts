import { CARD_LABELS, CATEGORY_LABELS } from '../ui/constants.js';
import type { MonthView, MonthViewFixedExpense } from '../domain/types.js';
import { getExpenseCard } from '../selectors/summarySelectors.js';
import { formatMoney } from './utils.js';

// Chart color palette
export const CHART_COLORS = [
  '#b8860b', // Gold accent
  '#9f1239', // Danger
  '#5b21b6', // Purple
  '#047857', // Success
  '#b45309', // Warning
  '#1e40af', // Blue
  '#a16207', // Bronze
  '#6b21a8', // Dark purple
  '#0369a1', // Sky blue
  '#7c3aed', // Violet
];

function sortEntriesByValue<K>(entries: Array<[K, number]>): Array<[K, number]> {
  return entries.sort((a, b) => b[1] - a[1]);
}

export function buildCategorySeries(monthView: MonthView) {
  const categoryMap = new Map<string, number>();

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

export function buildCardSeries(monthView: MonthView) {
  const cardMap = new Map<string, number>();
  cardMap.set('outro', 0);

  monthView.fixedExpenses.forEach((item) => {
    const card = getExpenseCard(item as MonthViewFixedExpense);
    if (!card) return;
    cardMap.set(card, (cardMap.get(card) || 0) + Number(item.amount || 0));
  });

  monthView.installments.forEach((item) => {
    const card = (item.card || 'outro') as string;
    cardMap.set(card, (cardMap.get(card) || 0) + Number(item.installmentValue || 0));
  });

  const sorted = Array.from(cardMap.entries())
    .sort((a, b) => b[1] - a[1])
    .filter(([, value]) => value > 0);
  return {
    labels: sorted.map(([key]) => CARD_LABELS[key] || key.toUpperCase()),
    values: sorted.map(([, value]) => value),
  };
}

export function buildCardStatusSeries(monthView: MonthView) {
  const cardMap = new Map<string, { total: number; paid: number }>();
  cardMap.set('outro', { total: 0, paid: 0 });

  monthView.fixedExpenses.forEach((item) => {
    const card = getExpenseCard(item as MonthViewFixedExpense);
    if (!card) return;
    const amount = Number(item.amount || 0);
    const current = cardMap.get(card) || { total: 0, paid: 0 };
    current.total += amount;
    if (item.paid === true) current.paid += amount;
    cardMap.set(card, current);
  });

  monthView.installments.forEach((item) => {
    const card = (item.card || 'outro') as string;
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

interface ChartTooltipContext {
  raw?: number;
  label?: string;
  dataset?: { data?: number[] };
}

export function buildDonutTooltipLabel(context: ChartTooltipContext) {
  const value = Number(context.raw || 0);
  const dataset = context.dataset?.data || [];
  const total = dataset.reduce((sum, item) => sum + Number(item || 0), 0);
  const percent = total > 0 ? (value / total) * 100 : 0;
  const percentLabel = percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  return `${context.label}: ${formatMoney(value)} (${percentLabel}%)`;
}
