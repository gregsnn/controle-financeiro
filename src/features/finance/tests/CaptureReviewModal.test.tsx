import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CaptureReviewModal } from '../components/capture/CaptureReviewModal';
import type { CaptureExecutorActions } from '../capture/executor';
import { parseCaptureInput } from '../capture/parser';
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

describe('CaptureReviewModal', () => {
  it('allows an ambiguous capture to be corrected and saved', async () => {
    const executorActions = actions();
    const draft = parseCaptureInput('cartao 200', captureTestContext).draft;
    const onSaved = vi.fn();

    render(
      <CaptureReviewModal
        draft={draft}
        captureContext={captureTestContext}
        executorActions={executorActions}
        onClose={vi.fn()}
        onSaved={onSaved}
        onSavedAndAddAnother={vi.fn()}
      />
    );

    expect(screen.queryByText('Campos obrigatorios: intent')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Destino'), {
      target: { value: 'variableExpense' },
    });
    fireEvent.change(screen.getByLabelText('Descricao'), {
      target: { value: 'Mercado' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(executorActions.addVariableExpense).toHaveBeenCalledTimes(1));
    expect(executorActions.addVariableExpense).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mercado',
        amount: 200,
        monthKey: '2026-05',
      })
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('allows a pending payment capture to receive the missing card target', async () => {
    const executorActions = actions();
    const draft = parseCaptureInput('paguei luz', captureTestContext).draft;

    render(
      <CaptureReviewModal
        draft={draft}
        captureContext={captureTestContext}
        executorActions={executorActions}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        onSavedAndAddAnother={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText('Cartao'), {
      target: { value: 'nubank' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() =>
      expect(executorActions.setCardBillPaid).toHaveBeenCalledWith('nubank', true)
    );
  });

  it('keeps the review flow open for another entry when requested', async () => {
    const executorActions = actions();
    const draft = parseCaptureInput('mercado 50', captureTestContext).draft;
    const onSavedAndAddAnother = vi.fn();

    render(
      <CaptureReviewModal
        draft={draft}
        captureContext={captureTestContext}
        executorActions={executorActions}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        onSavedAndAddAnother={onSavedAndAddAnother}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Salvar e adicionar outro' }));

    await waitFor(() => expect(executorActions.addVariableExpense).toHaveBeenCalledTimes(1));
    expect(onSavedAndAddAnother).toHaveBeenCalledTimes(1);
  });

  it('closes review with Escape', () => {
    const draft = parseCaptureInput('cartao 200', captureTestContext).draft;
    const onClose = vi.fn();

    render(
      <CaptureReviewModal
        draft={draft}
        captureContext={captureTestContext}
        executorActions={actions()}
        onClose={onClose}
        onSaved={vi.fn()}
        onSavedAndAddAnother={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
