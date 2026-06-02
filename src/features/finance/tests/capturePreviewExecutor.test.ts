import { describe, expect, it, vi } from 'vitest';
import { executeCaptureDraft, type CaptureExecutorActions } from '../capture/executor';
import { parseCaptureInput } from '../capture/parser';
import { buildCapturePreview } from '../capture/previewBuilder';
import { captureTestContext } from './captureFixtures';

function actions(): CaptureExecutorActions {
  return {
    addVariableExpense: vi.fn(),
    addFixedExpense: vi.fn(),
    addInstallment: vi.fn(),
    addRevenue: vi.fn(),
    setMonthCardBill: vi.fn(),
    setCardBillPaid: vi.fn(),
    setFixedExpensePaid: vi.fn(),
    setInstallmentPaid: vi.fn(),
    setRevenueReceived: vi.fn(),
  };
}

describe('capture preview and executor', () => {
  it('builds an executable preview for a simple variable expense', () => {
    const draft = parseCaptureInput('mercado 123,45', captureTestContext).draft;
    const preview = buildCapturePreview(draft);

    expect(preview.title).toBe('Despesa variável');
    expect(preview.summary.replace(/\s/g, ' ')).toBe('mercado - R$ 123,45');
    expect(preview.canExecute).toBe(true);
    expect(preview.fields.map((item) => item.key)).toContain('amount');
  });

  it('executes a variable expense through injected actions', async () => {
    const draft = parseCaptureInput('mercado 123,45', captureTestContext).draft;
    const mockedActions = actions();

    await expect(
      executeCaptureDraft(draft, { currentMonthKey: '2026-05' }, mockedActions)
    ).resolves.toEqual({ executed: true });

    expect(mockedActions.addVariableExpense).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'mercado',
        amount: 123.45,
        monthKey: '2026-05',
        category: 'casa',
        paymentMethod: 'pix',
      })
    );
  });

  it('executes fixed expenses, installments, revenues, card bills and card payments', async () => {
    const mockedActions = actions();

    await executeCaptureDraft(
      parseCaptureInput('internet 120 todo mes dia 10', captureTestContext).draft,
      { currentMonthKey: '2026-05' },
      mockedActions
    );
    expect(mockedActions.addFixedExpense).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'internet', amount: 120, dueDay: 10 })
    );

    await executeCaptureDraft(
      parseCaptureInput('geladeira 2400 10x itau', captureTestContext).draft,
      { currentMonthKey: '2026-05' },
      mockedActions
    );
    expect(mockedActions.addInstallment).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'geladeira',
        totalInstallments: 10,
        installmentValue: 240,
        card: 'itau',
      })
    );

    await executeCaptureDraft(
      parseCaptureInput('comprei o FH6 dia 17 de maio, fiz em 6x de 86,94 no cartao Santander', {
        ...captureTestContext,
        cards: [...captureTestContext.cards, { id: 'santander', name: 'Santander' }],
      }).draft,
      { currentMonthKey: '2026-05' },
      mockedActions
    );
    expect(mockedActions.addInstallment).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: 'FH6',
        totalInstallments: 6,
        installmentValue: 86.94,
        card: 'santander',
      })
    );

    await executeCaptureDraft(
      parseCaptureInput('iphone 16 pro, dia 1, 18x de 400, no cartao santander', {
        ...captureTestContext,
        cards: [...captureTestContext.cards, { id: 'santander', name: 'Santander' }],
      }).draft,
      { currentMonthKey: '2026-05' },
      mockedActions
    );
    expect(mockedActions.addInstallment).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: 'iphone 16 pro',
        totalInstallments: 18,
        installmentValue: 400,
        card: 'santander',
      })
    );

    await executeCaptureDraft(
      parseCaptureInput(
        'Fonte Pichau comprado em 25 de fevereiro, parcela 3x de 304,20 no cartao Santander',
        {
          ...captureTestContext,
          cards: [...captureTestContext.cards, { id: 'santander', name: 'Santander', dueDay: 30 }],
        }
      ).draft,
      {
        currentMonthKey: '2026-05',
        cards: [...captureTestContext.cards, { id: 'santander', name: 'Santander', dueDay: 30 }],
      },
      mockedActions
    );
    expect(mockedActions.addInstallment).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: 'Fonte Pichau',
        totalInstallments: 3,
        installmentValue: 304.2,
        card: 'santander',
        startMonth: '2026-03',
      })
    );

    await executeCaptureDraft(
      parseCaptureInput(
        'Fonte Pichau comprado em 25 de fevereiro, parcela 3x de 304,20 no cartao Santander',
        {
          ...captureTestContext,
          cards: [
            ...captureTestContext.cards,
            { id: 'santander', name: 'Santander', dueDay: 30, closingDay: 26 },
          ],
        }
      ).draft,
      {
        currentMonthKey: '2026-05',
        cards: [
          ...captureTestContext.cards,
          { id: 'santander', name: 'Santander', dueDay: 30, closingDay: 26 },
        ],
      },
      mockedActions
    );
    expect(mockedActions.addInstallment).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: 'Fonte Pichau',
        startMonth: '2026-02',
      })
    );

    await executeCaptureDraft(
      parseCaptureInput('Geladeira, 10x de 320,89, comprado em 5 de Julho de 2025, Santander', {
        ...captureTestContext,
        cards: [...captureTestContext.cards, { id: 'santander', name: 'Santander', dueDay: 30 }],
      }).draft,
      {
        currentMonthKey: '2026-05',
        cards: [...captureTestContext.cards, { id: 'santander', name: 'Santander', dueDay: 30 }],
      },
      mockedActions
    );
    expect(mockedActions.addInstallment).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: 'Geladeira',
        totalInstallments: 10,
        installmentValue: 320.89,
        card: 'santander',
        startMonth: '2025-07',
      })
    );

    await executeCaptureDraft(
      parseCaptureInput('salario 5000 todo dia 5', captureTestContext).draft,
      { currentMonthKey: '2026-05' },
      mockedActions
    );
    expect(mockedActions.addRevenue).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'salario', baseAmount: 5000, paymentDay: 5, recurring: true })
    );

    await executeCaptureDraft(
      parseCaptureInput('nubank 2539 vence 12', captureTestContext).draft,
      { currentMonthKey: '2026-05' },
      mockedActions
    );
    expect(mockedActions.setMonthCardBill).toHaveBeenCalledWith('nubank', 2539);

    await executeCaptureDraft(
      parseCaptureInput('paguei nubank', captureTestContext).draft,
      { currentMonthKey: '2026-05' },
      mockedActions
    );
    expect(mockedActions.setCardBillPaid).toHaveBeenCalledWith('nubank', true);
  });

  it('executes fixed expense and installment payment targets', async () => {
    const mockedActions = actions();
    const contextWithTargets = {
      ...captureTestContext,
      paymentTargets: [
        { id: 'fixed_luz', label: 'luz', type: 'fixedExpense' as const },
        { id: 'inst_teclado', label: 'teclado', type: 'installment' as const },
        { id: 'rev_salario', label: 'salario', type: 'revenue' as const },
      ],
    };

    await executeCaptureDraft(
      parseCaptureInput('paguei luz', contextWithTargets).draft,
      { currentMonthKey: '2026-05' },
      mockedActions
    );
    expect(mockedActions.setFixedExpensePaid).toHaveBeenCalledWith('fixed_luz', true);

    await executeCaptureDraft(
      parseCaptureInput('luz paga', contextWithTargets).draft,
      { currentMonthKey: '2026-05' },
      mockedActions
    );
    expect(mockedActions.setFixedExpensePaid).toHaveBeenCalledWith('fixed_luz', true);

    await executeCaptureDraft(
      parseCaptureInput('paguei teclado', contextWithTargets).draft,
      { currentMonthKey: '2026-05' },
      mockedActions
    );
    expect(mockedActions.setInstallmentPaid).toHaveBeenCalledWith('inst_teclado', true);

    await executeCaptureDraft(
      parseCaptureInput('recebi salario', contextWithTargets).draft,
      { currentMonthKey: '2026-05' },
      mockedActions
    );
    expect(mockedActions.setRevenueReceived).toHaveBeenCalledWith('rev_salario', true);
  });

  it('blocks execution when intent is unknown or fields are missing', async () => {
    const mockedActions = actions();

    await expect(
      executeCaptureDraft(
        parseCaptureInput('cartao 200', captureTestContext).draft,
        {
          currentMonthKey: '2026-05',
        },
        mockedActions
      )
    ).resolves.toEqual({ executed: false, reason: 'unknown-intent' });

    await expect(
      executeCaptureDraft(
        parseCaptureInput('paguei luz', captureTestContext).draft,
        {
          currentMonthKey: '2026-05',
        },
        mockedActions
      )
    ).resolves.toEqual({ executed: false, reason: 'missing:target' });
  });
});
