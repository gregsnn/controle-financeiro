import { CalendarDays, CreditCard, ReceiptText, Wallet, WalletCards } from 'lucide-react';
import type { RefObject } from 'react';
import { useMemo } from 'react';
import { OVERRIDE_TYPES } from '../../domain/constants';
import type { MonthOverride, MonthView } from '../../domain/types';
import { useSummaryMetrics } from '../../hooks/useSummaryMetrics';
import { hasInstallmentBarData } from '../../lib/charts/installmentBarConfig';
import { hasPieChartData } from '../../lib/charts/pieConfig';
import { buildCardSeries, buildCategorySeries } from '../../lib/chartSeries';
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
  onOpenCards?: () => void;
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
  onOpenCards,
}: SummaryDashboardProps) {
  const { pieTitle, pieAriaLabel, totalRestante, almostDone } = useSummaryMetrics(
    monthView,
    pieMode
  );

  const showPieChart = hasPieChartData(monthView, pieMode);
  const showBarChart = hasInstallmentBarData(monthView);
  const pieSeries = useMemo(() => {
    if (pieMode === 'cardsStatus') return null;
    return pieMode === 'cards' ? buildCardSeries(monthView) : buildCategorySeries(monthView);
  }, [monthView, pieMode]);
  const pieInsight = useMemo(() => {
    if (!pieSeries || pieSeries.values.length === 0) return null;

    const total = pieSeries.values.reduce((sum, value) => sum + Number(value || 0), 0);
    const dominantValue = Number(pieSeries.values[0] || 0);
    const dominantShare = total > 0 ? dominantValue / total : 0;

    if (pieSeries.values.length === 1 || dominantShare >= 0.9) {
      return {
        label: pieSeries.labels[0],
        value: dominantValue,
        share: Math.round(dominantShare * 100),
        items: pieSeries.labels.slice(0, 3).map((label, index) => ({
          label,
          value: pieSeries.values[index],
          share: total > 0 ? Math.round((Number(pieSeries.values[index] || 0) / total) * 100) : 0,
        })),
      };
    }

    return null;
  }, [pieSeries]);
  const openInstallments = useMemo(
    () =>
      monthView.installments
        .map((item) => {
          return {
            name: item.name,
            value: Number(item.installmentValue || 0),
          };
        })
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value),
    [monthView.installments]
  );
  const showInstallmentList = openInstallments.length > 0 && openInstallments.length <= 3;
  const installmentFocus = useMemo(() => {
    if (!showInstallmentList) return null;

    const total = openInstallments.reduce((sum, item) => sum + item.value, 0);
    const main = openInstallments[0];
    const share = total > 0 ? Math.round((main.value / total) * 100) : 0;

    if (openInstallments.length === 1 || share >= 70) {
      return `${main.name} concentra a maior parte das parcelas deste mes.`;
    }

    return 'Poucas parcelas em aberto. Acompanhe o impacto mensal sem comparar barras.';
  }, [openInstallments, showInstallmentList]);
  const maxOpenInstallment = Math.max(...openInstallments.map((item) => item.value), 0);
  const totalOpenInstallments = openInstallments.reduce((sum, item) => sum + item.value, 0);

  const pieEmptyCopy = useMemo(() => {
    switch (pieMode) {
      case 'categories':
        return {
          title: 'Sem categorias neste mês',
          hint: 'Cadastre despesas fixas ou parcelas para ver a distribuição.',
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

  const renderPieContent = () => {
    if (!showPieChart) {
      return <ChartEmpty title={pieEmptyCopy.title} hint={pieEmptyCopy.hint} />;
    }

    if (pieInsight) {
      return (
        <div className="chart-insight-state">
          <div className="chart-insight-main">
            <span className="chart-insight-percent">{pieInsight.share}%</span>
            <div>
              <span className="chart-insight-eyebrow">Principal foco</span>
              <strong>{pieInsight.label}</strong>
            </div>
          </div>
          <div className="chart-insight-list">
            {pieInsight.items.map((item) => (
              <div className="chart-insight-list-row" key={item.label}>
                <span>{item.label}</span>
                <strong>
                  {formatMoney(item.value)} <small>{item.share}%</small>
                </strong>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <canvas ref={pieChartRef} role="img" aria-label={pieAriaLabel} />;
  };

  const renderInstallmentContent = () => {
    if (!showBarChart) {
      return (
        <ChartEmpty
          title="Sem parcelamentos"
          hint="Cadastre parcelamentos na aba Cartoes para ver os valores mensais."
        />
      );
    }

    if (showInstallmentList) {
      return (
        <div className="installment-insight-list">
          <div className="installment-insight-summary">
            <span>{openInstallments.length} em aberto</span>
            <strong>{formatMoney(totalOpenInstallments)}</strong>
          </div>
          {openInstallments.map((item) => {
            const width =
              maxOpenInstallment > 0 ? Math.max(8, (item.value / maxOpenInstallment) * 100) : 0;
            return (
              <div className="installment-insight-item" key={item.name}>
                <div className="installment-insight-row">
                  <span>{item.name}</span>
                  <strong>{formatMoney(item.value)}</strong>
                </div>
                <div className="installment-insight-track" aria-hidden="true">
                  <span style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <canvas
        ref={barChartRef}
        role="img"
        aria-label="Barras com total ja pago e falta pagar por parcelamento"
      />
    );
  };

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
        <div className={`chart-card ${pieInsight ? 'chart-card--compact' : ''}`}>
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
            {renderPieContent()}
          </div>
        </div>
        <div className={`chart-card ${showInstallmentList ? 'chart-card--compact' : ''}`}>
          <div className="chart-title-row">
            <p className="chart-title">PARCELAS EM ABERTO</p>
            {onOpenCards ? (
              <button type="button" className="chart-card-action" onClick={onOpenCards}>
                <CreditCard size={13} strokeWidth={2} aria-hidden />
                Ver cartoes
              </button>
            ) : null}
          </div>
          {installmentFocus ? <p className="chart-note">{installmentFocus}</p> : null}
          <div
            className={`chart-frame chart-frame--bar ${
              showInstallmentList ? 'chart-frame--installment-list' : ''
            }`}
          >
            {renderInstallmentContent()}
          </div>
        </div>
      </section>

      <section className="metrics metrics--support">
        <div className="mcard mcard--mini mcard--fixed">
          <div className="mcard-head">
            <p className="mcard-label">DESPESAS FIXAS</p>
            <Wallet size={15} strokeWidth={2} aria-hidden />
          </div>
          <p className="mcard-val warn">{formatMoney(monthView.totals.despesasFixas)}</p>
          <p className="mcard-sub">{monthView.fixedExpenses.length} lançamentos</p>
        </div>
        <div className="mcard mcard--mini mcard--installments-month">
          <div className="mcard-head">
            <p className="mcard-label">PARCELAS DESTE MES</p>
            <ReceiptText size={15} strokeWidth={2} aria-hidden />
          </div>
          <p className="mcard-val warn">{formatMoney(monthView.totals.installments)}</p>
          <p className="mcard-sub">{monthView.installments.length} parcelamentos</p>
        </div>
        <div className="mcard mcard--mini mcard--future">
          <div className="mcard-head">
            <p className="mcard-label">PARCELAS FUTURAS</p>
            <CalendarDays size={15} strokeWidth={2} aria-hidden />
          </div>
          <p className="mcard-val neg">{formatMoney(totalRestante)}</p>
          <p className="mcard-sub">valor total de parcelas futuras</p>
        </div>
        <div className="mcard mcard--mini mcard--almost">
          <div className="mcard-head">
            <p className="mcard-label">PERTO DE QUITAR</p>
            <WalletCards size={15} strokeWidth={2} aria-hidden />
          </div>
          <p className="mcard-val pos">{almostDone > 0 ? almostDone : '-'}</p>
          <p className="mcard-sub">acima de 75% pagas</p>
        </div>
      </section>
    </>
  );
}
