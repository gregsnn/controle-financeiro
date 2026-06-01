import { describe, expect, it } from 'vitest';
import { parseCaptureInput } from '../capture/parser';
import { captureTestContext } from './captureFixtures';

describe('capture intent detector', () => {
  it.each([
    ['mercado 123,45', 'variableExpense'],
    ['internet 120 todo mes dia 10', 'fixedExpense'],
    ['geladeira 2400 10x itau', 'installment'],
    ['salario 5000 todo dia 5', 'revenue'],
    ['freela 1200 dia 18', 'revenue'],
    ['nubank 2539 vence 12', 'cardBill'],
    ['paguei nubank', 'markAsPaid'],
  ])('detects "%s" as %s', (input, expectedIntent) => {
    expect(parseCaptureInput(input, captureTestContext).draft.intent).toBe(expectedIntent);
  });

  it('keeps ambiguous card amount as unknown with alternatives', () => {
    const result = parseCaptureInput('cartao 200', captureTestContext);

    expect(result.draft.intent).toBe('unknown');
    expect(result.draft.confidence).toBe('low');
    expect(result.draft.missingFields).toEqual(['card']);
    expect(result.draft.alternatives).toEqual(['variableExpense', 'cardBill']);
  });

  it('requires review for ambiguous paid commands without a card match', () => {
    const result = parseCaptureInput('paguei luz', captureTestContext);

    expect(result.draft.intent).toBe('markAsPaid');
    expect(result.draft.confidence).toBe('low');
    expect(result.draft.missingFields).toEqual(['target']);
    expect(result.draft.warnings).toContain('Baixa ambigua: revise o item que foi pago.');
  });

  it.each([
    'internet paga',
    'internet pago',
    'internet quitada',
    'internet quitado',
    'ja paguei internet',
    'internet foi paga',
    'internet liquidada',
    'internet baixada',
  ])('detects common payment writing "%s" as a paid fixed expense target', (input) => {
    const result = parseCaptureInput(input, {
      ...captureTestContext,
      paymentTargets: [{ id: 'fixed_internet', label: 'internet', type: 'fixedExpense' }],
    });

    expect(result.draft.intent).toBe('markAsPaid');
    expect(result.draft.confidence).toBe('high');
    expect(result.draft.missingFields).toEqual([]);
    expect(result.draft.fields.paymentTarget).toBe('fixed_internet');
    expect(result.draft.fields.paymentTargetType).toBe('fixedExpense');
  });
});
