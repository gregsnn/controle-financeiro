import { describe, expect, it } from 'vitest';
import { parseCaptureInput } from '../capture/parser';
import { EMPTY_CAPTURE_PREFERENCES } from '../capture/preferences';
import { buildCaptureSuggestions } from '../capture/suggestions';
import { captureTestContext } from './captureFixtures';

describe('capture suggestions', () => {
  it('suggests reviewing a high card expense as an installment', () => {
    const draft = parseCaptureInput('notebook 2400 itau', captureTestContext).draft;
    const suggestions = buildCaptureSuggestions(draft, captureTestContext);

    expect(suggestions.map((suggestion) => suggestion.id)).toContain('make-installment');
    expect(suggestions.find((suggestion) => suggestion.id === 'make-installment')?.draft).toEqual(
      expect.objectContaining({
        intent: 'installment',
        confidence: 'medium',
        missingFields: ['totalInstallments'],
      })
    );
  });

  it('suggests the last global card without silently applying it', () => {
    const draft = parseCaptureInput('farmacia 80', captureTestContext).draft;
    const suggestions = buildCaptureSuggestions(draft, captureTestContext, {
      ...EMPTY_CAPTURE_PREFERENCES,
      lastGlobalCard: 'sicredi',
    });

    expect(draft.fields.card).toBeUndefined();
    expect(
      suggestions.find((suggestion) => suggestion.id === 'use-last-card')?.draft.fields.card
    ).toBe('sicredi');
  });

  it('suggests marking a detected card bill as paid through review', () => {
    const draft = parseCaptureInput('nubank fatura 1200', captureTestContext).draft;
    const suggestions = buildCaptureSuggestions(draft, captureTestContext);

    expect(
      suggestions.find((suggestion) => suggestion.id === 'mark-card-bill-paid')?.draft.intent
    ).toBe('markAsPaid');
  });
});
