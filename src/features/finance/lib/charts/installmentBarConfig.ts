import { PAID_COLOR } from '../../domain/constants.js';
import type { MonthView } from '../../domain/types.js';
import { formatMoney } from '../utils.js';
import { CHART_AXIS_COLOR, CHART_FONT, CHART_GRID_COLOR } from './chartTheme.js';

export function hasInstallmentBarData(monthView: MonthView): boolean {
  return buildInstallmentBarConfig(monthView) !== null;
}

export function buildInstallmentBarConfig(monthView: MonthView) {
  if (monthView.installments.length === 0) {
    return null;
  }

  const labels = monthView.installments.map((item) => item.name);
  const monthValues = monthView.installments.map((item) => Number(item.installmentValue || 0));

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Parcela deste mes',
          data: monthValues,
          backgroundColor: PAID_COLOR,
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: { dataset: { label?: string }; raw: number }) =>
              `${ctx.dataset.label ?? ''}: ${formatMoney(ctx.raw)}`,
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: {
            callback: (v: number) => `R$${v}`,
            color: CHART_AXIS_COLOR,
            font: CHART_FONT,
          },
          grid: { color: CHART_GRID_COLOR },
        },
        y: {
          stacked: true,
          ticks: { color: CHART_AXIS_COLOR, font: CHART_FONT },
          grid: { color: CHART_GRID_COLOR },
        },
      },
    },
  };
}
