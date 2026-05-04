import type { RefObject } from 'react';
import { useMemo } from 'react';
import { OVERRIDE_TYPES } from '../../domain/constants';
import type { MonthOverride, MonthView } from '../../domain/types';
import { useSummaryMetrics } from '../../hooks/useSummaryMetrics';
import { hasInstallmentBarData } from '../../lib/charts/installmentBarConfig';
import { hasPieChartData } from '../../lib/charts/pieConfig';
import { formatMoney } from '../../lib/utils';
import Summary from '../Summary';
import { ChartEmpty } from './ChartEmpty';

type PieMode = 'categories' | 'cards' | 'cardsStatus';

interface SummaryDashboardProps {
  monthView: MonthView;
  monthCardBills: Record<string, number>;
  monthOverrides: MonthOverride[];
  currentMonthKey: string;
  pieMode: PieMode;
  setPieMode: (mode: PieMode) => void;
  pieChartRef: RefObject<HTMLCanvasElement | null>;
  barChartRef: RefObject<HTMLCanvasElement | null>;
  onToggleMonthPaid: (type: any, itemId: string, paid: boolean) => void;
  cardList?: { key: string; label: string }[];
}

export function SummaryDashboard({
  monthView,
  monthCardBills,
  monthOverrides,
  currentMonthKey,
  pieMode,
  setPieMode,
  pieChartRef,
  barChartRef,
  onToggleMonthPaid,
  cardList,
}: SummaryDashboardProps) {
  const { pieTitle, pieAriaLabel, totalRestante, almostDone } = useSummaryMetrics(
    monthView,
    pieMode
  );

  const showPieChart = hasPieChartData(monthView, pieMode);
  const showBarChart = hasInstallmentBarData(monthView);

  const pieEmptyCopy = useMemo(() => {
    switch (pieMode) {
      case 'categories':
        return {
          title: 'Sem categorias neste mês',
          hint: 'Cadastre gastos fixos ou parcelas para ver a distribuição.',
        };
      case 'cards':
        return {
          title: 'Sem despesas por cartão',
          hint: 'Quando houver valores nos cartões, o gráfico aparece aqui.',
        };
      case 'cardsStatus':
        return {
          title: 'Nada para comparar',
          hint: 'Com despesas por cartão no mês, você verá pago x pendente.',
        };
      default:
        return { title: 'Sem dados', hint: 'Os gráficos aparecem quando houver informação.' };
    }
  }, [pieMode]);

  return (
    <>
      <Summary
        monthView={monthView}
        cardBills={monthCardBills}
        monthOverrides={monthOverrides}
        currentMonthKey={currentMonthKey}
        onToggleBillPaid={(card: string, paid: boolean) =>
          onToggleMonthPaid(OVERRIDE_TYPES.CARD_BILL_PAYMENT, card, paid)
        }
        cardList={cardList}
      />

      <section className="charts-grid">
        <div className="chart-card">
          <div className="chart-head">
            <p className="chart-title">{pieTitle}</p>
            <div
              className="chart-switch"
              role="tablist"
              aria-label="Modo da distribuicao de despesas"
            >
              <button
                type="button"
                role="tab"
                aria-selected={pieMode === 'categories'}
                className={`chart-switch-btn ${pieMode === 'categories' ? 'active' : ''}`}
                onClick={() => setPieMode('categories')}
              >
                Categorias
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={pieMode === 'cards'}
                className={`chart-switch-btn ${pieMode === 'cards' ? 'active' : ''}`}
                onClick={() => setPieMode('cards')}
              >
                Cartoes
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={pieMode === 'cardsStatus'}
                className={`chart-switch-btn ${pieMode === 'cardsStatus' ? 'active' : ''}`}
                onClick={() => setPieMode('cardsStatus')}
              >
                Pago x pendente
              </button>
            </div>
          </div>
          <div
            className={`chart-frame chart-frame--pie ${pieMode === 'cardsStatus' ? 'chart-frame--status' : ''}`}
          >
            {showPieChart ? (
              <canvas ref={pieChartRef} role="img" aria-label={pieAriaLabel} />
            ) : (
              <ChartEmpty title={pieEmptyCopy.title} hint={pieEmptyCopy.hint} />
            )}
          </div>
        </div>
        <div className="chart-card">
          <p className="chart-title">PARCELAMENTOS</p>
          <div className="chart-frame chart-frame--bar">
            {showBarChart ? (
              <canvas
                ref={barChartRef}
                role="img"
                aria-label="Barras com total ja pago e falta pagar por parcelamento"
              />
            ) : (
              <ChartEmpty
                title="Sem parcelamentos"
                hint="Cadastre parcelamentos na aba Parcelas para ver os valores mensais."
              />
            )}
          </div>
        </div>
      </section>

      <section className="metrics">
        <div className="mcard">
          <p className="mcard-label">GASTOS FIXOS</p>
          <p className="mcard-val warn">{formatMoney(monthView.totals.despesasFixas)}</p>
          <p className="mcard-sub">{monthView.fixedExpenses.length} lançamentos</p>
        </div>
        <div className="mcard">
          <p className="mcard-label">TOTAL/MÊS</p>
          <p className="mcard-val warn">{formatMoney(monthView.totals.installments)}</p>
          <p className="mcard-sub">{monthView.installments.length} parcelamentos</p>
        </div>
        <div className="mcard">
          <p className="mcard-label">TOTAL RESTANTE</p>
          <p className="mcard-val neg">{formatMoney(totalRestante)}</p>
          <p className="mcard-sub">valor total de parcelas futuras</p>
        </div>
        <div className="mcard">
          <p className="mcard-label">QUASE NO FIM</p>
          <p className="mcard-val pos">{almostDone > 0 ? almostDone : '-'}</p>
          <p className="mcard-sub">acima de 75% pagas</p>
        </div>
      </section>
    </>
  );
}
