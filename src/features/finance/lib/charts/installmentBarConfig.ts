import { formatMoney } from '../utils.js';
import type { MonthView } from '../../domain/types.js';

export function buildInstallmentBarConfig(monthView: MonthView) {
  if (monthView.installments.length === 0) {
    return null;
  }

  const labels = monthView.installments.map((item) => item.name);
  const paidValues = monthView.installments.map((item) => Number(item.installmentValue));
  const remainingValues = monthView.installments.map(
    (item) => (item.totalInstallments - item.currentInstallment) * Number(item.installmentValue)
  );

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Pago', data: paidValues, backgroundColor: '#1D9E75', borderRadius: 4 },
        {
          label: 'Restante',
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
        tooltip: { callbacks: { label: (ctx: { raw: number }) => ` ${formatMoney(ctx.raw)}` } },
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
