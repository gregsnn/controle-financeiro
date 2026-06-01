import {
  ALLOWED_PAYMENT_METHODS,
  DEFAULT_CARD_ID,
  OVERRIDE_TYPES,
  type BillCard,
} from '../domain/constants.js';
import type {
  MonthOverride,
  MonthView,
  MonthViewFixedExpense,
  MonthViewInstallment,
  MonthViewVariableExpense,
  Revenue,
} from '../domain/types.js';

export function readCardBill(
  cardBills: Record<string, number> | null | undefined,
  card: string
): number {
  const parsed = Number(cardBills?.[card] || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getExpenseCard(item: {
  paymentMethod?: string;
  card?: string | null;
}): BillCard | null {
  // support legacy and direct card paymentMethod values — treat unknown paymentMethod strings as dynamic card ids
  if (!item.paymentMethod) return null;
  if (item.paymentMethod === 'cartao') return (item.card || DEFAULT_CARD_ID) as BillCard;
  if (!(ALLOWED_PAYMENT_METHODS as readonly string[]).includes(item.paymentMethod)) {
    return item.paymentMethod as BillCard;
  }
  return null;
}

export function buildTrackedCardBills(monthView: MonthView): Record<string, number> {
  const trackedCardBills: Record<string, number> = {};

  monthView.fixedExpenses.forEach((item) => {
    const card = getExpenseCard(item as MonthViewFixedExpense);
    if (!card) return;
    trackedCardBills[card] = (trackedCardBills[card] || 0) + Number(item.amount || 0);
  });

  (monthView.variableExpenses || []).forEach((item) => {
    const card = getExpenseCard(item as MonthViewVariableExpense);
    if (!card) return;
    trackedCardBills[card] = (trackedCardBills[card] || 0) + Number(item.amount || 0);
  });

  monthView.installments.forEach((item) => {
    const card = (item.card || DEFAULT_CARD_ID) as BillCard;
    trackedCardBills[card] = (trackedCardBills[card] || 0) + Number(item.installmentValue || 0);
  });

  return trackedCardBills;
}

export function mergeCardBillsWithTrackedExpenses(
  cardBills: Record<string, number> | null | undefined,
  trackedCardBills: Record<string, number>
): Record<string, number> {
  const merged: Record<string, number> = { ...(cardBills || {}) };
  Object.entries(trackedCardBills).forEach(([card, trackedAmount]) => {
    const currentBill = readCardBill(merged, card);
    const parsedTrackedAmount = Number(trackedAmount || 0);
    if (Number.isFinite(parsedTrackedAmount) && parsedTrackedAmount > currentBill) {
      merged[card] = parsedTrackedAmount;
    }
  });
  return merged;
}

export function buildBillPaymentMap(
  monthOverrides: MonthOverride[],
  currentMonthKey: string
): Record<string, boolean> {
  return (monthOverrides || [])
    .filter(
      (override) =>
        override.type === OVERRIDE_TYPES.CARD_BILL_PAYMENT && override.monthKey === currentMonthKey
    )
    .reduce(
      (acc, override) => {
        acc[override.itemId] = override.paid === true;
        return acc;
      },
      {} as Record<string, boolean>
    );
}

export function markBillAsPaid(
  cardKey: string,
  cardBills: Record<string, number> | null | undefined,
  fixedExpenses: MonthViewFixedExpense[],
  installments: MonthViewInstallment[],
  billPaymentMap: Record<string, boolean>,
  variableExpenses: MonthViewVariableExpense[] = []
): void {
  // Marcar despesas fixas como pagas
  fixedExpenses.forEach((expense) => {
    let card = getExpenseCard(expense);
    // fallback: some test fixtures / legacy items may set `card` directly
    if (!card && (expense as any).card) {
      card = (expense as any).card as BillCard;
    }
    if (card === cardKey && !expense.paid) {
      expense.paid = true;
    }
  });

  variableExpenses.forEach((expense) => {
    let card = getExpenseCard(expense);
    if (!card && (expense as any).card) {
      card = (expense as any).card as BillCard;
    }
    if (card === cardKey && !expense.paid) {
      expense.paid = true;
    }
  });

  // Marcar parcelas como pagas
  installments.forEach((installment) => {
    if (installment.card === cardKey && !installment.paid) {
      installment.paid = true;
    }
  });

  // Atualizar o mapa de pagamento da fatura
  if (cardBills && cardBills[cardKey]) {
    billPaymentMap[cardKey] = true;
  }
}

interface SummaryData {
  fixedExpensesNonCard: number;
  despesasBrutas: number;
  despesasPagasBrutas: number;
  aPagar: number;
  saldo: number;
  saldoPrevisto: number;
  hasNegativeBalance: boolean;
  billCardsSummary: Array<{
    key: string;
    label: string;
    bill: number;
    fixedOnCard: number;
    abatimento: number;
    restanteFatura: number;
    paid: boolean;
  }>;
  revenues: Revenue[];
  totals: MonthView['totals'];
}

export function buildSummaryData(
  monthView: MonthView,
  cardBills: Record<string, number> | null | undefined,
  monthOverrides: MonthOverride[],
  currentMonthKey: string,
  cardList?: { key: string; label: string }[]
): SummaryData {
  const { fixedExpenses, variableExpenses = [], installments, revenues, totals } = monthView;

  const billPaymentMap = buildBillPaymentMap(monthOverrides, currentMonthKey);

  const fixedExpensesByCard: Record<BillCard, number> = {} as Record<BillCard, number>;
  fixedExpenses.forEach((item) => {
    const card = getExpenseCard(item as MonthViewFixedExpense);
    if (!card) return;
    fixedExpensesByCard[card] = (fixedExpensesByCard[card] || 0) + Number(item.amount || 0);
  });

  variableExpenses.forEach((item) => {
    const card = getExpenseCard(item as MonthViewVariableExpense);
    if (!card) return;
    fixedExpensesByCard[card] = (fixedExpensesByCard[card] || 0) + Number(item.amount || 0);
  });

  const installmentsByCard: Record<BillCard, number> = {} as Record<BillCard, number>;
  installments.forEach((item) => {
    const card = (item.card || DEFAULT_CARD_ID) as BillCard;
    installmentsByCard[card] = (installmentsByCard[card] || 0) + Number(item.installmentValue || 0);
  });

  const fixedExpensesNonCard = fixedExpenses
    .filter((item) => !getExpenseCard(item as MonthViewFixedExpense))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const variableExpensesNonCard = variableExpenses
    .filter((item) => !getExpenseCard(item as MonthViewVariableExpense))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const fixedExpensesPaidByCard: Record<BillCard, number> = {} as Record<BillCard, number>;
  fixedExpenses.forEach((item) => {
    const card = getExpenseCard(item as MonthViewFixedExpense);
    if (!card || item.paid !== true) return;
    fixedExpensesPaidByCard[card] = (fixedExpensesPaidByCard[card] || 0) + Number(item.amount || 0);
  });

  variableExpenses.forEach((item) => {
    const card = getExpenseCard(item as MonthViewVariableExpense);
    if (!card || item.paid !== true) return;
    fixedExpensesPaidByCard[card] = (fixedExpensesPaidByCard[card] || 0) + Number(item.amount || 0);
  });

  const installmentsPaidByCard: Record<BillCard, number> = {} as Record<BillCard, number>;
  installments.forEach((item) => {
    const card = (item.card || DEFAULT_CARD_ID) as BillCard;
    if (item.paid !== true) return;
    installmentsPaidByCard[card] =
      (installmentsPaidByCard[card] || 0) + Number(item.installmentValue || 0);
  });

  const fixedExpensesNonCardPaid = fixedExpenses
    .filter((item) => !getExpenseCard(item as MonthViewFixedExpense) && item.paid === true)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const variableExpensesNonCardPaid = variableExpenses
    .filter((item) => !getExpenseCard(item as MonthViewVariableExpense) && item.paid === true)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // Include all cards: those with fixed/installments AND those with bills
  const billKeys = Object.keys(cardBills || {}).filter(Boolean) as string[];
  const cardKeys = new Set<BillCard>([
    ...(Object.keys(fixedExpensesByCard) as BillCard[]),
    ...(Object.keys(installmentsByCard) as BillCard[]),
    ...billKeys,
  ]);

  let cardGrossExpenses = 0;
  let cardPaidExpenses = 0;
  cardKeys.forEach((card) => {
    const bill = readCardBill(cardBills, card);
    const fixedOnCard = fixedExpensesByCard[card] || 0;
    const installmentsOnCard = installmentsByCard[card] || 0;
    const trackedCardExpenses = fixedOnCard + installmentsOnCard;
    const trackedCardPaidExpenses =
      (fixedExpensesPaidByCard[card] || 0) + (installmentsPaidByCard[card] || 0);
    const billPaid = billPaymentMap[card] === true;

    if (bill > 0) {
      cardGrossExpenses += bill;
      cardPaidExpenses += billPaid ? bill : 0;
      return;
    }

    cardGrossExpenses += trackedCardExpenses;
    cardPaidExpenses += trackedCardPaidExpenses;
  });

  const despesasBrutas = fixedExpensesNonCard + variableExpensesNonCard + cardGrossExpenses;
  const despesasPagasBrutas =
    fixedExpensesNonCardPaid + variableExpensesNonCardPaid + cardPaidExpenses;
  const aPagar = Math.max(0, despesasBrutas - despesasPagasBrutas);
  const saldo = totals.receitas - despesasPagasBrutas;
  const saldoPrevisto = totals.receitas - despesasBrutas;
  const hasNegativeBalance = saldoPrevisto < 0;

  // build dynamic list of cards to summarize: respect order from cardList (settings.cardBills),
  // then append any cards with data that weren't in the list
  const keysFromList = (cardList || []).map((c: any) => c.key ?? c.id).filter(Boolean) as string[];
  const keysWithDataNotInList = Array.from(cardKeys)
    .concat(billKeys)
    .filter((k) => !keysFromList.includes(k as string));
  const combinedKeys = [...keysFromList, ...keysWithDataNotInList].filter(Boolean);

  const billCardsSummary = combinedKeys.map((key) => {
    const bill = readCardBill(cardBills, key);
    const fixedOnCard = fixedExpensesByCard[key] || 0;
    const installmentsOnCard = installmentsByCard[key] || 0;
    const abatimento = fixedOnCard + installmentsOnCard;
    const restanteFatura = bill > 0 ? Math.max(0, bill - abatimento) : 0;
    const paid = billPaymentMap[key] === true;
    const found = (cardList || []).find((c) => c.key === key);
    const label = (found && found.label) || key;

    return { key, label, bill, fixedOnCard, abatimento, restanteFatura, paid };
  });

  return {
    fixedExpensesNonCard,
    despesasBrutas,
    despesasPagasBrutas,
    aPagar,
    saldo,
    saldoPrevisto,
    hasNegativeBalance,
    billCardsSummary,
    revenues,
    totals,
  };
}
