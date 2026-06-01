import { loadCapturePreferences, type CapturePreferences } from './preferences';
import type { CaptureContext, CaptureDraft } from './types';

export interface CaptureSuggestion {
  id: string;
  label: string;
  detail: string;
  draft: CaptureDraft;
}

function withDraftPatch(
  draft: CaptureDraft,
  patch: Pick<
    Partial<CaptureDraft>,
    'intent' | 'confidence' | 'fields' | 'missingFields' | 'warnings'
  >
): CaptureDraft {
  return {
    ...draft,
    ...patch,
    fields: {
      ...draft.fields,
      ...patch.fields,
    },
    warnings: patch.warnings || draft.warnings,
    missingFields: patch.missingFields || draft.missingFields,
  };
}

export function buildCaptureSuggestions(
  draft: CaptureDraft,
  context: CaptureContext,
  preferences: CapturePreferences = loadCapturePreferences()
): CaptureSuggestion[] {
  const suggestions: CaptureSuggestion[] = [];
  const amount = Number(draft.fields.amount || 0);
  const cardIds = new Set(context.cards.map((card) => card.id));
  const lastCard = preferences.lastGlobalCard;

  if (draft.intent === 'variableExpense' && amount >= 300 && draft.fields.card) {
    suggestions.push({
      id: 'make-installment',
      label: 'Parcelar',
      detail: 'Revisar como parcelamento',
      draft: withDraftPatch(draft, {
        intent: 'installment',
        confidence: 'medium',
        missingFields: draft.fields.totalInstallments ? [] : ['totalInstallments'],
        warnings: ['Confirme a quantidade de parcelas antes de salvar.'],
      }),
    });
  }

  if (draft.intent === 'variableExpense' && !draft.fields.recurring) {
    suggestions.push({
      id: 'make-fixed',
      label: 'Tornar fixa',
      detail: 'Usar quando a despesa se repete',
      draft: withDraftPatch(draft, {
        intent: 'fixedExpense',
        confidence: 'medium',
        fields: { recurring: true },
        missingFields: draft.fields.day ? [] : ['day'],
        warnings: ['Confirme o dia de vencimento antes de salvar.'],
      }),
    });
  }

  if (!draft.fields.card && lastCard && cardIds.has(lastCard)) {
    const cardName = context.cards.find((card) => card.id === lastCard)?.name || 'ultimo cartao';
    suggestions.push({
      id: 'use-last-card',
      label: `Usar ${cardName}`,
      detail: 'Mesmo cartao usado recentemente',
      draft: withDraftPatch(draft, {
        confidence: draft.confidence === 'high' ? 'medium' : draft.confidence,
        fields: { card: lastCard },
        warnings: ['Confirme o cartao antes de salvar.'],
      }),
    });
  }

  if (draft.intent === 'cardBill' && draft.fields.card) {
    suggestions.push({
      id: 'mark-card-bill-paid',
      label: 'Marcar paga',
      detail: 'Baixar esta fatura',
      draft: withDraftPatch(draft, {
        intent: 'markAsPaid',
        confidence: 'medium',
        missingFields: [],
        warnings: ['Confirme a baixa antes de salvar.'],
      }),
    });
  }

  return suggestions.slice(0, 3);
}
