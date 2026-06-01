import { CreditCard, ReceiptText, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import type { MonthOverride, MonthView } from '../domain/types';
import { formatMoney } from '../lib/utils';
import { buildSummaryData } from '../selectors/summarySelectors';

interface SummaryProps {
  monthView: MonthView;
  cardBills: Record<string, number> | null | undefined;
  monthOverrides: MonthOverride[];
  currentMonthKey: string;
  onToggleBillPaid: (card: string, paid: boolean) => void;
  cardList: Array<{ key: string; label: string }> | undefined;
}

type MonthStatusTone = 'comfortable' | 'tight' | 'negative';

function getMonthStatus(saldoPrevisto: number, receitas: number) {
  if (saldoPrevisto < 0) {
    return {
      tone: 'negative' as MonthStatusTone,
      message: 'Este mes precisa de atencao para fechar no positivo.',
      alert: 'Revise despesas e faturas para entender onde ajustar este mes.',
    };
  }

  const tightThreshold = Math.max(receitas * 0.1, 100);
  if (saldoPrevisto <= tightThreshold) {
    return {
      tone: 'tight' as MonthStatusTone,
      message: 'Seu mes esta positivo, mas com pouca folga.',
      alert: null,
    };
  }

  return {
    tone: 'comfortable' as MonthStatusTone,
    message: 'Seu mes ainda tem margem.',
    alert: null,
  };
}

function getExpenseRatioCopy(expenses: number, revenues: number) {
  if (revenues <= 0) return 'sem receita cadastrada';

  const ratio = Math.round((expenses / revenues) * 100);
  if (ratio > 100) return 'acima da receita do mes';
  if (ratio >= 90) return 'quase toda a receita';
  return `${ratio}% da receita`;
}

export default function Summary({
  monthView,
  cardBills,
  monthOverrides,
  currentMonthKey,
  onToggleBillPaid,
  cardList,
}: SummaryProps) {
  const summaryData = useMemo(
    () => buildSummaryData(monthView, cardBills, monthOverrides, currentMonthKey, cardList),
    [monthView, cardBills, monthOverrides, currentMonthKey, cardList]
  );

  const {
    despesasBrutas,
    despesasPagasBrutas,
    aPagar,
    saldoPrevisto,
    hasNegativeBalance,
    billCardsSummary,
  } = summaryData;

  const { totals, revenues } = monthView;
  const monthStatus = getMonthStatus(saldoPrevisto, totals.receitas);
  const expenseRatioCopy = getExpenseRatioCopy(despesasBrutas, totals.receitas);
  const hasExpensesAboveRevenue = totals.receitas > 0 && despesasBrutas > totals.receitas;

  return (
    <>
      <section className={`saldo-hero saldo-hero--${monthStatus.tone}`}>
        <div className="saldo-primary">
          <p className="saldo-label">Saldo previsto</p>
          <p className={`saldo-val ${saldoPrevisto >= 0 ? 'pos' : 'neg'} saldo-val--calm`}>
            {formatMoney(saldoPrevisto)}
          </p>
          <p className="saldo-message">{monthStatus.message}</p>
        </div>
        <div className="saldo-detail">
          <div className="saldo-detail-item">
            <span>Receitas</span>
            <strong className="pos">{formatMoney(totals.receitas)}</strong>
          </div>
          <div className="saldo-detail-item">
            <span>Pago</span>
            <strong className="saldo-detail-paid">{formatMoney(despesasPagasBrutas)}</strong>
          </div>
          <div className="saldo-detail-item">
            <span>A pagar</span>
            <strong className="saldo-detail-payable">{formatMoney(aPagar)}</strong>
          </div>
        </div>
      </section>

      {hasNegativeBalance ? (
        <div className="alert-bar alert-bar--guidance">
          <div className="dot dot-pend"></div>
          <strong>{monthStatus.alert}</strong>
        </div>
      ) : null}

      <section className="metrics metrics--doublet summary-support">
        <div className="mcard mcard--summary mcard--income">
          <div className="mcard-head">
            <p className="mcard-label">RECEITAS</p>
            <TrendingUp className="mcard-icon pos" size={15} strokeWidth={2.2} aria-hidden />
          </div>
          <p className="mcard-val pos">{formatMoney(totals.receitas)}</p>
          <p className="mcard-sub">{revenues.length} recorrentes</p>
        </div>
        <div className="mcard mcard--summary mcard--expense">
          <div className="mcard-head">
            <p className="mcard-label">DESPESAS</p>
            <TrendingDown className="mcard-icon neg" size={15} strokeWidth={2.2} aria-hidden />
          </div>
          <p className="mcard-val neg">{formatMoney(despesasBrutas)}</p>
          <p className="mcard-sub">{expenseRatioCopy}</p>
          {hasExpensesAboveRevenue ? (
            <p className="mcard-guidance" title="Priorize faturas e gastos recorrentes.">
              Priorize faturas
            </p>
          ) : null}
        </div>
      </section>

      {billCardsSummary.length > 0 ? (
        <section className="metrics bill-metrics">
          {billCardsSummary.map((item) => (
            <div
              className={`mcard bill-summary-card ${
                item.bill > 0 ? 'bill-summary-card--has-bill' : 'bill-summary-card--empty'
              }`}
              key={item.key}
            >
              <div className="bill-summary-card-head">
                <p className="mcard-label bill-summary-title">
                  <CreditCard size={14} strokeWidth={1.9} aria-hidden />
                  FATURA {item.label.toUpperCase()}
                </p>
                {item.bill > 0 ? (
                  <button
                    type="button"
                    className={`bill-pay-btn ${item.paid ? 'paid' : 'unpaid'}`}
                    onClick={() => onToggleBillPaid?.(item.key, !item.paid)}
                  >
                    {item.paid ? 'Paga' : 'Pendente'}
                  </button>
                ) : null}
              </div>
              {item.bill > 0 ? (
                <>
                  <p className="mcard-val">{formatMoney(item.bill)}</p>
                  <div className="bill-summary-lines">
                    {item.abatimento > 0 ? (
                      <p className="mcard-sub">Abatimento: {formatMoney(item.abatimento)}</p>
                    ) : null}
                    <p className="mcard-sub">Restante: {formatMoney(item.restanteFatura)}</p>
                  </div>
                </>
              ) : (
                <p className="bill-summary-empty">
                  <ReceiptText size={14} strokeWidth={1.8} aria-hidden />
                  Sem fatura lancada
                </p>
              )}
            </div>
          ))}
        </section>
      ) : null}
    </>
  );
}
