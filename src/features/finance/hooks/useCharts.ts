import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import type { PieMode } from '../domain/constants.js';
import type { MonthView } from '../domain/types.js';
import { loadChartModule } from '../lib/chartLoader.js';
import { buildInstallmentBarConfig } from '../lib/charts/installmentBarConfig.js';
import { buildPieChartConfig } from '../lib/charts/pieConfig.js';

interface ChartModule {
  default?: new (canvas: HTMLCanvasElement, config: unknown) => unknown;
}

function destroyChart(chartInstanceRef: MutableRefObject<unknown>) {
  if (!chartInstanceRef.current) return;
  (chartInstanceRef.current as { destroy: () => void }).destroy();
  chartInstanceRef.current = null;
}

async function createChartOnCanvas(
  canvas: HTMLCanvasElement | null,
  config: unknown
): Promise<unknown> {
  const module = (await loadChartModule()) as ChartModule;
  const Chart = module.default || module;
  if (!canvas || !config) return null;
  return new (Chart as new (node: HTMLCanvasElement, cfg: unknown) => unknown)(canvas, config);
}

export function buildPieChartDataKey(monthView: MonthView, pieMode: PieMode): string {
  if (pieMode === 'categories') {
    return JSON.stringify(
      monthView.fixedExpenses.map((item) => ({
        id: item.id,
        category: item.category,
        amount: Number(item.amount || 0),
      }))
    );
  }

  if (pieMode === 'cards') {
    return JSON.stringify({
      fixedExpenses: monthView.fixedExpenses.map((item) => ({
        id: item.id,
        amount: Number(item.amount || 0),
        card: item.card || null,
        paymentMethod: item.paymentMethod,
      })),
      installments: monthView.installments.map((item) => ({
        id: item.id,
        amount: Number(item.installmentValue || 0),
        card: item.card || null,
      })),
    });
  }

  return JSON.stringify({
    fixedExpenses: monthView.fixedExpenses.map((item) => ({
      id: item.id,
      amount: Number(item.amount || 0),
      card: item.card || null,
      paid: item.paid === true,
      paymentMethod: item.paymentMethod,
    })),
    installments: monthView.installments.map((item) => ({
      id: item.id,
      amount: Number(item.installmentValue || 0),
      card: item.card || null,
      paid: item.paid === true,
    })),
  });
}

export function buildInstallmentChartDataKey(monthView: MonthView): string {
  return JSON.stringify(
    monthView.installments.map((item) => ({
      id: item.id,
      name: item.name,
      installmentValue: Number(item.installmentValue || 0),
      currentInstallment: Number(item.currentInstallment || 0),
      totalInstallments: Number(item.totalInstallments || 0),
    }))
  );
}

export function useCharts(
  monthView: MonthView,
  pieMode: PieMode = 'categories',
  activeTab: string = 'resumo'
) {
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const pieInstanceRef = useRef<unknown>(null);
  const barInstanceRef = useRef<unknown>(null);
  const latestMonthViewRef = useRef(monthView);
  const [chartsReady, setChartsReady] = useState(true);
  const pieDataKey = useMemo(() => buildPieChartDataKey(monthView, pieMode), [monthView, pieMode]);
  const barDataKey = useMemo(() => buildInstallmentChartDataKey(monthView), [monthView]);

  latestMonthViewRef.current = monthView;

  // Pie chart effect - updates when pie mode or month data changes
  useEffect(() => {
    let cancelled = false;
    destroyChart(pieInstanceRef);

    async function initPieChart() {
      try {
        if (cancelled || activeTab !== 'resumo') return;
        const config = buildPieChartConfig(latestMonthViewRef.current, pieMode);
        pieInstanceRef.current = await createChartOnCanvas(pieChartRef.current, config);
      } catch (e) {
        console.error('Pie chart error:', e);
        setChartsReady(true);
      }
    }

    if (activeTab === 'resumo') {
      initPieChart();
    }

    return () => {
      cancelled = true;
      destroyChart(pieInstanceRef);
    };
  }, [pieDataKey, pieMode, activeTab]);

  // Bar chart effect - independent from pie chart, updates only when month data changes
  useEffect(() => {
    let cancelled = false;
    destroyChart(barInstanceRef);

    async function initBarChart() {
      try {
        if (cancelled || activeTab !== 'resumo') return;
        const config = buildInstallmentBarConfig(latestMonthViewRef.current);
        barInstanceRef.current = await createChartOnCanvas(barChartRef.current, config);
      } catch (e) {
        console.error('Bar chart error:', e);
      }
    }

    if (activeTab === 'resumo') {
      initBarChart();
    }

    return () => {
      cancelled = true;
      destroyChart(barInstanceRef);
    };
  }, [barDataKey, activeTab]);
  return { pieChartRef, barChartRef, chartsReady };
}
