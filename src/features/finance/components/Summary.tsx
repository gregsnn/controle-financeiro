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

  return (
    <>
      <section className="saldo-hero">
        <div>
          <p className="saldo-label">Saldo previsto</p>
          <p className={`saldo-val ${saldoPrevisto >= 0 ? 'pos' : 'neg'}`}>
            {formatMoney(saldoPrevisto)}
          </p>
        </div>
        <div className="saldo-detail">
          <div>
            Receitas <strong>{formatMoney(totals.receitas)}</strong>
          </div>
          <div>
            Pago <strong style={{ color: '#A32D2D' }}>{formatMoney(despesasPagasBrutas)}</strong>
          </div>
          <div>
            A pagar <strong style={{ color: '#854F0B' }}>{formatMoney(aPagar)}</strong>
          </div>
        </div>
      </section>

      {hasNegativeBalance ? (
        <div className="alert-bar">
          <div className="dot dot-pend"></div>
          <strong>
            Despesas superam receitas em {formatMoney(Math.abs(saldoPrevisto))} este mês.
          </strong>
        </div>
      ) : null}

      <section className="metrics metrics--doublet">
        <div className="mcard">
          <p className="mcard-label">RECEITAS</p>
          <p className="mcard-val pos">{formatMoney(totals.receitas)}</p>
          <p className="mcard-sub">{revenues.length} recorrentes</p>
        </div>
        <div className="mcard">
          <p className="mcard-label">DESPESAS</p>
          <p className="mcard-val neg">{formatMoney(despesasBrutas)}</p>
          <p className="mcard-sub">
            {totals.receitas > 0 ? Math.round((despesasBrutas / totals.receitas) * 100) : 0}% da
            receita
          </p>
        </div>
      </section>

      {billCardsSummary.length > 0 ? (
        <section className="metrics bill-metrics">
          {billCardsSummary.map((item) => (
            <div className="mcard" key={item.key}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <p className="mcard-label" style={{ margin: 0 }}>
                  FATURA {item.label.toUpperCase()}
                </p>
                {item.bill > 0 ? (
                  <button
                    type="button"
                    className={`bill-pay-btn ${item.paid ? 'paid' : 'unpaid'}`}
                    onClick={() => onToggleBillPaid?.(item.key, !item.paid)}
                    style={{ marginTop: '-2px' }}
                  >
                    {item.paid ? '✓ Paga' : '○ Pendente'}
                  </button>
                ) : null}
              </div>
              <p className="mcard-val">{formatMoney(item.bill)}</p>
              <p className="mcard-sub">Abatimento: {formatMoney(item.abatimento)}</p>
              <p className="mcard-sub">Restante para pagar: {formatMoney(item.restanteFatura)}</p>
            </div>
          ))}
        </section>
      ) : null}
    </>
  );
}
