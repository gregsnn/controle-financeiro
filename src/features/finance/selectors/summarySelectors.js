import { OVERRIDE_TYPES, BILL_CARDS, BILL_CARD_KEYS } from '../domain/constants.js';

export function readCardBill(cardBills, card) {
  if (!BILL_CARD_KEYS.includes(card)) return 0;
  const parsed = Number(cardBills?.[card] || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getExpenseCard(item) {
  if (item.paymentMethod === 'santander' || item.paymentMethod === 'nubank')
    return item.paymentMethod;
  if (item.paymentMethod === 'cartao') return item.card || 'outro';
  return null;
}

export function buildBillPaymentMap(monthOverrides, currentMonthKey) {
  return (monthOverrides || [])
    .filter(
      (override) =>
        override.type === OVERRIDE_TYPES.CARD_BILL_PAYMENT &&
        override.monthKey === currentMonthKey
    )
    .reduce((acc, override) => {
      acc[override.itemId] = override.paid === true;
      return acc;
    }, {});
}

export function buildSummaryData(monthView, cardBills, monthOverrides, currentMonthKey) {
  const { fixedExpenses, installments, revenues, totals } = monthView;

  const billPaymentMap = buildBillPaymentMap(monthOverrides, currentMonthKey);

  const fixedExpensesByCard = fixedExpenses.reduce((acc, item) => {
    const card = getExpenseCard(item);
    if (!card) return acc;
    acc[card] = (acc[card] || 0) + Number(item.amount || 0);
    return acc;
  }, {});

  const installmentsByCard = installments.reduce((acc, item) => {
    const card = item.card || 'outro';
    acc[card] = (acc[card] || 0) + Number(item.installmentValue || 0);
    return acc;
  }, {});

  const fixedExpensesNonCard = fixedExpenses
    .filter((item) => !getExpenseCard(item))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const fixedExpensesPaidByCard = fixedExpenses.reduce((acc, item) => {
    const card = getExpenseCard(item);
    if (!card || item.paid !== true) return acc;
    acc[card] = (acc[card] || 0) + Number(item.amount || 0);
    return acc;
  }, {});

  const installmentsPaidByCard = installments.reduce((acc, item) => {
    const card = item.card || 'outro';
    if (item.paid !== true) return acc;
    acc[card] = (acc[card] || 0) + Number(item.installmentValue || 0);
    return acc;
  }, {});

  const fixedExpensesNonCardPaid = fixedExpenses
    .filter((item) => !getExpenseCard(item) && item.paid === true)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const cardKeys = new Set([
    ...BILL_CARD_KEYS,
    ...Object.keys(fixedExpensesByCard),
    ...Object.keys(installmentsByCard),
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

  const billCardsSummary = BILL_CARDS.map(({ key, label }) => {
    const bill = readCardBill(cardBills, key);
    const fixedOnCard = fixedExpensesByCard[key] || 0;
    const installmentsOnCard = installmentsByCard[key] || 0;
    const abatimento = fixedOnCard + installmentsOnCard;
    const restanteFatura = bill > 0 ? Math.max(0, bill - abatimento) : 0;
    const paid = billPaymentMap[key] === true;

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