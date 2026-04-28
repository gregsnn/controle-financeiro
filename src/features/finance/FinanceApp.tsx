import { useEffect, useState } from 'react';
import { AppTabs } from './components/app-shell/AppTabs';
import { LoadingScreen } from './components/app-shell/LoadingScreen';
import { ExportButton } from './components/ExportButton';
import { ImportButton } from './components/ImportButton';
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
import { monthLabel, isMonthInRange } from './lib/utils';
import { decodeHashToState, buildFinanceStateFromBackup } from '../../lib/exportData';

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

  const handleSetCardList = (nextCardList: typeof settings.cardBills) => {
    actions.setCardBills(nextCardList);
  };

  const existingCardIds = new Set((settings.cardBills || []).map((card) => card.id));
  const cardDeleteReasons = (() => {
    const reasons: Record<string, string> = {};

    const allUsedCardIds = new Set<string>([
      ...fixedExpenses
        .filter((item) => item.paymentMethod === 'cartao' && !!item.card && isMonthInRange(currentKey, item.startMonth, item.endMonth))
        .map((item) => item.card as string),
      ...monthView.installments.filter((item) => !!item.card).map((item) => item.card as string),
      ...Object.keys(monthCardBills || {}),
    ]);

    allUsedCardIds.forEach((cardId) => {
      if (!existingCardIds.has(cardId)) return;

      const labels: string[] = [];
      if (fixedExpenses.some((item) => item.paymentMethod === 'cartao' && item.card === cardId && isMonthInRange(currentKey, item.startMonth, item.endMonth))) {
        labels.push('gastos fixos');
      }
      if (monthView.installments.some((item) => item.card === cardId)) {
        labels.push('parcelamentos');
      }
      if (Object.prototype.hasOwnProperty.call(monthCardBills, cardId)) {
        labels.push('fatura do mês');
      }

      if (labels.length > 0) {
        reasons[cardId] = labels.join(', ');
      }
    });

    return reasons;
  })();

  useEffect(() => {
    prefetchChartModule();
  }, []);

  useEffect(() => {
    const checkHash = () => {
      const fullUrl = window.location.href;
      const hashIndex = fullUrl.indexOf('#');
      const hash = hashIndex >= 0 ? fullUrl.substring(hashIndex) : '';
      console.log('Verificando hash:', hash.substring(0, 60));

      if (!hash.includes('import=')) return;

      const encoded = hash.split('import=')[1]?.split('&')[0];
      if (!encoded) {
        window.location.hash = '';
        return;
      }

      try {
        const decoded = decodeURIComponent(encoded);
        const data = decodeHashToState(decoded);
        if (!data) {
          alert('Link de importação inválido ou expirado.');
          window.location.hash = '';
          return;
        }

        const confirmed = window.confirm('Deseja importar os dados do link? Isso substituirá seus dados atuais.');
        if (confirmed) {
          try {
            const state = buildFinanceStateFromBackup(data);
            actions.importFinanceState(state);
            alert('Dados importados com sucesso! A página será recarregada.');
            setTimeout(() => window.location.reload(), 500);
          } catch (err) {
            console.error('Erro ao importar:', err);
            alert('Erro ao importar dados. Verifique o console (F12).');
          }
        }
      } catch (e) {
        console.error('Erro ao decodificar link:', e);
        alert('Link de importação inválido.');
      }

      window.location.hash = '';
    };

    // Pequeno delay para garantir que a URL está carregada
    const timer = setTimeout(checkHash, 100);
    return () => clearTimeout(timer);
  }, [actions]);

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
          cardList={settings.cardBills}
          onSetCardList={handleSetCardList}
          cardDeleteReasons={cardDeleteReasons}
        />

        <div className="finance-backup-actions">
          <ExportButton />
          <ImportButton />
        </div>
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
            cardList={settings.cardBills}
          />
        )}

        {activeTab === 'gastos' && (
          <FixedExpensesSection
            items={fixedExpenses}
            currentMonthKey={currentKey}
            monthOverrides={monthOverrides}
            cardList={settings.cardBills}
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
            cardList={settings.cardBills}
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
