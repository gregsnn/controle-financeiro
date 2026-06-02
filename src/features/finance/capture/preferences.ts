import { normalizeCaptureText } from './tokenizer';
import type { CaptureContext, CaptureDraft, CaptureFields, CaptureIntent } from './types';

const CAPTURE_PREFERENCES_KEY = 'ledger.capture.preferences.v1';

export interface CapturePreferences {
  lastDestination: CaptureIntent | null;
  lastCategoryByText: Record<string, string>;
  lastPaymentByText: Record<string, string>;
  lastCardByText: Record<string, string>;
  lastRecurringByText: Record<string, boolean>;
  lastGlobalPaymentMethod: string | null;
  lastGlobalCard: string | null;
  lastVariableExpenseText: string | null;
}

export const EMPTY_CAPTURE_PREFERENCES: CapturePreferences = {
  lastDestination: null,
  lastCategoryByText: {},
  lastPaymentByText: {},
  lastCardByText: {},
  lastRecurringByText: {},
  lastGlobalPaymentMethod: null,
  lastGlobalCard: null,
  lastVariableExpenseText: null,
};

type CaptureStorage = Pick<Storage, 'getItem' | 'setItem'>;

function getStorage(): CaptureStorage | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function normalizePreferenceKey(draftOrText: CaptureDraft | string) {
  const rawText = typeof draftOrText === 'string' ? draftOrText : draftOrText.rawText;
  const description =
    typeof draftOrText === 'string' ? '' : String(draftOrText.fields.description || '');

  return normalizeCaptureText(description || rawText)
    .replace(/\b\d+([,.]\d+)?\b/g, '')
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readStringMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => typeof item === 'string')
  ) as Record<string, string>;
}

function readBooleanMap(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => typeof item === 'boolean')
  ) as Record<string, boolean>;
}

export function loadCapturePreferences(storage: CaptureStorage | null = getStorage()) {
  if (!storage) return EMPTY_CAPTURE_PREFERENCES;

  try {
    const raw = storage.getItem(CAPTURE_PREFERENCES_KEY);
    if (!raw) return EMPTY_CAPTURE_PREFERENCES;

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return EMPTY_CAPTURE_PREFERENCES;

    return {
      lastDestination:
        typeof parsed.lastDestination === 'string'
          ? (parsed.lastDestination as CaptureIntent)
          : EMPTY_CAPTURE_PREFERENCES.lastDestination,
      lastCategoryByText: readStringMap(parsed.lastCategoryByText),
      lastPaymentByText: readStringMap(parsed.lastPaymentByText),
      lastCardByText: readStringMap(parsed.lastCardByText),
      lastRecurringByText: readBooleanMap(parsed.lastRecurringByText),
      lastGlobalPaymentMethod:
        typeof parsed.lastGlobalPaymentMethod === 'string'
          ? parsed.lastGlobalPaymentMethod
          : EMPTY_CAPTURE_PREFERENCES.lastGlobalPaymentMethod,
      lastGlobalCard:
        typeof parsed.lastGlobalCard === 'string'
          ? parsed.lastGlobalCard
          : EMPTY_CAPTURE_PREFERENCES.lastGlobalCard,
      lastVariableExpenseText:
        typeof parsed.lastVariableExpenseText === 'string'
          ? parsed.lastVariableExpenseText
          : EMPTY_CAPTURE_PREFERENCES.lastVariableExpenseText,
    };
  } catch {
    return EMPTY_CAPTURE_PREFERENCES;
  }
}

function formatRepeatAmount(value: CaptureFields[string]) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return '';
  return amount.toFixed(2).replace('.', ',');
}

function buildRepeatVariableExpenseText(draft: CaptureDraft) {
  const description = String(draft.fields.description || '').trim();
  const amount = formatRepeatAmount(draft.fields.amount);
  if (!description || !amount) return null;

  const paymentMethod = String(draft.fields.paymentMethod || '').trim();
  const card = String(draft.fields.card || '').trim();

  return [description, amount, paymentMethod, card].filter(Boolean).join(' ');
}

export function saveCapturePreferences(
  preferences: CapturePreferences,
  storage: CaptureStorage | null = getStorage()
) {
  if (!storage) return;

  try {
    storage.setItem(CAPTURE_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Preferências são best-effort e não podem bloquear o fluxo de captura.
  }
}

export function applyCapturePreferences(
  rawText: string,
  fields: CaptureFields,
  context: CaptureContext,
  preferences = loadCapturePreferences()
): CaptureFields {
  const key = normalizePreferenceKey(rawText);
  if (!key) return fields;

  const cardIds = new Set(context.cards.map((card) => card.id));
  const paymentMethods = new Set(context.paymentMethods);
  const nextFields = { ...fields };
  const preferredCategory = preferences.lastCategoryByText[key];
  const preferredPayment =
    preferences.lastPaymentByText[key] || preferences.lastGlobalPaymentMethod;
  const preferredCard = preferences.lastCardByText[key];

  if (preferredCategory && context.categories[preferredCategory]) {
    nextFields.category = preferredCategory;
  }
  if (preferredPayment && paymentMethods.has(preferredPayment)) {
    nextFields.paymentMethod = preferredPayment;
  }
  if (preferredCard && cardIds.has(preferredCard)) {
    nextFields.card = preferredCard;
  }
  if (typeof preferences.lastRecurringByText[key] === 'boolean') {
    nextFields.recurring = preferences.lastRecurringByText[key];
  }

  return nextFields;
}

export function rememberCaptureDraft(
  draft: CaptureDraft,
  storage: CaptureStorage | null = getStorage()
) {
  const key = normalizePreferenceKey(draft);
  if (!key || draft.intent === 'unknown') return;

  const preferences = loadCapturePreferences(storage);
  const nextPreferences: CapturePreferences = {
    ...preferences,
    lastDestination: draft.intent,
    lastCategoryByText: { ...preferences.lastCategoryByText },
    lastPaymentByText: { ...preferences.lastPaymentByText },
    lastCardByText: { ...preferences.lastCardByText },
    lastRecurringByText: { ...preferences.lastRecurringByText },
  };
  const category = String(draft.fields.category || '');
  const paymentMethod = String(draft.fields.paymentMethod || '');
  const card = String(draft.fields.card || '');

  if (category) nextPreferences.lastCategoryByText[key] = category;
  if (paymentMethod) {
    nextPreferences.lastPaymentByText[key] = paymentMethod;
    nextPreferences.lastGlobalPaymentMethod = paymentMethod;
  }
  if (card) {
    nextPreferences.lastCardByText[key] = card;
    nextPreferences.lastGlobalCard = card;
  }
  if (typeof draft.fields.recurring === 'boolean') {
    nextPreferences.lastRecurringByText[key] = draft.fields.recurring;
  }
  if (draft.intent === 'variableExpense') {
    nextPreferences.lastVariableExpenseText = buildRepeatVariableExpenseText(draft);
  }

  saveCapturePreferences(nextPreferences, storage);
}
