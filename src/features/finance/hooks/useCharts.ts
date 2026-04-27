import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import { loadChartModule } from '../lib/chartLoader.js';
import { buildPieChartConfig } from '../lib/charts/pieConfig.js';
import { buildInstallmentBarConfig } from '../lib/charts/installmentBarConfig.js';
import type { MonthView } from '../domain/types.js';

type PieMode = 'categories' | 'cards' | 'cardsStatus';

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

export function useCharts(
  monthView: MonthView,
  pieMode: PieMode = 'categories',
  activeTab: string = 'resumo'
) {
  const pieChartRef = useRef<HTMLCanvasElement>(null);
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const pieInstanceRef = useRef<unknown>(null);
  const barInstanceRef = useRef<unknown>(null);
  const [chartsReady, setChartsReady] = useState(true);

  useEffect(() => {
    let cancelled = false;
    destroyChart(pieInstanceRef);

    async function initChart() {
      try {
        if (cancelled) return;
        const config = buildPieChartConfig(monthView, pieMode);
        pieInstanceRef.current = await createChartOnCanvas(pieChartRef.current, config);
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
      destroyChart(pieInstanceRef);
    };
  }, [monthView, pieMode, activeTab]);

  useEffect(() => {
    let cancelled = false;
    destroyChart(barInstanceRef);

    async function initBarChart() {
      try {
        if (cancelled) return;
        const config = buildInstallmentBarConfig(monthView);
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
  }, [monthView, activeTab]);

  return { pieChartRef, barChartRef, chartsReady };
}
