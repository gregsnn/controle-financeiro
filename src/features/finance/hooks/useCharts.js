import { useEffect, useRef, useState } from 'react';
import { loadChartModule, prefetchChartModule } from '../lib/chartLoader.js';
import {
  buildCardSeries,
  buildCardStatusSeries,
  buildCategorySeries,
  buildDonutTooltipLabel,
  CHART_COLORS,
} from '../lib/chartSeries.js';
import { formatMoney } from '../lib/utils.js';

export function useCharts(monthView, pieMode = 'categories', activeTab = 'resumo') {
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieInstanceRef = useRef(null);
  const barInstanceRef = useRef(null);
  const [chartsReady, setChartsReady] = useState(true);

  useEffect(() => {
    let cancelled = false;

    pieInstanceRef.current?.destroy();
    pieInstanceRef.current = null;

    async function initChart() {
      try {
        const module = await loadChartModule();
        const Chart = module.default || module;

        if (cancelled || !pieChartRef.current) return;

        if (pieMode === 'cardsStatus') {
          const statusSeries = buildCardStatusSeries(monthView);
          const { labels, paidValues, toPayValues } = statusSeries;

          if (labels.length > 0) {
            pieInstanceRef.current = new Chart(pieChartRef.current, {
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
                      label: (ctx) => `${ctx.dataset.label}: ${formatMoney(ctx.raw)}`,
                      footer: () => 'Baseado em despesas fixas e parcelas.',
                    },
                  },
                },
                scales: {
                  x: {
                    stacked: true,
                    grid: { color: 'rgba(0,0,0,.05)' },
                    ticks: { callback: (v) => formatMoney(v), font: { size: 10 } },
                  },
                  y: { stacked: true, ticks: { font: { size: 10 } }, grid: { display: false } },
                },
              },
            });
          }
        } else {
          const series =
            pieMode === 'cards' ? buildCardSeries(monthView) : buildCategorySeries(monthView);
          const { labels, values } = series;

          if (values.length > 0) {
            pieInstanceRef.current = new Chart(pieChartRef.current, {
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
            });
          }
        }
      } catch (e) {
        console.error('Pie chart error:', e);
        setChartsReady(true);
      }
    }

    if (activeTab === 'resumo') {
      initChart();
    }

    return () => {
      cancelled = true;
      pieInstanceRef.current?.destroy();
    };
  }, [monthView, pieMode, activeTab]);

  useEffect(() => {
    let cancelled = false;

    barInstanceRef.current?.destroy();
    barInstanceRef.current = null;

    const hasInstallments = monthView.installments.length > 0;

    async function initBarChart() {
      try {
        const module = await loadChartModule();
        const Chart = module.default || module;

        if (cancelled || !barChartRef.current || !hasInstallments) return;

        const labels = monthView.installments.map((item) => item.name);
        const paidValues = monthView.installments.map((item) => Number(item.installmentValue));
        const remainingValues = monthView.installments.map(
          (item) =>
            (item.totalInstallments - item.currentInstallment) * Number(item.installmentValue)
        );

        barInstanceRef.current = new Chart(barChartRef.current, {
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
              tooltip: { callbacks: { label: (ctx) => ` ${formatMoney(ctx.raw)}` } },
            },
            scales: {
              x: {
                stacked: true,
                ticks: { callback: (v) => `R$${v}`, font: { size: 10 } },
                grid: { color: 'rgba(0,0,0,.04)' },
              },
              y: { stacked: true, ticks: { font: { size: 10 } } },
            },
          },
        });
      } catch (e) {
        console.error('Bar chart error:', e);
      }
    }

    if (activeTab === 'resumo') {
      initBarChart();
    }

    return () => {
      cancelled = true;
      barInstanceRef.current?.destroy();
    };
  }, [monthView, activeTab]);

  return { pieChartRef, barChartRef, chartsReady };
}
