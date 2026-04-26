import { useEffect, useState } from 'react';
import MonthNav from './components/MonthNav.jsx';
import Summary from './components/Summary.jsx';
import {
  FixedExpensesSection,
  InstallmentsSection,
  RevenuesSection,
} from './components/sections/index.js';
import { ExportButton } from './components/ExportButton.jsx';
import { useMonthView, useFinanceData, useFinanceSettings } from './hooks/useFinanceData.js';
import { useFinanceActions } from './hooks/useFinanceActions.js';
import { useMonthOverridesActions } from './hooks/useMonthOverridesActions.js';
import { useCharts } from './hooks/useCharts.js';
import { useI18n } from './lib/i18n.jsx';
import { prefetchChartModule } from './lib/chartLoader.js';
import { OVERRIDE_TYPES, TABS } from './domain/constants.js';
import { formatMoney, monthLabel } from './lib/utils.js';
import { useFinance } from './context/FinanceContext.jsx';

function LoadingScreen() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e0e0e0',
          borderTopColor: '#1a73e8',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>Carregando seus dados...</p>
    </div>
  );
}

export default function FinanceApp() {
  const { t } = useI18n();
  const finance = useFinance();
  const { monthView, currentKey, currentDate } = useMonthView();
  const { fixedExpenses, revenues, monthOverrides } = useFinanceData();
  const settings = useFinanceSettings();
  const { isReady } = finance;
  const actions = useFinanceActions();
  const [activeTab, setActiveTab] = useState('resumo');
  const [pieMode, setPieMode] = useState('categories');
  const { pieChartRef, barChartRef } = useCharts(monthView, pieMode, activeTab);
  const {
    monthCardBills,
    monthRevenueAmounts,
    setMonthCardBill,
    setMonthRevenueAmount,
    toggleMonthPaid,
  } = useMonthOverridesActions({
    monthOverrides,
    currentKey,
    ...actions,
  });

  useEffect(() => {
    prefetchChartModule();
  }, []);

  if (!isReady) {
    return (
      <div className="app">
        <LoadingScreen />
      </div>
    );
  }

  const pieTitle =
    pieMode === 'cards'
      ? 'DESPESAS POR CARTAO'
      : pieMode === 'cardsStatus'
        ? 'PAGO X PENDENTE (RASTREADO)'
        : 'DISTRIBUICAO DE DESPESAS';

  const pieAriaLabel =
    pieMode === 'cards'
      ? 'Pizza com distribuicao de despesas por cartao'
      : pieMode === 'cardsStatus'
        ? 'Barras com comparativo de pago e a pagar por cartao'
        : 'Pizza de categorias de despesa';

  const totalRestante = monthView.installments.reduce((sum, item) => {
    const remaining = item.totalInstallments - item.currentInstallment;
    return sum + remaining * Number(item.installmentValue);
  }, 0);

  const almostDone = monthView.installments.filter(
    (item) => item.currentInstallment / item.totalInstallments >= 0.75
  ).length;

  return (
    <div className="app">
      <h2 className="sr-only">Painel de controle financeiro</h2>

      <header className="sticky-header">
        <MonthNav
          label={monthLabel(currentDate)}
          onPrev={() => actions.changeMonth(-1)}
          onNext={() => actions.changeMonth(1)}
          theme={settings.theme}
          onToggleTheme={() =>
            actions.setTheme(settings.theme === 'premium' ? 'default' : 'premium')
          }
          cardBills={monthCardBills}
          onSetCardBill={setMonthCardBill}
        />

        <ExportButton />

        <nav className="app-tabs" role="tablist" aria-label="Secoes do aplicativo">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`app-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-content">
        {activeTab === 'resumo' && (
          <>
            <Summary
              monthView={monthView}
              cardBills={monthCardBills}
              monthOverrides={monthOverrides}
              currentMonthKey={currentKey}
              onToggleBillPaid={(card, paid) =>
                toggleMonthPaid(OVERRIDE_TYPES.CARD_BILL_PAYMENT, card, paid)
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
        )}

        {activeTab === 'gastos' && (
          <FixedExpensesSection
            items={fixedExpenses}
            currentMonthKey={currentKey}
            monthOverrides={monthOverrides}
            onAdd={actions.addFixedExpense}
            onEdit={actions.updateFixedExpense}
            onDelete={actions.removeFixedExpense}
            onTogglePaid={(itemId, paid) =>
              toggleMonthPaid(OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT, itemId, paid)
            }
          />
        )}

        {activeTab === 'parcelas' && (
          <InstallmentsSection
            items={monthView.installments}
            currentMonthKey={currentKey}
            monthOverrides={monthOverrides}
            onAdd={actions.addInstallment}
            onEdit={actions.updateInstallment}
            onDelete={actions.removeInstallment}
            onTogglePaid={(itemId, paid) =>
              toggleMonthPaid(OVERRIDE_TYPES.INSTALLMENT_PAYMENT, itemId, paid)
            }
          />
        )}

        {activeTab === 'receitas' && (
          <RevenuesSection
            items={revenues}
            currentMonthKey={currentKey}
            monthRevenueAmounts={monthRevenueAmounts}
            onAdd={actions.addRevenue}
            onEdit={actions.updateRevenue}
            onDelete={actions.removeRevenue}
            onMonthRevenueAmount={setMonthRevenueAmount}
          />
        )}
      </main>
    </div>
  );
}
