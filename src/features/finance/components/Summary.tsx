import { useMemo } from 'react';
import { formatMoney } from '../lib/utils';
import { buildSummaryData } from '../selectors/summarySelectors';

export default function Summary({
  monthView,
  cardBills,
  monthOverrides,
  currentMonthKey,
  onToggleBillPaid,
}) {
  const summaryData = useMemo(
    () => buildSummaryData(monthView, cardBills, monthOverrides, currentMonthKey),
    [monthView, cardBills, monthOverrides, currentMonthKey]
  );

  const {
    despesasBrutas,
    despesasPagasBrutas,
    aPagar,
    saldo,
    saldoPrevisto,
    hasNegativeBalance,
    billCardsSummary,
  } = summaryData;

  const { totals, revenues } = monthView;

  return (
    <>
      <section className="saldo-hero">
        <div>
          <p className="saldo-label">Saldo do mês</p>
          <p className={`saldo-val ${saldo >= 0 ? 'pos' : 'neg'}`}>{formatMoney(saldo)}</p>
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

      <section className="metrics metrics--triplet">
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
        <div className="mcard">
          <p className="mcard-label">A PAGAR</p>
          <p className="mcard-val warn">{formatMoney(aPagar)}</p>
          <p className="mcard-sub">Saldo previsto: {formatMoney(saldoPrevisto)}</p>
        </div>
      </section>

      <section className="metrics bill-metrics">
        {billCardsSummary.map((item) => (
          <div className="mcard" key={item.key}>
            <p className="mcard-label">FATURA {item.label.toUpperCase()}</p>
            <p className="mcard-val">{formatMoney(item.bill)}</p>
            {item.bill > 0 ? (
              <label
                className="mcard-sub"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <input
                  type="checkbox"
                  checked={item.paid}
                  onChange={(e) => onToggleBillPaid?.(item.key, e.target.checked)}
                />
                Fatura paga no mês
              </label>
            ) : null}
            <p className="mcard-sub">Abatimento: {formatMoney(item.abatimento)}</p>
            <p className="mcard-sub">Restante para pagar: {formatMoney(item.restanteFatura)}</p>
          </div>
        ))}
      </section>
    </>
  );
}
