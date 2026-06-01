import { describe, expect, it } from 'vitest';
import { parseCaptureInput } from '../capture/parser';
import {
  EMPTY_CAPTURE_PREFERENCES,
  applyCapturePreferences,
  loadCapturePreferences,
  rememberCaptureDraft,
} from '../capture/preferences';
import type { CaptureDraft } from '../capture/types';
import { captureTestContext } from './captureFixtures';

function storage(initialValue: string | null = null) {
  let value = initialValue;

  return {
    getItem: () => value,
    setItem: (_key: string, nextValue: string) => {
      value = nextValue;
    },
    read: () => value,
  };
}

describe('capture preferences', () => {
  it('ignores absent or corrupted storage', () => {
    expect(loadCapturePreferences(storage(null))).toEqual(EMPTY_CAPTURE_PREFERENCES);
    expect(loadCapturePreferences(storage('{bad-json'))).toEqual(EMPTY_CAPTURE_PREFERENCES);
  });

  it('applies remembered category, payment method, card and recurrence by text', () => {
    const fields = applyCapturePreferences(
      'mercado 50',
      { amount: 50, description: 'mercado', category: 'casa' },
      captureTestContext,
      {
        ...EMPTY_CAPTURE_PREFERENCES,
        lastCategoryByText: { mercado: 'telefone' },
        lastPaymentByText: { mercado: 'boleto' },
        lastCardByText: { mercado: 'itau' },
        lastRecurringByText: { mercado: true },
      }
    );

    expect(fields).toEqual(
      expect.objectContaining({
        category: 'telefone',
        paymentMethod: 'boleto',
        card: 'itau',
        recurring: true,
      })
    );
  });

  it('stores preferences only after a successful non-unknown draft', () => {
    const fakeStorage = storage();
    const draft = {
      ...parseCaptureInput('mercado 50 pix itau', captureTestContext).draft,
      fields: {
        description: 'mercado',
        category: 'telefone',
        paymentMethod: 'boleto',
        card: 'itau',
        recurring: false,
      },
    } satisfies CaptureDraft;

    rememberCaptureDraft(draft, fakeStorage);

    const preferences = loadCapturePreferences(fakeStorage);
    expect(preferences.lastDestination).toBe('variableExpense');
    expect(preferences.lastCategoryByText.mercado).toBe('telefone');
    expect(preferences.lastPaymentByText.mercado).toBe('boleto');
    expect(preferences.lastCardByText.mercado).toBe('itau');
    expect(preferences.lastRecurringByText.mercado).toBe(false);
  });

  it('lets parser use stored preferences before intent fallback finishes', () => {
    const fakeStorage = storage();
    rememberCaptureDraft(
      {
        ...parseCaptureInput('mercado 50', captureTestContext).draft,
        fields: {
          description: 'mercado',
          category: 'telefone',
          paymentMethod: 'boleto',
          card: 'sicredi',
        },
      },
      fakeStorage
    );

    const draft = parseCaptureInput('mercado 70', captureTestContext).draft;
    const fields = applyCapturePreferences(
      draft.rawText,
      draft.fields,
      captureTestContext,
      loadCapturePreferences(fakeStorage)
    );

    expect(fields.category).toBe('telefone');
    expect(fields.paymentMethod).toBe('boleto');
    expect(fields.card).toBe('sicredi');
  });
});
