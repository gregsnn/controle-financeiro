import { describe, expect, it, vi } from 'vitest';
import { OVERRIDE_TYPES } from '../domain/constants';
import { propagateCardBillPaid } from '../hooks/useMonthOverridesActions';

describe('propagateCardBillPaid', () => {
  it('calls overrideMutations.setPaid for fixed expenses and installments linked to the card', () => {
    const monthView: any = {
      fixedExpenses: [
        { id: 'f1', paymentMethod: 'cartao', card: 'card1' },
        { id: 'f2', paymentMethod: 'pix' },
      ],
      installments: [
        { id: 'i1', card: 'card1' },
        { id: 'i2', card: 'other' },
      ],
    };

    const setPaid = vi.fn();
    const overrideMutations: any = { setPaid };

    propagateCardBillPaid(monthView, overrideMutations, 'card1', true);

    expect(setPaid).toHaveBeenCalledWith(OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT, 'f1', true);
    expect(setPaid).toHaveBeenCalledWith(OVERRIDE_TYPES.INSTALLMENT_PAYMENT, 'i1', true);
    // should not call for unrelated items
    expect(setPaid).not.toHaveBeenCalledWith(OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT, 'f2', true);
    expect(setPaid).not.toHaveBeenCalledWith(OVERRIDE_TYPES.INSTALLMENT_PAYMENT, 'i2', true);
  });
});
