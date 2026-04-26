import { describe, expect, it } from 'vitest';
import { OVERRIDE_TYPES } from '../domain/constants';
import { emptyFinanceState } from '../lib/schema';
import { buildMonthView } from '../selectors/buildMonth';

describe('buildMonthView', () => {
  it('calculates totals correctly', () => {
    const state = {
      ...emptyFinanceState(),
      currentDate: new Date('2026-04-15'),
      fixedExpenses: [
        {
          id: '1',
          name: 'Aluguel',
          amount: 1500,
          dueDay: 5,
          category: 'aluguel',
          paymentMethod: 'boleto',
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          notes: '',
        },
        {
          id: '2',
          name: 'Internet',
          amount: 120,
          dueDay: 10,
          category: 'telefone',
          paymentMethod: 'pix',
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          notes: '',
        },
      ],
      revenues: [
        {
          id: '1',
          name: 'Salario',
          baseAmount: 5000,
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          category: 'outro',
          notes: '',
        },
      ],
      installments: [],
    };

    const result = buildMonthView(state);

    expect(result.totals.receitas).toBe(5000);
    expect(result.totals.despesasFixas).toBe(1620);
  });

  it('includes revenues with null endMonth (infinite) for future months', () => {
    const state = {
      ...emptyFinanceState(),
      currentDate: new Date('2026-05-15'),
      fixedExpenses: [],
      revenues: [
        {
          id: '1',
          name: 'Salario',
          baseAmount: 5000,
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          category: 'outro',
          notes: '',
        },
      ],
      installments: [],
      monthOverrides: [],
    };

    const result = buildMonthView(state);

    expect(result.revenues).toHaveLength(1);
    expect(result.totals.receitas).toBe(5000);
  });

  it('includes revenues starting in future month', () => {
    const state = {
      ...emptyFinanceState(),
      currentDate: new Date(2026, 4, 1), // May 2026 (month is 0-indexed)
      fixedExpenses: [],
      revenues: [
        {
          id: '1',
          name: 'Salario Extra',
          baseAmount: 2000,
          active: true,
          startMonth: '2026-05',
          endMonth: null,
          category: 'outro',
          notes: '',
        },
      ],
      installments: [],
      monthOverrides: [],
    };

    const result = buildMonthView(state);

    expect(result.revenues).toHaveLength(1);
    expect(result.totals.receitas).toBe(2000);
  });

  it('handles May 2026 correctly (month is 0-indexed in Date constructor)', () => {
    const state = {
      ...emptyFinanceState(),
      currentDate: new Date(2026, 4, 15), // May = month 4 (0-indexed)
      fixedExpenses: [],
      revenues: [
        {
          id: '1',
          name: 'Salario',
          baseAmount: 5000,
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          category: 'outro',
          notes: '',
        },
        {
          id: '2',
          name: 'Salario Extra',
          baseAmount: 2000,
          active: true,
          startMonth: '2026-05',
          endMonth: null,
          category: 'outro',
          notes: '',
        },
      ],
      installments: [],
      monthOverrides: [],
    };

    const result = buildMonthView(state);

    expect(result.revenues).toHaveLength(2);
    expect(result.totals.receitas).toBe(7000);
  });

  it('includes revenues with null endMonth (infinite) for current month', () => {
    const state = {
      ...emptyFinanceState(),
      currentDate: new Date('2026-04-15'),
      fixedExpenses: [],
      revenues: [
        {
          id: '1',
          name: 'Salario',
          baseAmount: 5000,
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          category: 'outro',
          notes: '',
        },
      ],
      installments: [],
      monthOverrides: [],
    };

    const result = buildMonthView(state);

    expect(result.revenues).toHaveLength(1);
    expect(result.totals.receitas).toBe(5000);
  });

  it('filters inactive items', () => {
    const state = {
      ...emptyFinanceState(),
      currentDate: new Date('2026-04-15'),
      fixedExpenses: [
        {
          id: '1',
          name: 'Ativa',
          amount: 100,
          dueDay: 5,
          category: 'outro',
          paymentMethod: 'boleto',
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          notes: '',
        },
        {
          id: '2',
          name: 'Inativa',
          amount: 200,
          dueDay: 5,
          category: 'outro',
          paymentMethod: 'boleto',
          active: false,
          startMonth: '2026-01',
          endMonth: null,
          notes: '',
        },
      ],
      revenues: [],
      installments: [],
    };

    const result = buildMonthView(state);

    expect(result.fixedExpenses).toHaveLength(1);
    expect(result.fixedExpenses[0].name).toBe('Ativa');
  });

  it('keeps historical months after a recurring item is closed', () => {
    const baseState = {
      ...emptyFinanceState(),
      fixedExpenses: [
        {
          id: '1',
          name: 'Internet',
          amount: 120,
          dueDay: 5,
          category: 'telefone',
          paymentMethod: 'pix',
          active: true,
          startMonth: '2026-01',
          endMonth: '2026-07',
          notes: '',
        },
      ],
      revenues: [
        {
          id: 'r1',
          name: 'Salario',
          baseAmount: 5000,
          active: true,
          startMonth: '2026-01',
          endMonth: '2026-07',
          category: 'outro',
          notes: '',
        },
      ],
      installments: [],
      monthOverrides: [],
    };

    const july = buildMonthView({ ...baseState, currentDate: new Date('2026-07-15') });
    const august = buildMonthView({ ...baseState, currentDate: new Date('2026-08-15') });

    expect(july.fixedExpenses).toHaveLength(1);
    expect(july.revenues).toHaveLength(1);
    expect(august.fixedExpenses).toHaveLength(0);
    expect(august.revenues).toHaveLength(0);
  });

  it('applies overrides to amounts', () => {
    const state = {
      ...emptyFinanceState(),
      currentDate: new Date('2026-04-15'),
      fixedExpenses: [
        {
          id: '1',
          name: 'Internet',
          amount: 120,
          dueDay: 5,
          category: 'telefone',
          paymentMethod: 'pix',
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          notes: '',
        },
      ],
      revenues: [],
      installments: [],
      monthOverrides: [
        {
          id: 'o1',
          type: OVERRIDE_TYPES.FIXED_EXPENSE,
          itemId: '1',
          monthKey: '2026-04',
          amount: 100,
        },
      ],
    };

    const result = buildMonthView(state);

    expect(result.fixedExpenses[0].amount).toBe(100);
  });

  it('calculates installment progress', () => {
    const state = {
      ...emptyFinanceState(),
      currentDate: new Date('2026-04-15'),
      fixedExpenses: [],
      revenues: [],
      installments: [
        {
          id: '1',
          name: 'TV',
          totalInstallments: 12,
          currentInstallment: 1,
          installmentValue: 100,
          card: 'nubank',
          category: 'outro',
          startMonth: '2026-01',
          active: true,
          closedAt: null,
        },
      ],
    };

    const result = buildMonthView(state);

    expect(result.installments).toHaveLength(1);
    expect(result.installments[0].currentInstallment).toBe(4);
  });

  it('marks paid items', () => {
    const state = {
      ...emptyFinanceState(),
      currentDate: new Date('2026-04-15'),
      fixedExpenses: [
        {
          id: '1',
          name: 'Aluguel',
          amount: 1500,
          dueDay: 5,
          category: 'aluguel',
          paymentMethod: 'boleto',
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          notes: '',
        },
      ],
      revenues: [],
      installments: [],
      monthOverrides: [
        {
          id: 'o1',
          type: OVERRIDE_TYPES.FIXED_EXPENSE_PAYMENT,
          itemId: '1',
          monthKey: '2026-04',
          paid: true,
        },
      ],
    };

    const result = buildMonthView(state);

    expect(result.fixedExpenses[0].paid).toBe(true);
  });
});
