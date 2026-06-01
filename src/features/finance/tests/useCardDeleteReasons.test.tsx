import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCardDeleteReasons } from '../hooks/useCardDeleteReasons';

describe('useCardDeleteReasons', () => {
  it('blocks card deletion when the card is used by variable expenses', () => {
    const { result } = renderHook(() =>
      useCardDeleteReasons({
        cardBills: [{ id: 'itau', name: 'Itau' }],
        fixedExpenses: [],
        monthViewInstallments: [],
        monthCardBills: {},
        currentKey: '2026-05',
        monthViewVariableExpenses: [
          {
            id: 'var-1',
            name: 'Mercado',
            amount: 120,
            date: '2026-05-10',
            monthKey: '2026-05',
            category: 'casa',
            paymentMethod: 'cartao',
            card: 'itau',
            paid: false,
            notes: '',
          },
        ],
      })
    );

    expect(result.current.itau).toBe('despesas variaveis');
  });
});
