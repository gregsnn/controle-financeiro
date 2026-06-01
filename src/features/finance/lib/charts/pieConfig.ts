import { PAID_COLOR, UNPAID_COLOR, type PieMode } from '../../domain/constants.js';
import type { MonthView } from '../../domain/types.js';
import {
  buildCardSeries,
  buildCardStatusSeries,
  buildCategorySeries,
  buildDonutTooltipLabel,
  CHART_COLORS,
} from '../chartSeries.js';
import { formatMoney } from '../utils.js';
import { CHART_AXIS_COLOR, CHART_FONT, CHART_GRID_COLOR } from './chartTheme.js';

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
            backgroundColor: PAID_COLOR,
            borderRadius: 5,
          },
          {
            label: 'Pendente (rastreado)',
            data: toPayValues,
            backgroundColor: UNPAID_COLOR,
            borderRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { color: CHART_AXIS_COLOR, font: CHART_FONT, boxWidth: 10, boxHeight: 10 },
          },
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
            grid: { color: CHART_GRID_COLOR },
            ticks: {
              callback: (v: number) => formatMoney(v),
              color: CHART_AXIS_COLOR,
              font: CHART_FONT,
            },
          },
          y: {
            stacked: true,
            ticks: { color: CHART_AXIS_COLOR, font: CHART_FONT },
            grid: { display: false },
          },
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
