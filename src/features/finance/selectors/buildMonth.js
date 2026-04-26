import { OVERRIDE_TYPES } from '../domain/constants.js';
import { formatMoney, isMonthInRange, monthKey } from '../lib/utils.js';

function applyOverride(baseItem, override) {
  if (!override) return baseItem;

  return {
    ...baseItem,
    ...('name' in override ? { name: override.name } : {}),
    ...('amount' in override ? { amount: override.amount } : {}),
    ...('hidden' in override ? { hidden: override.hidden } : {}),
    overrideId: override.id,
  };
}

function applyRevenueOverride(baseItem, override) {
  if (!override) return baseItem;
  return {
    ...baseItem,
    amount: override,
    overrideId: override.id,
  };
}

function getOverridesMap(monthOverrides, monthKeyValue) {
  return monthOverrides.reduce((acc, override) => {
    if (override.monthKey !== monthKeyValue) return acc;
    const bucket = acc[override.type] || new Map();
    bucket.set(override.itemId, override);
    acc[override.type] = bucket;
    return acc;
  }, {});
}

function calculateCurrentInstallment(startMonth, currentInstallment, currentMonthKey) {
  const start = new Date(`${startMonth}-01`);
  const current = new Date(`${currentMonthKey}-01`);
  const monthsDiff =
    (current.getFullYear() - start.getFullYear()) * 12 + (current.getMonth() - start.getMonth());
  return Math.max(1, (currentInstallment || 1) + monthsDiff);
}

export function buildMonthView(state, monthDate = state.currentDate) {
  const currentMonthKey = monthKey(monthDate);
  const overridesMap = getOverridesMap(state.monthOverrides, currentMonthKey);
  const monthRevenueAmounts = {};
  (state.monthOverrides || [])
    .filter(
      (override) =>
        override.type === OVERRIDE_TYPES.REVENUE_AMOUNT && override.monthKey === currentMonthKey
    )
    .forEach((override) => {
      monthRevenueAmounts[override.itemId] = override.amount;
    });

  const fixedExpenses = state.fixedExpenses
    .filter((item) => item.active !== false)
    .filter((item) => isMonthInRange(currentMonthKey, item.startMonth, item.endMonth))
    .map((item) => applyOverride(item, overridesMap[OVERRIDE_TYPES.FIXED_EXPENSE]?.get(item.id)))
    .map((item) => ({
      ...item,
      paid: overridesMap[OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT]?.get(item.id)?.paid === true,
    }))
    .filter((item) => item.hidden !== true);

  const revenues = state.revenues
    .filter((item) => item.active !== false)
    .filter((item) => isMonthInRange(currentMonthKey, item.startMonth, item.endMonth))
    .map((item) => {
      const revenueAmount = monthRevenueAmounts?.[item.id];
      if (revenueAmount !== undefined) {
        return { ...item, amount: revenueAmount };
      }
      return item;
    })
    .filter((item) => item.hidden !== true);

  const installments = state.installments
    .filter((item) => item.active !== false)
    .filter((item) => isMonthInRange(currentMonthKey, item.startMonth, item.closedAt))
    .filter((item) => currentMonthKey >= item.startMonth)
    .map((item) => {
      const calculatedInstallment = calculateCurrentInstallment(
        item.startMonth,
        item.currentInstallment || 1,
        currentMonthKey
      );
      return {
        ...item,
        currentInstallment: calculatedInstallment,
        totalInstallments: Number(item.totalInstallments || 1),
        installmentValue: Number(item.installmentValue || 0),
        paid: overridesMap[OVERRIDE_TYPES.INSTALLMENT_PAYMENT]?.get(item.id)?.paid === true,
      };
    })
    .filter((item) => item.currentInstallment <= item.totalInstallments);

  const receitasTotal = revenues.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const despesasFixasTotal = fixedExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const parcelasTotal = installments.reduce(
    (sum, item) => sum + Number(item.installmentValue || 0),
    0
  );
  const despesasFixasPagasTotal = fixedExpenses.reduce(
    (sum, item) => sum + (item.paid ? Number(item.amount || 0) : 0),
    0
  );
  const parcelasPagasTotal = installments.reduce(
    (sum, item) => sum + (item.paid ? Number(item.installmentValue || 0) : 0),
    0
  );

  const totals = {
    receitas: receitasTotal,
    fixedExpenses: despesasFixasTotal,
    installments: parcelasTotal,
    fixedExpensesPaid: despesasFixasPagasTotal,
    installmentsPaid: parcelasPagasTotal,
    despesasPaid: despesasFixasPagasTotal + parcelasPagasTotal,
    despesas: despesasFixasTotal + parcelasTotal,
    saldo: receitasTotal - despesasFixasTotal - parcelasTotal,
  };

  return {
    monthKey: currentMonthKey,
    fixedExpenses,
    revenues,
    installments,
    totals,
    summary: {
      receitasLabel: formatMoney(receitasTotal),
      despesasLabel: formatMoney(despesasFixasTotal + parcelasTotal),
      saldoLabel: formatMoney(totals.saldo),
    },
    alerts:
      totals.saldo < 0
        ? [
            {
              type: 'warning',
              message: `Despesas superam receitas em ${formatMoney(Math.abs(totals.saldo))} este mês.`,
            },
          ]
        : [],
  };
}
