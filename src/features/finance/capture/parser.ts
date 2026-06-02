import { parseAmount } from './amountParser';
import { matchCard } from './cardMatcher';
import { classifyCategory } from './categoryClassifier';
import { inferBaseConfidence } from './confidence';
import { parseCaptureDate } from './dateParser';
import { parseDescription } from './descriptionParser';
import { parseInstallment } from './installmentParser';
import { detectCaptureIntent } from './intentDetector';
import { parsePaymentMethod } from './paymentParser';
import { applyCapturePreferences } from './preferences';
import { matchPaymentTarget } from './paymentTargetMatcher';
import { parseRecurrence } from './recurrenceParser';
import type { CaptureContext, CaptureDraft, CaptureResult } from './types';

const UNKNOWN_DESTINATION_LABEL = 'Revisar lançamento';

function createCaptureId() {
  const random = Math.random().toString(36).slice(2, 9);
  return `capture_${Date.now().toString(36)}_${random}`;
}

export function createCaptureDraft(rawText: string): CaptureDraft {
  const normalizedText = rawText.trim();

  return {
    id: createCaptureId(),
    rawText: normalizedText,
    intent: 'unknown',
    confidence: 'low',
    warnings: normalizedText ? [] : ['Informe uma descrição para capturar.'],
    fields: {},
    missingFields: normalizedText ? [] : ['rawText'],
    alternatives: [],
  };
}

export function parseCaptureInput(rawText: string, context: CaptureContext): CaptureResult {
  const draft = createCaptureDraft(rawText);
  const amount = parseAmount(draft.rawText);
  const parsedDate = parseCaptureDate(draft.rawText, context.currentMonthKey);
  const recurrence = parseRecurrence(draft.rawText);
  const installment = parseInstallment(draft.rawText);
  const paymentMethod = parsePaymentMethod(draft.rawText, context.paymentMethods);
  const paymentTarget = matchPaymentTarget(draft.rawText, context);
  const card = matchCard(draft.rawText, context.cards);
  const category = classifyCategory(draft.rawText, context.categories);
  const description = parseDescription(draft.rawText, context.cards);

  if (amount) draft.fields.amount = amount.amount;
  if (description) draft.fields.description = description;
  if (parsedDate?.day) draft.fields.day = parsedDate.day;
  if (parsedDate?.date) draft.fields.date = parsedDate.date;
  if (recurrence) draft.fields.recurring = recurrence.recurring;
  if (installment) {
    draft.fields.totalInstallments = installment.totalInstallments;
    if (installment.amount) {
      draft.fields.amount = installment.amount;
    }
    if (installment.amountRole) {
      draft.fields.amountRole = installment.amountRole;
    }
    if (installment.currentInstallment) {
      draft.fields.currentInstallment = installment.currentInstallment;
    }
  }
  if (paymentMethod) draft.fields.paymentMethod = paymentMethod;
  if (paymentTarget) {
    draft.fields.paymentTarget = paymentTarget.id;
    draft.fields.paymentTargetType = paymentTarget.type;
  }
  if (card) draft.fields.card = card.id;
  if (category) draft.fields.category = category;
  draft.fields = applyCapturePreferences(draft.rawText, draft.fields, context);
  draft.confidence = inferBaseConfidence(draft.fields);
  const detection = detectCaptureIntent(draft, context);
  draft.intent = detection.intent;
  draft.confidence = detection.confidence;
  draft.alternatives = detection.alternatives;
  draft.missingFields = detection.missingFields;
  draft.warnings = detection.warnings;

  return {
    draft,
    executable: false,
    destinationLabel: UNKNOWN_DESTINATION_LABEL,
  };
}
