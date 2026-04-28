import { formatMoney } from '../utils.js';
import type { MonthView } from '../../domain/types.js';

export function hasInstallmentBarData(monthView: MonthView): boolean {
  return buildInstallmentBarConfig(monthView) !== null;
}

export function buildInstallmentBarConfig(monthView: MonthView) {
  if (monthView.installments.length === 0) {
    return null;
  }

  const labels = monthView.installments.map((item) => item.name);
  const paidValues = monthView.installments.map((item) => {
    const v = Number(item.installmentValue);
    const done = Math.max(0, item.currentInstallment - 1);
    return done * v;
  });
  const remainingValues = monthView.installments.map((item) => {
    const v = Number(item.installmentValue);
    const left = Math.max(0, item.totalInstallments - item.currentInstallment);
    return left * v;
  });

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Já pago (acumulado)',
          data: paidValues,
          backgroundColor: '#1D9E75',
          borderRadius: 4,
        },
        {
          label: 'Falta pagar',
          data: remainingValues,
          backgroundColor: '#B5D4F4',
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
          ticks: { callback: (v: number) => `R$${v}`, font: { size: 10 } },
          grid: { color: 'rgba(0,0,0,.04)' },
        },
        y: { stacked: true, ticks: { font: { size: 10 } } },
      },
    },
  };
}
