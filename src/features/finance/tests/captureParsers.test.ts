import { describe, expect, it } from 'vitest';
import { parseAmount } from '../capture/amountParser';
import { matchCard } from '../capture/cardMatcher';
import { classifyCategory } from '../capture/categoryClassifier';
import { parseCaptureDate } from '../capture/dateParser';
import { parseInstallment } from '../capture/installmentParser';
import { parseCaptureInput } from '../capture/parser';
import { parsePaymentMethod } from '../capture/paymentParser';
import { parseRecurrence } from '../capture/recurrenceParser';
import { tokenizeCaptureText } from '../capture/tokenizer';
import { captureTestContext } from './captureFixtures';

describe('capture parser primitives', () => {
  it('tokenizes text ignoring case and accents', () => {
    expect(tokenizeCaptureText('  Débito MERCADO!  ').map((token) => token.normalized)).toEqual([
      'debito',
      'mercado',
    ]);
  });

  it('parses monetary values without confusing day or installments', () => {
    expect(parseAmount('internet 120 todo mes dia 10')?.amount).toBe(120);
    expect(parseAmount('geladeira 2400 10x itau')?.amount).toBe(2400);
    expect(parseAmount('Mouse pad Poron SPEED 49x42x4mm - Rigel R$ 193,90')?.amount).toBe(193.9);
    expect(parseAmount('FH6, comprei dia 17 de maio, 6x de 86,94')?.amount).toBe(86.94);
    expect(parseAmount('iphone 16 pro, dia 1, 18x de 400, no cartao santander')?.amount).toBe(400);
    expect(parseAmount('paguei dia 10')).toBeNull();
  });

  it('parses day references into the selected month', () => {
    expect(parseCaptureDate('internet 120 todo mes dia 10', '2026-05')).toEqual({
      day: 10,
      date: '2026-05-10',
    });
    expect(parseCaptureDate('itau fatura 1200 vence 12', '2026-05')).toEqual({
      day: 12,
      date: '2026-05-12',
    });
    expect(parseCaptureDate('FH6, comprei dia 17 de maio, 6x de 86,94', '2026-04')).toEqual({
      day: 17,
      date: '2026-05-17',
    });
    expect(parseCaptureDate('Geladeira comprado em 5 de Julho de 2025', '2026-05')).toEqual({
      day: 5,
      date: '2025-07-05',
    });
  });

  it('parses recurrence, installments, payment method, card and category', () => {
    expect(parseRecurrence('internet 120 todo mes dia 10')).toEqual({
      recurring: true,
      reason: 'todo mes',
    });
    expect(parseInstallment('geladeira 2400 10x itau')).toMatchObject({
      totalInstallments: 10,
    });
    expect(
      parseInstallment('FH6, comprei dia 17 de maio, fiz em 6x de 86,94 no cartao Santander')
    ).toMatchObject({
      totalInstallments: 6,
      amountRole: 'installmentValue',
    });
    expect(parseInstallment('FH6 521,64 em 6x santander')).toMatchObject({
      totalInstallments: 6,
      amountRole: 'totalAmount',
    });
    expect(parseInstallment('iphone 16 pro, dia 1, 18x de 400, no cartao santander')).toMatchObject(
      {
        totalInstallments: 18,
        amount: 400,
        amountRole: 'installmentValue',
      }
    );
    expect(
      parseInstallment('Fonte Pichau comprado em 24 de fevereiro, parcela 3x de 304,20')
    ).toMatchObject({
      totalInstallments: 3,
      amount: 304.2,
      amountRole: 'installmentValue',
    });
    expect(parseInstallment('sofa 4/6 santander')).toMatchObject({
      currentInstallment: 4,
      totalInstallments: 6,
    });
    expect(parsePaymentMethod('uber 32 pix', captureTestContext.paymentMethods)).toBe('pix');
    expect(matchCard('geladeira 2400 10x itau', captureTestContext.cards)?.id).toBe('itau');
    expect(classifyCategory('internet fibra 120', captureTestContext.categories)).toBe('telefone');
  });

  it('enriches the base capture draft without making it executable', () => {
    const result = parseCaptureInput('geladeira 2400 10x itau', captureTestContext);

    expect(result.executable).toBe(false);
    expect(result.draft.intent).toBe('installment');
    expect(result.draft.confidence).toBe('high');
    expect(result.draft.fields).toMatchObject({
      amount: 2400,
      totalInstallments: 10,
      card: 'itau',
      category: 'outro',
    });
  });

  it('understands natural installment purchase text', () => {
    const result = parseCaptureInput(
      'comprei o FH6 dia 17 de maio, fiz em 6x de 86,94 no cartao Santander',
      {
        ...captureTestContext,
        currentMonthKey: '2026-04',
        cards: [...captureTestContext.cards, { id: 'santander', name: 'Santander' }],
      }
    );

    expect(result.draft.intent).toBe('installment');
    expect(result.draft.fields).toMatchObject({
      description: 'FH6',
      amount: 86.94,
      amountRole: 'installmentValue',
      day: 17,
      date: '2026-05-17',
      totalInstallments: 6,
      card: 'santander',
    });
  });

  it('keeps model numbers in descriptions without using them as amount', () => {
    const result = parseCaptureInput('iphone 16 pro, dia 1, 18x de 400, no cartao santander', {
      ...captureTestContext,
      cards: [...captureTestContext.cards, { id: 'santander', name: 'Santander' }],
    });

    expect(result.draft.intent).toBe('installment');
    expect(result.draft.fields).toMatchObject({
      description: 'iphone 16 pro',
      amount: 400,
      amountRole: 'installmentValue',
      day: 1,
      totalInstallments: 18,
      card: 'santander',
    });
  });

  it('lets strong installment amount override earlier date numbers', () => {
    const result = parseCaptureInput(
      'Fonte Pichau comprado em 25 de fevereiro, parcela 3x de 304,20',
      captureTestContext
    );

    expect(result.draft.intent).toBe('installment');
    expect(result.draft.fields).toMatchObject({
      description: 'Fonte Pichau',
      amount: 304.2,
      amountRole: 'installmentValue',
      day: 25,
      date: '2026-02-25',
      totalInstallments: 3,
    });
  });

  it('understands natural installments with explicit past year', () => {
    const result = parseCaptureInput(
      'Geladeira, 10x de 320,89, comprado em 5 de Julho de 2025, Santander',
      {
        ...captureTestContext,
        cards: [...captureTestContext.cards, { id: 'santander', name: 'Santander', dueDay: 30 }],
      }
    );

    expect(result.draft.intent).toBe('installment');
    expect(result.draft.fields).toMatchObject({
      description: 'Geladeira',
      amount: 320.89,
      amountRole: 'installmentValue',
      day: 5,
      date: '2025-07-05',
      totalInstallments: 10,
      card: 'santander',
    });
  });
});
