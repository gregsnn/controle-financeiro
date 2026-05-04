import { OVERRIDE_TYPES } from '../domain/constants.js';
import type {
  FinanceState,
  FixedExpense,
  Installment,
  MonthOverride,
  MonthView,
  MonthViewFixedExpense,
  MonthViewInstallment,
  Revenue,
} from '../domain/types.js';
import { isMonthInRange, monthKey } from '../lib/utils.js';

interface OverrideWithHidden extends MonthOverride {
  hidden?: boolean;
}

function applyOverride<T extends object>(
  baseItem: T,
  override: OverrideWithHidden | undefined
): T & { overrideId?: string; hidden?: boolean } {
  if (!override) return baseItem;

  return {
    ...baseItem,
    ...('name' in override ? { name: override.name } : {}),
    ...('amount' in override ? { amount: override.amount } : {}),
    ...('hidden' in override ? { hidden: override.hidden } : {}),
    overrideId: override.id,
  };
}

type OverridesMap = Record<string, Map<string, MonthOverride>>;

function getOverridesMap(monthOverrides: MonthOverride[], monthKeyValue: string): OverridesMap {
  return monthOverrides.reduce((acc, override) => {
    if (override.monthKey !== monthKeyValue) return acc;
    const bucket = acc[override.type] || new Map();
    bucket.set(override.itemId, override);
    acc[override.type] = bucket;
    return acc;
  }, {} as OverridesMap);
}

function calculateCurrentInstallment(
  startMonth: string,
  currentInstallment: number,
  currentMonthKey: string
): number {
  const start = new Date(`${startMonth}-01`);
  const current = new Date(`${currentMonthKey}-01`);
  const monthsDiff =
    (current.getFullYear() - start.getFullYear()) * 12 + (current.getMonth() - start.getMonth());

  return Math.max(1, (currentInstallment || 1) + monthsDiff);
}

interface BuildMonthParams {
  fixedExpenses: FixedExpense[];
  installments: Installment[];
  revenues: Revenue[];
  monthOverrides: MonthOverride[];
  currentDate: Date;
}

export function buildMonthView(
  state: BuildMonthParams | FinanceState,
  monthDate: Date | null = null
): MonthView {
  const targetDate = monthDate || state.currentDate;
  const currentMonthKey = monthKey(targetDate);
  const overridesMap = getOverridesMap(state.monthOverrides, currentMonthKey);

  const monthRevenueAmounts: Record<string, number> = {};
  (state.monthOverrides || [])
    .filter(
      (override: MonthOverride) =>
        override.type === OVERRIDE_TYPES.REVENUE_AMOUNT && override.monthKey === currentMonthKey
    )
    .forEach((override: MonthOverride) => {
      if (override.amount !== undefined) {
        monthRevenueAmounts[override.itemId] = override.amount;
      }
    });

  const fixedExpenses: MonthViewFixedExpense[] = [];
  let despesasFixasTotal = 0;
  let despesasFixasPagasTotal = 0;

  // Single pass: combine all filters into one loop
  for (const item of state.fixedExpenses) {
    // Check all conditions in one pass
    if (item.active === false) continue;
    if (!isMonthInRange(currentMonthKey, item.startMonth, item.endMonth)) continue;

    const overridden = applyOverride(
      item,
      overridesMap[OVERRIDE_TYPES.FIXED_EXPENSE]?.get(item.id) as OverrideWithHidden | undefined
    ) as MonthViewFixedExpense;
    const paid = overridesMap[OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT]?.get(item.id)?.paid === true;
    const finalItem: MonthViewFixedExpense = { ...overridden, paid };

    // Skip hidden items but still count total
    if (!(finalItem as MonthViewFixedExpense & { hidden?: boolean }).hidden) {
      fixedExpenses.push(finalItem);
      despesasFixasTotal += Number(finalItem.amount || 0);
      despesasFixasPagasTotal += finalItem.paid ? Number(finalItem.amount || 0) : 0;
    }
  }

  const revenues: typeof state.revenues = [];
  let receitasTotal = 0;

  // Single pass: combine all filters into one loop
  for (const item of state.revenues) {
    // Check all conditions in one pass
    if (item.active === false) continue;
    if (!isMonthInRange(currentMonthKey, item.startMonth, item.endMonth)) continue;

    const revenueAmount = monthRevenueAmounts?.[item.id];
    const final = {
      ...item,
      amount: revenueAmount !== undefined ? revenueAmount : item.baseAmount,
    };
    revenues.push(final);
    receitasTotal += Number(final.amount || 0);
  }

  const installments: MonthViewInstallment[] = [];
  let installmentsTotal = 0;
  let installmentsPaidTotal = 0;

  // Single pass: combine all filters into one loop
  for (const item of state.installments) {
    // Check all conditions in one pass
    if (item.active === false) continue;
    if (!isMonthInRange(currentMonthKey, item.startMonth, item.closedAt)) continue;
    if (currentMonthKey < item.startMonth) continue;

    const calculatedInstallment = calculateCurrentInstallment(
      item.startMonth,
      item.currentInstallment || 1,
      currentMonthKey
    );
    const finalItem: MonthViewInstallment = {
      ...item,
      currentInstallment: calculatedInstallment,
      totalInstallments: Number(item.totalInstallments || 1),
      installmentValue: Number(item.installmentValue || 0),
      paid: overridesMap[OVERRIDE_TYPES.INSTALLMENT_PAYMENT]?.get(item.id)?.paid === true,
    };

    // Only add if current installment is still within range
    if (finalItem.currentInstallment <= finalItem.totalInstallments) {
      installments.push(finalItem);
      installmentsTotal += Number(finalItem.installmentValue || 0);
      installmentsPaidTotal += finalItem.paid ? Number(finalItem.installmentValue || 0) : 0;
    }
  }

  // totals computed during population loops above

  const totals = {
    receitas: receitasTotal,
    despesasFixas: despesasFixasTotal,
    installments: installmentsTotal,
    fixedExpensesPaid: despesasFixasPagasTotal,
    installmentsPaid: installmentsPaidTotal,
    despesasPaid: despesasFixasPagasTotal + installmentsPaidTotal,
    despesas: despesasFixasTotal + installmentsTotal,
    saldo: receitasTotal - despesasFixasTotal - installmentsTotal,
  };

  return {
    fixedExpenses,
    revenues,
    installments,
    totals,
  };
}
