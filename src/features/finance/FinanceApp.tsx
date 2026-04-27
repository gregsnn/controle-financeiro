import { useEffect, useState } from 'react';
import { AppTabs } from './components/app-shell/AppTabs';
import { LoadingScreen } from './components/app-shell/LoadingScreen';
import { ExportButton } from './components/ExportButton';
import MonthNav from './components/MonthNav';
import {
  FixedExpensesSection,
  InstallmentsSection,
  RevenuesSection,
} from './components/sections/index';
import { SummaryDashboard } from './components/summary/SummaryDashboard';
import { useFinance } from './context/FinanceContext';
import { OVERRIDE_TYPES, TABS, type PieMode } from './domain/constants';
import { useCharts } from './hooks/useCharts';
import { useFinanceActions } from './hooks/useFinanceActions';
import { useFinanceData, useFinanceSettings, useMonthView } from './hooks/useFinanceData';
import { useMonthOverridesActions } from './hooks/useMonthOverridesActions';
import { prefetchChartModule } from './lib/chartLoader';
import { useI18n } from './lib/i18n';
import { monthLabel } from './lib/utils';

export default function FinanceApp() {
  const { t } = useI18n();
  const finance = useFinance();
  const { monthView, currentKey, currentDate } = useMonthView();
  const { fixedExpenses, revenues, monthOverrides } = useFinanceData();
  const settings = useFinanceSettings();
  const { isReady } = finance;
  const actions = useFinanceActions();
  const [activeTab, setActiveTab] = useState('resumo');
  const [pieMode, setPieMode] = useState<PieMode>('categories');
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
        <AppTabs tabs={TABS} activeTab={activeTab} translate={t} onChange={setActiveTab} />
      </header>

      <main className="app-content">
        {activeTab === 'resumo' && (
          <SummaryDashboard
            monthView={monthView}
            monthCardBills={monthCardBills}
            monthOverrides={monthOverrides}
            currentMonthKey={currentKey}
            pieMode={pieMode}
            setPieMode={setPieMode}
            pieChartRef={pieChartRef}
            barChartRef={barChartRef}
            onToggleMonthPaid={toggleMonthPaid}
          />
        )}

        {activeTab === 'gastos' && (
          <FixedExpensesSection
            items={fixedExpenses}
            currentMonthKey={currentKey}
            monthOverrides={monthOverrides}
            onAdd={(payload) => {
              const { ...rest } = payload;
              actions.addFixedExpense(rest as any);
            }}
            onEdit={(id, payload) => {
              const { ...rest } = payload;
              actions.updateFixedExpense(id, rest as any);
            }}
            onDelete={actions.removeFixedExpense}
            onTogglePaid={(itemId, paid) =>
              toggleMonthPaid(OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT, itemId, paid)
            }
          />
        )}

        {activeTab === 'parcelas' && (
          <InstallmentsSection
            items={monthView.installments as any}
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
