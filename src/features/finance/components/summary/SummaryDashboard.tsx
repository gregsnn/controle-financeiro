import type { RefObject } from 'react';
import { OVERRIDE_TYPES } from '../../domain/constants';
import type { MonthOverride, MonthView } from '../../domain/types';
import { useSummaryMetrics } from '../../hooks/useSummaryMetrics';
import { formatMoney } from '../../lib/utils';
import Summary from '../Summary';

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
}: SummaryDashboardProps) {
  const { pieTitle, pieAriaLabel, totalRestante, almostDone } = useSummaryMetrics(
    monthView,
    pieMode
  );

  return (
    <>
      <Summary
        monthView={monthView}
        cardBills={monthCardBills}
        monthOverrides={monthOverrides}
        currentMonthKey={currentMonthKey}
        onToggleBillPaid={(card, paid) =>
          onToggleMonthPaid(OVERRIDE_TYPES.CARD_BILL_PAYMENT, card, paid)
        }
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
            <canvas ref={pieChartRef} role="img" aria-label={pieAriaLabel} />
          </div>
        </div>
        <div className="chart-card">
          <p className="chart-title">PARCELAMENTOS</p>
          <div className="chart-frame chart-frame--bar">
            <canvas
              ref={barChartRef}
              role="img"
              aria-label="Barras com valor mensal de cada parcelamento"
            />
          </div>
        </div>
      </section>

      <section className="metrics metrics--triplet">
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
