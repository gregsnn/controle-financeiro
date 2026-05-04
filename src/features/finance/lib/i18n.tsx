import { createContext, useCallback, useContext, useState } from 'react';

const translations = {
  'pt-BR': {
    'tabs.resumo': 'Resumo',
    'tabs.gastos': 'Gastos Fixos',
    'tabs.parcelas': 'Parcelamentos',
    'tabs.receitas': 'Receitas',
    'month.prev': 'Mês anterior',
    'month.next': 'Próximo mês',
    'theme.toggle': 'Alternar tema',
    'theme.light': 'Claro',
    'theme.dark': 'Escuro',
    'card.bills': 'Faturas do mês',
    'card.santander': 'Santander',
    'card.nubank': 'Nubank',
    'summary.balance': 'Saldo previsto',
    'summary.income': 'Receitas',
    'summary.expenses': 'Despesas',
    'summary.paid': 'Pago até agora',
    'summary.expected': 'Prévia após quitar tudo',
    'summary.installments': 'Parcelas',
    'summary.balanceLabel': 'SALDO',
    'summary.aPagar': 'A PAGAR',
    'summary.revenues': 'RECEITAS',
    'summary.expensesLabel': 'DESPESAS',
    'bill.cardBill': 'FATURA',
    'bill.paid': 'Fatura paga no mês',
    'bill.remaining': 'Restante para pagar',
    'bill.discount': 'Abatimento',
    'chart.byCategory': 'DISTRIBUIÇÃO DE DESPESAS',
    'chart.byCard': 'DESPESAS POR CARTÃO',
    'chart.paidPending': 'PAGO X PENDENTE (RASTREADO)',
    'chart.installments': 'PARCELAMENTOS',
    'chart.categories': 'Categorias',
    'chart.cards': 'Cartões',
    'chart.paidXPending': 'Pago x pendente',
    'metrics.totalMonth': 'TOTAL/MÊS',
    'metrics.totalRemaining': 'TOTAL RESTANTE',
    'metrics.almostDone': 'QUASE NO FIM',
    'metrics.almostDoneSub': 'acima de 75% pagas',
    'section.fixedExpenses': 'GASTOS FIXOS',
    'section.revenues': 'RECEITAS',
    'section.installments': 'PARCELAMENTOS',
    'empty.noFixedExpenses': 'Nenhum gasto fixo cadastrado ainda.',
    'empty.noRevenues': 'Nenhuma receita cadastrada ainda.',
    'empty.noInstallments': 'Nenhum parcelamento cadastrado ainda.',
    'add.newFixedExpense': '+ Novo gasto fixo',
    'add.newRevenue': '+ Nova receita',
    'add.newInstallment': '+ Novo parcelamento',
    'form.name': 'Nome',
    'form.amount': 'Valor',
    'form.dueDay': 'Dia de vencimento',
    'form.startMonth': 'Mês de início',
    'form.paymentMethod': 'Forma de pagamento',
    'form.category': 'Categoria',
    'form.installmentValue': 'Valor da parcela',
    'form.totalInstallments': 'Total de parcelas',
    'form.card': 'Cartão',
    save: 'Salvar',
    saveChanges: 'Salvar alterações',
    addItem: 'Adicionar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    'confirm.delete': 'Confirmar exclusão',
    'confirm.deleteFixedExpense': 'Tem certeza que deseja apagar o gasto fixo',
    'confirm.deleteRevenue': 'Tem certeza que deseja apagar a receita',
    'confirm.deleteInstallment': 'Tem certeza que deseja apagar o parcelamento',
    loading: 'Carregando...',
  },
  'en-US': {
    'tabs.resumo': 'Summary',
    'tabs.gastos': 'Fixed Expenses',
    'tabs.parcelas': 'Installments',
    'tabs.receitas': 'Income',
    'month.prev': 'Previous month',
    'month.next': 'Next month',
    'theme.toggle': 'Toggle theme',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'card.bills': 'Card bills',
    'card.santander': 'Santander',
    'card.nubank': 'Nubank',
    'summary.balance': 'Projected balance',
    'summary.income': 'Income',
    'summary.expenses': 'Expenses',
    'summary.paid': 'Paid so far',
    'summary.expected': 'Expected after paying all',
    'summary.installments': 'Installments',
    'summary.balanceLabel': 'BALANCE',
    'summary.aPagar': 'TO PAY',
    'summary.revenues': 'INCOME',
    'summary.expensesLabel': 'EXPENSES',
    'bill.cardBill': 'BILL',
    'bill.paid': 'Bill paid this month',
    'bill.remaining': 'Remaining to pay',
    'bill.discount': 'Discount',
    'chart.byCategory': 'EXPENSE DISTRIBUTION',
    'chart.byCard': 'EXPENSES BY CARD',
    'chart.paidPending': 'PAID X PENDING (TRACKED)',
    'chart.installments': 'INSTALLMENTS',
    'chart.categories': 'Categories',
    'chart.cards': 'Cards',
    'chart.paidXPending': 'Paid x pending',
    'metrics.totalMonth': 'TOTAL/MONTH',
    'metrics.totalRemaining': 'REMAINING TOTAL',
    'metrics.almostDone': 'ALMOST DONE',
    'metrics.almostDoneSub': '75%+ paid',
    'section.fixedExpenses': 'FIXED EXPENSES',
    'section.revenues': 'INCOME',
    'section.installments': 'INSTALLMENTS',
    'empty.noFixedExpenses': 'No fixed expenses registered yet.',
    'empty.noRevenues': 'No income registered yet.',
    'empty.noInstallments': 'No installments registered yet.',
    'add.newFixedExpense': '+ New fixed expense',
    'add.newRevenue': '+ New income',
    'add.newInstallment': '+ New installment',
    'form.name': 'Name',
    'form.amount': 'Amount',
    'form.dueDay': 'Due day',
    'form.startMonth': 'Start month',
    'form.paymentMethod': 'Payment method',
    'form.category': 'Category',
    'form.installmentValue': 'Installment amount',
    'form.totalInstallments': 'Total installments',
    'form.card': 'Card',
    save: 'Save',
    saveChanges: 'Save changes',
    addItem: 'Add',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    'confirm.delete': 'Confirm deletion',
    'confirm.deleteFixedExpense': 'Are you sure you want to delete this fixed expense',
    'confirm.deleteRevenue': 'Are you sure you want to delete this income',
    'confirm.deleteInstallment': 'Are you sure you want to delete this installment',
    loading: 'Loading...',
  },
};

interface I18nContextType {
  locale: string;
  t: (key: string) => string;
  changeLocale: (newLocale: string) => void;
  availableLocales: string[];
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({
  children,
  initialLocale = 'pt-BR',
}: {
  children: React.ReactNode;
  initialLocale?: string;
}) {
  const [locale, setLocale] = useState(initialLocale);

  const t = useCallback(
    (key: string) => {
      const lang = translations[locale as keyof typeof translations];
      if (lang && lang[key as keyof typeof lang] !== undefined)
        return lang[key as keyof typeof lang];
      const fallback = translations['pt-BR'];
      if (fallback && fallback[key as keyof typeof fallback] !== undefined)
        return fallback[key as keyof typeof fallback];
      return key;
    },
    [locale]
  );

  const changeLocale = useCallback((newLocale: string) => {
    if (translations[newLocale as keyof typeof translations]) {
      setLocale(newLocale);
    }
  }, []);

  const value = { locale, t, changeLocale, availableLocales: Object.keys(translations) } as const;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: 'pt-BR',
      t: (key: string) => key,
      changeLocale: () => {},
      availableLocales: ['pt-BR', 'en-US'],
    };
  }
  return context;
}
