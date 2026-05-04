import { ALLOWED_PAYMENT_METHODS, OVERRIDE_TYPES, type BillCard } from '../domain/constants.js';
import type { MonthOverride, MonthView, MonthViewFixedExpense, Revenue } from '../domain/types.js';

interface CardBills {
  [key: string]: number;
}

interface BillPaymentMap {
  [key: string]: boolean;
}

export function readCardBill(cardBills: CardBills | null | undefined, card: string): number {
  const parsed = Number(cardBills?.[card] || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getExpenseCard(item: {
  paymentMethod?: string;
  card?: string | null;
}): BillCard | null {
  // support legacy and direct card paymentMethod values — treat unknown paymentMethod strings as dynamic card ids
  if (!item.paymentMethod) return null;
  if (item.paymentMethod === 'cartao') return (item.card || 'outro') as BillCard;
  if (!(ALLOWED_PAYMENT_METHODS as readonly string[]).includes(item.paymentMethod)) {
    return item.paymentMethod as BillCard;
  }
  return null;
}

export function buildBillPaymentMap(
  monthOverrides: MonthOverride[],
  currentMonthKey: string
): BillPaymentMap {
  return (monthOverrides || [])
    .filter(
      (override) =>
        override.type === OVERRIDE_TYPES.CARD_BILL_PAYMENT && override.monthKey === currentMonthKey
    )
    .reduce((acc, override) => {
      acc[override.itemId] = override.paid === true;
      return acc;
    }, {} as BillPaymentMap);
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
  cardBills: CardBills | null | undefined,
  monthOverrides: MonthOverride[],
  currentMonthKey: string,
  cardList?: { key: string; label: string }[]
): SummaryData {
  const { fixedExpenses, installments, revenues, totals } = monthView;

  const billPaymentMap = buildBillPaymentMap(monthOverrides, currentMonthKey);

  const fixedExpensesByCard: Record<BillCard, number> = {} as Record<BillCard, number>;
  fixedExpenses.forEach((item) => {
    const card = getExpenseCard(item as MonthViewFixedExpense);
    if (!card) return;
    fixedExpensesByCard[card] = (fixedExpensesByCard[card] || 0) + Number(item.amount || 0);
  });

  const installmentsByCard: Record<BillCard, number> = {} as Record<BillCard, number>;
  installments.forEach((item) => {
    const card = (item.card || 'outro') as BillCard;
    installmentsByCard[card] = (installmentsByCard[card] || 0) + Number(item.installmentValue || 0);
  });

  const fixedExpensesNonCard = fixedExpenses
    .filter((item) => !getExpenseCard(item as MonthViewFixedExpense))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const fixedExpensesPaidByCard: Record<BillCard, number> = {} as Record<BillCard, number>;
  fixedExpenses.forEach((item) => {
    const card = getExpenseCard(item as MonthViewFixedExpense);
    if (!card || item.paid !== true) return;
    fixedExpensesPaidByCard[card] = (fixedExpensesPaidByCard[card] || 0) + Number(item.amount || 0);
  });

  const installmentsPaidByCard: Record<BillCard, number> = {} as Record<BillCard, number>;
  installments.forEach((item) => {
    const card = (item.card || 'outro') as BillCard;
    if (item.paid !== true) return;
    installmentsPaidByCard[card] =
      (installmentsPaidByCard[card] || 0) + Number(item.installmentValue || 0);
  });

  const fixedExpensesNonCardPaid = fixedExpenses
    .filter((item) => !getExpenseCard(item as MonthViewFixedExpense) && item.paid === true)
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

  const despesasBrutas = fixedExpensesNonCard + cardGrossExpenses;
  const despesasPagasBrutas = fixedExpensesNonCardPaid + cardPaidExpenses;
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
