import { describe, expect, it } from 'vitest';
import { CAPTURE_EXAMPLES } from '../capture/exampleMatrix';
import { createCaptureDraft, parseCaptureInput } from '../capture/parser';
import type { CaptureIntent } from '../capture/types';
import { captureTestContext } from './captureFixtures';

const supportedIntents: CaptureIntent[] = [
  'variableExpense',
  'fixedExpense',
  'installment',
  'revenue',
  'cardBill',
  'markAsPaid',
  'unknown',
];

describe('capture contracts', () => {
  it('keeps the global example matrix explicit and complete', () => {
    expect(CAPTURE_EXAMPLES.length).toBeGreaterThanOrEqual(10);
    expect(new Set(CAPTURE_EXAMPLES.map((example) => example.expectedIntent))).toEqual(
      new Set(supportedIntents)
    );
  });

  it('creates a low-confidence draft without side effects', () => {
    const draft = createCaptureDraft(' mercado 123,45 ');

    expect(draft.id).toMatch(/^capture_/);
    expect(draft.rawText).toBe('mercado 123,45');
    expect(draft.intent).toBe('unknown');
    expect(draft.confidence).toBe('low');
    expect(draft.fields).toEqual({});
    expect(draft.missingFields).toEqual([]);
  });

  it('marks empty input as non executable and missing raw text', () => {
    const result = parseCaptureInput('   ', captureTestContext);

    expect(result.executable).toBe(false);
    expect(result.destinationLabel).toBe('Revisar lancamento');
    expect(result.draft.missingFields).toEqual(['rawText']);
    expect(result.draft.warnings).toContain('Informe uma descricao para capturar.');
  });

  it('parses every matrix example into the base CaptureResult contract', () => {
    CAPTURE_EXAMPLES.forEach((example) => {
      const result = parseCaptureInput(example.input, captureTestContext);

      expect(result.executable).toBe(false);
      expect(result.draft.rawText).toBe(example.input);
      expect(result.draft.intent).toBe(example.expectedIntent);
      if (example.requiresReview) {
        expect(result.draft.confidence).not.toBe('high');
      }
    });
  });
});
