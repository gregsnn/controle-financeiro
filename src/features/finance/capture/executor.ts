import type { CaptureDraft } from './types';
import type { CardBillItem } from '../domain/types';

export interface CaptureExecutorActions {
  addVariableExpense: (payload: Record<string, unknown>) => void | Promise<void>;
  addFixedExpense: (payload: Record<string, unknown>) => void | Promise<void>;
  addInstallment: (payload: Record<string, unknown>) => void | Promise<void>;
  addRevenue: (payload: Record<string, unknown>) => void | Promise<void>;
  setMonthCardBill: (cardId: string, amount: number) => void | Promise<void>;
  setCardBillPaid: (cardId: string, paid: boolean) => void | Promise<void>;
  setFixedExpensePaid: (itemId: string, paid: boolean) => void | Promise<void>;
  setInstallmentPaid: (itemId: string, paid: boolean) => void | Promise<void>;
  setRevenueReceived: (itemId: string, received: boolean) => void | Promise<void>;
}

export interface CaptureExecutionContext {
  currentMonthKey: string;
  cards?: CardBillItem[];
}

export interface CaptureExecutionResult {
  executed: boolean;
  reason?: string;
}

function amountFrom(draft: CaptureDraft) {
  return Number(draft.fields.amount || 0);
}

function descriptionFrom(draft: CaptureDraft) {
  return String(draft.fields.description || '').trim();
}

function dateFrom(draft: CaptureDraft, currentMonthKey: string) {
  return String(draft.fields.date || `${currentMonthKey}-01`);
}

function monthFrom(draft: CaptureDraft, currentMonthKey: string) {
  const monthKey = dateFrom(draft, currentMonthKey).slice(0, 7);
  return /^\d{4}-\d{2}$/.test(monthKey) ? monthKey : currentMonthKey;
}

function addMonths(monthKey: string, months: number) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + months, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function installmentStartMonthFrom(draft: CaptureDraft, context: CaptureExecutionContext) {
  const purchaseMonth = monthFrom(draft, context.currentMonthKey);
  const purchaseDay = Number(draft.fields.day || 0);
  const cardId = String(draft.fields.card || '');
  const card = context.cards?.find((item) => item.id === cardId);
  const dueDay = Number(card?.dueDay || 0);
  const explicitClosingDay = Number(card?.closingDay || 0);
  const inferredClosingDay = explicitClosingDay || (dueDay > 6 ? dueDay - 6 : 0);

  if (!purchaseDay || !inferredClosingDay) return purchaseMonth;

  return purchaseDay >= inferredClosingDay ? addMonths(purchaseMonth, 1) : purchaseMonth;
}

function installmentValueFrom(draft: CaptureDraft) {
  const amount = amountFrom(draft);
  const totalInstallments = Number(draft.fields.totalInstallments || 1);

  if (draft.fields.amountRole === 'installmentValue') return amount;
  if (draft.fields.amountRole === 'totalAmount') return amount / totalInstallments;
  return amount / totalInstallments;
}

function assertExecutable(draft: CaptureDraft): CaptureExecutionResult | null {
  if (draft.intent === 'unknown') {
    return { executed: false, reason: 'unknown-intent' };
  }
  if (draft.missingFields.length > 0) {
    return { executed: false, reason: `missing:${draft.missingFields.join(',')}` };
  }
  return null;
}

export async function executeCaptureDraft(
  draft: CaptureDraft,
  context: CaptureExecutionContext,
  actions: CaptureExecutorActions
): Promise<CaptureExecutionResult> {
  const blocked = assertExecutable(draft);
  if (blocked) return blocked;

  const amount = amountFrom(draft);
  const description = descriptionFrom(draft);
  const date = dateFrom(draft, context.currentMonthKey);

  if (draft.intent === 'variableExpense') {
    await actions.addVariableExpense({
      name: description,
      amount,
      date,
      monthKey: date.slice(0, 7),
      category: draft.fields.category || 'outro',
      paymentMethod: draft.fields.paymentMethod || (draft.fields.card ? 'cartao' : 'pix'),
      card: draft.fields.card || null,
      paid: draft.fields.card ? false : true,
      notes: draft.fields.notes || '',
    });
    return { executed: true };
  }

  if (draft.intent === 'fixedExpense') {
    await actions.addFixedExpense({
      name: description,
      amount,
      dueDay: Number(draft.fields.day),
      startMonth: context.currentMonthKey,
      paymentMethod: draft.fields.paymentMethod || (draft.fields.card ? 'cartao' : 'boleto'),
      card: draft.fields.card || null,
      category: draft.fields.category || 'outro',
      notes: draft.fields.notes || '',
    });
    return { executed: true };
  }

  if (draft.intent === 'installment') {
    const totalInstallments = Number(draft.fields.totalInstallments || 1);
    await actions.addInstallment({
      name: description,
      totalInstallments,
      currentInstallment: Number(draft.fields.currentInstallment || 1),
      installmentValue: installmentValueFrom(draft),
      card: draft.fields.card,
      category: draft.fields.category || 'outro',
      startMonth: installmentStartMonthFrom(draft, context),
    });
    return { executed: true };
  }

  if (draft.intent === 'revenue') {
    await actions.addRevenue({
      name: description,
      baseAmount: amount,
      active: true,
      startMonth: context.currentMonthKey,
      paymentDay: draft.fields.day || null,
      recurring: draft.fields.recurring === true,
      endMonth: null,
      notes: '',
    });
    return { executed: true };
  }

  if (draft.intent === 'cardBill' && draft.fields.card) {
    await actions.setMonthCardBill(String(draft.fields.card), amount);
    return { executed: true };
  }

  if (draft.intent === 'markAsPaid' && draft.fields.card) {
    await actions.setCardBillPaid(String(draft.fields.card), true);
    return { executed: true };
  }

  if (draft.intent === 'markAsPaid' && draft.fields.paymentTarget) {
    const targetId = String(draft.fields.paymentTarget);
    if (draft.fields.paymentTargetType === 'fixedExpense') {
      await actions.setFixedExpensePaid(targetId, true);
      return { executed: true };
    }
    if (draft.fields.paymentTargetType === 'installment') {
      await actions.setInstallmentPaid(targetId, true);
      return { executed: true };
    }
    if (draft.fields.paymentTargetType === 'cardBill') {
      await actions.setCardBillPaid(targetId, true);
      return { executed: true };
    }
    if (draft.fields.paymentTargetType === 'revenue') {
      await actions.setRevenueReceived(targetId, true);
      return { executed: true };
    }
  }

  return { executed: false, reason: 'unsupported-draft' };
}
