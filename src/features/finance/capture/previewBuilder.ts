import { formatMoney } from '../lib/utils';
import type { CaptureDraft, CapturePreview, CapturePreviewField } from './types';

const INTENT_TITLES: Record<CaptureDraft['intent'], string> = {
  variableExpense: 'Despesa variável',
  fixedExpense: 'Despesa fixa',
  installment: 'Parcelamento',
  revenue: 'Receita',
  cardBill: 'Fatura de cartão',
  markAsPaid: 'Marcar como pago',
  unknown: 'Revisar lançamento',
};

function field(key: string, label: string, value: unknown, required = false): CapturePreviewField {
  return {
    key,
    label,
    value: value as CapturePreviewField['value'],
    required,
  };
}

function buildSummary(draft: CaptureDraft) {
  const description = draft.fields.description
    ? String(draft.fields.description)
    : INTENT_TITLES[draft.intent];
  const amount = Number(draft.fields.amount || 0);
  if (
    draft.intent === 'installment' &&
    draft.fields.amountRole === 'installmentValue' &&
    draft.fields.totalInstallments &&
    amount > 0
  ) {
    return `${description} - ${draft.fields.totalInstallments}x de ${formatMoney(amount)}`;
  }
  return amount > 0 ? `${description} - ${formatMoney(amount)}` : description;
}

export function buildCapturePreview(draft: CaptureDraft): CapturePreview {
  const fields: CapturePreviewField[] = [
    field('description', 'Descrição', draft.fields.description, draft.intent !== 'cardBill'),
    field(
      'amount',
      'Valor',
      draft.fields.amount,
      !['markAsPaid', 'unknown'].includes(draft.intent)
    ),
    field('category', 'Categoria', draft.fields.category),
    field('paymentMethod', 'Pagamento', draft.fields.paymentMethod),
    field('card', 'Cartão', draft.fields.card, ['installment', 'cardBill'].includes(draft.intent)),
    field('day', 'Dia', draft.fields.day),
    field('totalInstallments', 'Parcelas', draft.fields.totalInstallments),
    field('recurring', 'Recorrente', draft.fields.recurring),
  ].filter((item) => item.value !== undefined && item.value !== null && item.value !== '');

  return {
    intent: draft.intent,
    title: INTENT_TITLES[draft.intent],
    summary: buildSummary(draft),
    fields,
    canExecute: draft.intent !== 'unknown' && draft.missingFields.length === 0,
    warnings: draft.warnings,
  };
}
