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
import { type PieMode, OVERRIDE_TYPES } from './domain/constants';
import { useCardDeleteReasons } from './hooks/useCardDeleteReasons';
import { useCharts } from './hooks/useCharts';
import { useFinanceActions } from './hooks/useFinanceActions';
import { useFinanceSettings } from './hooks/useFinanceData';
import { useHashImport } from './hooks/useHashImport';
import { useMonthOverridesActions } from './hooks/useMonthOverridesActions';
import { prefetchChartModule } from './lib/chartLoader';
import { useI18n } from './lib/i18n';
import { monthLabel } from './lib/utils';
import { TABS } from './ui/constants';

export default function FinanceApp() {
  const { t } = useI18n();
  const finance = useFinance();
  const { monthView, currentKey, currentDate } = finance;
  const { fixedExpenses, revenues, monthOverrides } = finance;
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

  const handleSetCardList = (nextCardList: typeof settings.cardBills) => {
    actions.setCardBills(nextCardList);
  };

  const cardBillsList = settings.cardBills;
  const cardListMapped = settings.cardBills?.map((cb) => ({ key: cb.id, label: cb.name }));

  const cardDeleteReasons = useCardDeleteReasons({
    cardBills: settings.cardBills || [],
    fixedExpenses,
    monthViewInstallments: monthView.installments,
    monthCardBills,
    currentKey,
  });

  useEffect(() => {
    prefetchChartModule();
  }, []);

  useHashImport({ onImport: actions.importFinanceState });

  const renderTabContent = (tabId: string) => {
    if (tabId === 'resumo') {
      return (
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
          cardList={cardListMapped}
        />
      );
    }

    if (tabId === 'gastos') {
      return (
        <FixedExpensesSection
          items={fixedExpenses}
          currentMonthKey={currentKey}
          monthOverrides={monthOverrides}
          cardList={cardBillsList}
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
      );
    }

    if (tabId === 'parcelas') {
      return (
        <InstallmentsSection
          items={monthView.installments as any}
          currentMonthKey={currentKey}
          monthOverrides={monthOverrides}
          cardList={cardBillsList}
          onAdd={actions.addInstallment}
          onEdit={actions.updateInstallment}
          onDelete={actions.removeInstallment}
          onTogglePaid={(itemId, paid) =>
            toggleMonthPaid(OVERRIDE_TYPES.INSTALLMENT_PAYMENT, itemId, paid)
          }
        />
      );
    }

    return (
      <RevenuesSection
        items={revenues}
        currentMonthKey={currentKey}
        monthRevenueAmounts={monthRevenueAmounts}
        onAdd={actions.addRevenue}
        onEdit={actions.updateRevenue}
        onDelete={actions.removeRevenue}
        onMonthRevenueAmount={setMonthRevenueAmount}
      />
    );
  };

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
          cardList={cardBillsList}
          onSetCardList={handleSetCardList}
          cardDeleteReasons={cardDeleteReasons}
        />

        <div className="finance-backup-actions">
          <ExportButton />
        </div>
        <AppTabs tabs={TABS} activeTab={activeTab} translate={t} onChange={setActiveTab} />
      </header>

      <main className="app-content" aria-live="polite">
        <div className="app-screen app-screen--active" key={activeTab}>
          {renderTabContent(activeTab)}
        </div>
      </main>
    </div>
  );
}
