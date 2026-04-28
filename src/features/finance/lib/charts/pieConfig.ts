import {
  buildCardSeries,
  buildCardStatusSeries,
  buildCategorySeries,
  buildDonutTooltipLabel,
  CHART_COLORS,
} from '../chartSeries.js';
import { formatMoney } from '../utils.js';
import type { MonthView } from '../../domain/types.js';

type PieMode = 'categories' | 'cards' | 'cardsStatus';

export function hasPieChartData(monthView: MonthView, pieMode: PieMode): boolean {
  return buildPieChartConfig(monthView, pieMode) !== null;
}

export function buildPieChartConfig(monthView: MonthView, pieMode: PieMode) {
  if (pieMode === 'cardsStatus') {
    const statusSeries = buildCardStatusSeries(monthView);
    const { labels, paidValues, toPayValues } = statusSeries;

    if (labels.length === 0) {
      return null;
    }

    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Pago (rastreado)',
            data: paidValues,
            backgroundColor: '#1D9E75',
            borderRadius: 5,
          },
          {
            label: 'Pendente (rastreado)',
            data: toPayValues,
            backgroundColor: '#D85A30',
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: true, position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx: { raw: number; dataset: { label: string } }) =>
                `${ctx.dataset.label}: ${formatMoney(ctx.raw)}`,
              footer: () => 'Baseado em despesas fixas e parcelas.',
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { color: 'rgba(0,0,0,.05)' },
            ticks: { callback: (v: number) => formatMoney(v), font: { size: 10 } },
          },
          y: { stacked: true, ticks: { font: { size: 10 } }, grid: { display: false } },
        },
      },
    };
  }

  const series = pieMode === 'cards' ? buildCardSeries(monthView) : buildCategorySeries(monthView);
  const { labels, values } = series;
  if (values.length === 0) {
    return null;
  }

  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: CHART_COLORS.slice(0, values.length),
          borderWidth: 2,
          borderColor: 'transparent',
          hoverBorderColor: 'transparent',
          hoverOffset: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: buildDonutTooltipLabel } },
      },
    },
  };
}
