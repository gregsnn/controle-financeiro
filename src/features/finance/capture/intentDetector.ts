import { normalizeCaptureText } from './tokenizer';
import { hasPaymentStatusSignal } from './paymentLanguage';
import type { CaptureContext, CaptureDraft, CaptureIntent } from './types';

interface IntentDetection {
  intent: CaptureIntent;
  confidence: CaptureDraft['confidence'];
  alternatives: CaptureIntent[];
  missingFields: string[];
  warnings: string[];
}

const REVENUE_PATTERNS = [
  /\bsalario\b/,
  /\bfreela\b/,
  /\brecebi\b/,
  /\brenda\b/,
  /\baluguel recebido\b/,
];

function hasAnyPattern(input: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(input));
}

function hasCardBillSignal(input: string) {
  return /\bfatura\b|\bvence\b|\bvencimento\b/.test(input);
}

function isAmbiguousCardAmount(input: string, draft: CaptureDraft) {
  return input.includes(' cartao ') && draft.fields.amount && !draft.fields.card;
}

function hasRevenueReceivedSignal(input: string, draft: CaptureDraft) {
  return (
    draft.fields.paymentTargetType === 'revenue' &&
    /\b(recebi|recebido|recebida|caiu|entrou)\b/.test(input)
  );
}

export function detectCaptureIntent(
  draft: CaptureDraft,
  _context: CaptureContext
): IntentDetection {
  const normalized = ` ${normalizeCaptureText(draft.rawText)} `;
  const hasAmount = Number(draft.fields.amount || 0) > 0;

  if (!draft.rawText) {
    return {
      intent: 'unknown',
      confidence: 'low',
      alternatives: [],
      missingFields: ['rawText'],
      warnings: ['Informe uma descricao para capturar.'],
    };
  }

  if (hasPaymentStatusSignal(normalized) || hasRevenueReceivedSignal(normalized, draft)) {
    const hasTarget = Boolean(draft.fields.card || draft.fields.paymentTarget);
    return {
      intent: 'markAsPaid',
      confidence: hasTarget ? 'high' : 'low',
      alternatives: ['cardBill', 'fixedExpense', 'installment'],
      missingFields: hasTarget ? [] : ['target'],
      warnings: hasTarget ? [] : ['Baixa ambigua: revise o item que foi pago.'],
    };
  }

  if (isAmbiguousCardAmount(normalized, draft)) {
    return {
      intent: 'unknown',
      confidence: 'low',
      alternatives: ['variableExpense', 'cardBill'],
      missingFields: ['card'],
      warnings: ['Cartao ambiguo: escolha o cartao antes de salvar.'],
    };
  }

  if (draft.fields.totalInstallments && hasAmount) {
    return {
      intent: 'installment',
      confidence: draft.fields.card ? 'high' : 'medium',
      alternatives: ['variableExpense'],
      missingFields: draft.fields.card ? [] : ['card'],
      warnings: draft.fields.card ? [] : ['Parcelamento sem cartao detectado.'],
    };
  }

  if (hasAnyPattern(normalized, REVENUE_PATTERNS) && hasAmount) {
    return {
      intent: 'revenue',
      confidence: draft.fields.recurring || draft.fields.day ? 'high' : 'medium',
      alternatives: ['variableExpense'],
      missingFields: [],
      warnings: [],
    };
  }

  if (draft.fields.recurring && hasAmount) {
    return {
      intent: 'fixedExpense',
      confidence: draft.fields.day ? 'high' : 'medium',
      alternatives: ['variableExpense'],
      missingFields: draft.fields.day ? [] : ['day'],
      warnings: draft.fields.day ? [] : ['Despesa fixa sem dia detectado.'],
    };
  }

  if (draft.fields.card && hasAmount && hasCardBillSignal(normalized)) {
    return {
      intent: 'cardBill',
      confidence: 'high',
      alternatives: ['variableExpense'],
      missingFields: [],
      warnings: [],
    };
  }

  if (hasAmount) {
    return {
      intent: 'variableExpense',
      confidence:
        draft.fields.category || draft.fields.paymentMethod || draft.fields.card
          ? 'high'
          : 'medium',
      alternatives: [],
      missingFields: [],
      warnings: [],
    };
  }

  return {
    intent: 'unknown',
    confidence: 'low',
    alternatives: [],
    missingFields: ['amount'],
    warnings: ['Valor nao detectado.'],
  };
}
