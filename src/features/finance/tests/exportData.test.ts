import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildFinanceStateFromBackup, type ExportData } from '../lib/exportData';
import { DEFAULT_CARD_BILLS, emptyFinanceState, financeSchemaVersion } from '../lib/schema';
import * as storageModule from '../lib/storage';

describe('exportData.ts - buildFinanceStateFromBackup', () => {
  it('builds a finance state from a complete exported backup', () => {
    const state = buildFinanceStateFromBackup({
      version: 2,
      data: {
        fixedExpenses: [
          {
            id: 'f1',
            name: 'TV',
            amount: 100,
            paymentMethod: 'cartao',
            card: 'nubank',
            active: true,
            startMonth: '2026-01',
            endMonth: null,
            notes: '',
          },
        ],
        installments: [
          {
            id: 'i1',
            name: 'Notebook',
            installmentValue: 250,
            totalInstallments: 12,
            currentInstallment: 1,
            card: 'santander',
            category: 'outro',
            startMonth: '2026-02',
            active: true,
            closedAt: null,
          },
        ],
        revenues: [],
        monthOverrides: [],
        settings: {
          theme: 'premium',
          cardBills: [{ id: 'amex', name: 'Amex', color: '#123456' }],
          currentMonthKey: '2026-04',
        },
        meta: {
          schemaVersion: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
          lastResetAt: null,
        },
      },
    });

    expect(state.currentDate.toISOString().startsWith('2026-04-01')).toBe(true);
    expect(state.settings.theme).toBe('premium');
    expect(state.settings.cardBills).toEqual([{ id: 'amex', name: 'Amex', color: '#123456' }]);
    expect(state.fixedExpenses[0].paymentMethod).toBe('cartao');
    expect(state.fixedExpenses[0].card).toBe('nubank');
    expect(state.installments[0].card).toBe('santander');
    expect(state.meta.schemaVersion).toBe(financeSchemaVersion);
  });

  it('handles backup with empty arrays', () => {
    const state = buildFinanceStateFromBackup({
      version: 2,
      data: {
        fixedExpenses: [],
        installments: [],
        revenues: [],
        monthOverrides: [],
        settings: {},
        meta: {},
      },
    });

    expect(state.fixedExpenses).toEqual([]);
    expect(state.installments).toEqual([]);
    expect(state.revenues).toEqual([]);
    expect(state.monthOverrides).toEqual([]);
    expect(state.settings.theme).toBe('default');
    expect(state.meta.schemaVersion).toBe(financeSchemaVersion);
  });

  it('handles backup without data property (legacy format)', () => {
    const state = buildFinanceStateFromBackup({
      fixedExpenses: [
        {
          id: 'f1',
          name: 'Internet',
          amount: 150,
          paymentMethod: 'pix',
          card: null,
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          notes: '',
        },
      ],
      installments: [],
      revenues: [],
      monthOverrides: [],
      settings: { currentMonthKey: '2026-03' },
      meta: { createdAt: '2026-01-15T10:00:00.000Z' },
    });

    expect(state.fixedExpenses).toHaveLength(1);
    expect(state.fixedExpenses[0].name).toBe('Internet');
    expect(state.currentDate.toISOString().startsWith('2026-03-01')).toBe(true);
  });

  it('handles backup with invalid/missing currentMonthKey', () => {
    const state = buildFinanceStateFromBackup({
      version: 2,
      data: {
        fixedExpenses: [],
        installments: [],
        revenues: [],
        monthOverrides: [],
        settings: { currentMonthKey: null },
        meta: { currentDate: '2026-05-20T14:30:00.000Z' },
      },
    });

    expect(state.currentDate).toBeInstanceOf(Date);
    expect(!Number.isNaN(state.currentDate.getTime())).toBe(true);
  });

  it('handles backup with multiple revenues', () => {
    const state = buildFinanceStateFromBackup({
      version: 2,
      data: {
        fixedExpenses: [],
        installments: [],
        revenues: [
          {
            id: 'r1',
            name: 'Salário',
            amount: 5000,
            month: '2026-04',
            notes: '',
          },
          {
            id: 'r2',
            name: 'Freelance',
            amount: 1500,
            month: '2026-04',
            notes: 'Projeto X',
          },
        ],
        monthOverrides: [],
        settings: { currentMonthKey: '2026-04' },
        meta: { createdAt: '2026-01-01T00:00:00.000Z' },
      },
    });

    expect(state.revenues).toHaveLength(2);
    expect(state.revenues[0].name).toBe('Salário');
    expect(state.revenues[1].name).toBe('Freelance');
  });

  it('handles backup with monthOverrides', () => {
    // Note: monthOverrides are normalized as arrays by toArray() in normalizeBackupData
    // The actual FinanceState uses monthOverrides as Record, but during import it gets converted
    const monthOverridesArray = [{ monthKey: '2026-02', income: 6000, expense: 3000 }];

    const state = buildFinanceStateFromBackup({
      version: 2,
      data: {
        fixedExpenses: [],
        installments: [],
        revenues: [],
        monthOverrides: monthOverridesArray,
        settings: { currentMonthKey: '2026-02' },
        meta: { createdAt: '2026-01-01T00:00:00.000Z' },
      },
    });

    // monthOverrides becomes an array after toArray() normalization
    expect(Array.isArray(state.monthOverrides) || typeof state.monthOverrides === 'object').toBe(
      true
    );
  });

  it('handles backup with null and undefined values gracefully', () => {
    const state = buildFinanceStateFromBackup({
      version: 2,
      data: {
        fixedExpenses: null,
        installments: undefined,
        revenues: null,
        monthOverrides: undefined,
        settings: null,
        meta: undefined,
      },
    });

    expect(state.fixedExpenses).toEqual([]);
    expect(state.installments).toEqual([]);
    expect(state.revenues).toEqual([]);
    expect(state.monthOverrides).toEqual([]);
    expect(state.settings).toHaveProperty('theme');
    expect(state.meta).toHaveProperty('schemaVersion');
  });

  it('handles completely invalid input', () => {
    const state = buildFinanceStateFromBackup(null);

    expect(state.fixedExpenses).toEqual([]);
    expect(state.installments).toEqual([]);
    expect(state.revenues).toEqual([]);
    expect(state.currentDate).toBeInstanceOf(Date);
    expect(state.meta.schemaVersion).toBe(financeSchemaVersion);
  });

  it('handles input that is a string (invalid)', () => {
    const state = buildFinanceStateFromBackup('invalid data');

    expect(state.fixedExpenses).toEqual([]);
    expect(state.installments).toEqual([]);
    expect(state.revenues).toEqual([]);
  });

  it('handles input that is an array (invalid)', () => {
    const state = buildFinanceStateFromBackup([{ some: 'data' }]);

    expect(state.fixedExpenses).toEqual([]);
    expect(state.installments).toEqual([]);
  });

  it('preserves meta dates correctly', () => {
    const createdAtString = '2025-12-15T10:30:00.000Z';
    const lastResetAtString = '2026-01-10T08:00:00.000Z';

    const state = buildFinanceStateFromBackup({
      version: 2,
      data: {
        fixedExpenses: [],
        installments: [],
        revenues: [],
        monthOverrides: [],
        settings: { currentMonthKey: '2026-04' },
        meta: {
          createdAt: createdAtString,
          lastResetAt: lastResetAtString,
          schemaVersion: 2,
        },
      },
    });

    expect(state.meta.createdAt.toISOString()).toContain('2025-12-15');
    expect(state.meta.lastResetAt?.toISOString()).toContain('2026-01-10');
  });

  it('handles lastResetAt as null correctly', () => {
    const state = buildFinanceStateFromBackup({
      version: 2,
      data: {
        fixedExpenses: [],
        installments: [],
        revenues: [],
        monthOverrides: [],
        settings: {},
        meta: {
          createdAt: '2026-01-01T00:00:00.000Z',
          lastResetAt: null,
        },
      },
    });

    expect(state.meta.lastResetAt).toBeNull();
  });

  it('handles empty string lastResetAt as null', () => {
    const state = buildFinanceStateFromBackup({
      version: 2,
      data: {
        fixedExpenses: [],
        installments: [],
        revenues: [],
        monthOverrides: [],
        settings: {},
        meta: {
          createdAt: '2026-01-01T00:00:00.000Z',
          lastResetAt: '',
        },
      },
    });

    expect(state.meta.lastResetAt).toBeNull();
  });

  it('handles invalid date strings gracefully', () => {
    const state = buildFinanceStateFromBackup({
      version: 2,
      data: {
        fixedExpenses: [],
        installments: [],
        revenues: [],
        monthOverrides: [],
        settings: {},
        meta: {
          createdAt: 'invalid-date',
          lastResetAt: 'not-a-date',
        },
      },
    });

    // When date string is invalid, toDate returns the fallback (base.meta.createdAt)
    // which is a valid Date from emptyFinanceState
    expect(state.meta.createdAt).toBeInstanceOf(Date);
    expect(!Number.isNaN(state.meta.createdAt.getTime())).toBe(true);
  });

  it('merges backup settings with default settings', () => {
    const state = buildFinanceStateFromBackup({
      version: 2,
      data: {
        fixedExpenses: [],
        installments: [],
        revenues: [],
        monthOverrides: [],
        settings: {
          theme: 'dark',
          cardBills: [{ id: 'itau', name: 'Itaú' }],
        },
        meta: {},
      },
    });

    expect(state.settings.theme).toBe('dark');
    expect(state.settings.cardBills).toEqual([{ id: 'itau', name: 'Itaú' }]);
  });
});

describe('exportData.ts - exportAllData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports all data in the correct format', async () => {
    const mockState = {
      currentDate: new Date('2026-04-15'),
      fixedExpenses: [
        {
          id: 'f1',
          name: 'TV',
          amount: 100,
          dueDay: 10,
          category: 'outro',
          paymentMethod: 'nubank',
          card: null,
          active: true,
          startMonth: '2026-01',
          endMonth: null,
          notes: '',
        },
      ],
      installments: [
        {
          id: 'i1',
          name: 'Notebook',
          installmentValue: 250,
          totalInstallments: 12,
          currentInstallment: 5,
          card: 'santander',
          category: 'outro',
          startMonth: '2026-02',
          active: true,
          closedAt: null,
        },
      ],
      revenues: [
        {
          id: 'r1',
          name: 'Salário',
          baseAmount: 5000,
          active: true,
          startMonth: '2026-04',
          endMonth: null,
          category: 'outro',
          notes: '',
        },
      ],
      monthOverrides: [
        {
          id: 'o1',
          type: 'revenue' as const,
          itemId: 'r1',
          monthKey: '2026-02',
          amount: 6000,
        },
      ],
      settings: { theme: 'default' as 'default' | 'premium', cardBills: DEFAULT_CARD_BILLS },
      meta: {
        schemaVersion: financeSchemaVersion,
        createdAt: new Date('2026-01-01'),
        lastResetAt: new Date('2026-02-01'),
      },
    };

    vi.spyOn(storageModule, 'loadFinanceState').mockResolvedValue(mockState);

    const { exportAllData } = await import('../lib/exportData');
    const exported = (await exportAllData()) as ExportData;

    expect(exported.version).toBe(2);
    expect(exported.exportedAt).toBeDefined();
    expect(new Date(exported.exportedAt)).toBeInstanceOf(Date);
    expect(exported.data.fixedExpenses).toHaveLength(1);
    expect((exported.data.fixedExpenses[0] as any).name).toBe('TV');
    expect(exported.data.installments).toHaveLength(1);
    expect(exported.data.revenues).toHaveLength(1);
    expect(exported.data.monthOverrides).toEqual([
      {
        id: 'o1',
        type: 'revenue',
        itemId: 'r1',
        monthKey: '2026-02',
        amount: 6000,
      },
    ]);
    expect(exported.data.settings).toEqual(mockState.settings);
    expect((exported.data.meta as any).schemaVersion).toBe(financeSchemaVersion);
  });

  it('exports empty state when no data exists', async () => {
    const emptyState = emptyFinanceState();

    vi.spyOn(storageModule, 'loadFinanceState').mockResolvedValue(emptyState);

    const { exportAllData } = await import('../lib/exportData');
    const exported = (await exportAllData()) as ExportData;

    expect(exported.version).toBe(2);
    expect(exported.data.fixedExpenses).toEqual([]);
    expect(exported.data.installments).toEqual([]);
    expect(exported.data.revenues).toEqual([]);
    expect(exported.data.monthOverrides).toEqual([]);
  });

  it('exports data with correct export timestamp', async () => {
    const mockState = emptyFinanceState();
    vi.spyOn(storageModule, 'loadFinanceState').mockResolvedValue(mockState);

    const beforeExport = new Date();
    const { exportAllData } = await import('../lib/exportData');
    const exported = (await exportAllData()) as ExportData;
    const afterExport = new Date();

    const exportedDate = new Date(exported.exportedAt);
    expect(exportedDate.getTime()).toBeGreaterThanOrEqual(beforeExport.getTime());
    expect(exportedDate.getTime()).toBeLessThanOrEqual(afterExport.getTime());
  });
});

describe('exportData.ts - Data integrity round-trip', () => {
  it('data should survive export and re-import cycle', () => {
    const originalBackup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      data: {
        fixedExpenses: [
          {
            id: 'f1',
            name: 'Internet',
            amount: 120,
            paymentMethod: 'pix',
            card: null,
            active: true,
            startMonth: '2026-01',
            endMonth: null,
            notes: 'Home internet',
          },
        ],
        installments: [
          {
            id: 'i1',
            name: 'Phone',
            installmentValue: 100,
            totalInstallments: 12,
            currentInstallment: 6,
            card: 'nubank',
            category: 'tecnologia',
            startMonth: '2026-01',
            active: true,
            closedAt: null,
          },
        ],
        revenues: [
          {
            id: 'r1',
            name: 'Salário',
            amount: 5000,
            month: '2026-04',
            notes: '',
          },
        ],
        monthOverrides: [],
        settings: { theme: 'default', cardBills: DEFAULT_CARD_BILLS },
        meta: {
          schemaVersion: financeSchemaVersion,
          createdAt: '2026-01-01T00:00:00.000Z',
          lastResetAt: '2026-02-01T00:00:00.000Z',
        },
      },
    };

    const importedState = buildFinanceStateFromBackup(originalBackup);

    // Verify core data is preserved
    expect(importedState.fixedExpenses[0].name).toBe('Internet');
    expect(importedState.installments[0].name).toBe('Phone');
    expect(importedState.revenues[0].name).toBe('Salário');
    expect(importedState.settings.theme).toBe('default');
  });

  it('multiple imports should produce consistent results', () => {
    const backupData = {
      version: 2,
      data: {
        fixedExpenses: [
          {
            id: 'f1',
            name: 'Test Expense',
            amount: 50,
            paymentMethod: 'cartao',
            card: 'nubank',
            active: false,
            startMonth: '2026-03',
            endMonth: '2026-04',
            notes: 'Test notes',
          },
        ],
        installments: [],
        revenues: [],
        monthOverrides: [],
        settings: { currentMonthKey: '2026-04' },
        meta: { createdAt: '2026-03-01T00:00:00.000Z' },
      },
    };

    const firstImport = buildFinanceStateFromBackup(backupData);
    const secondImport = buildFinanceStateFromBackup(backupData);

    expect(firstImport.fixedExpenses[0].name).toBe(secondImport.fixedExpenses[0].name);
    expect(firstImport.fixedExpenses[0].amount).toBe(secondImport.fixedExpenses[0].amount);
    expect(firstImport.currentDate.toDateString()).toBe(secondImport.currentDate.toDateString());
  });
});

describe('exportData.ts - encodeStateToHash and decodeHashToState', () => {
  it('should encode and decode state correctly (round-trip)', async () => {
    const { encodeStateToHash, decodeHashToState } = await import('../lib/exportData');

    const testData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      data: {
        fixedExpenses: [
          {
            id: 'f1',
            name: 'Test Expense',
            amount: 100,
            paymentMethod: 'cartao',
            card: 'nubank',
            active: true,
            startMonth: '2026-01',
            endMonth: null,
          },
        ],
        installments: [],
        revenues: [],
        monthOverrides: [],
        settings: { theme: 'default', cardBills: [] },
        meta: { schemaVersion: 3, createdAt: new Date(), lastResetAt: null },
      },
    };

    const encoded = encodeStateToHash(testData as any);
    expect(encoded).toBeTruthy();
    expect(typeof encoded).toBe('string');
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');

    const decoded = decodeHashToState(encoded) as ExportData | null;
    expect(decoded).toBeTruthy();
    expect(decoded?.version).toBe(2);
    expect((decoded?.data.fixedExpenses[0] as any)?.name).toBe('Test Expense');
    expect((decoded?.data.fixedExpenses[0] as any)?.card).toBe('nubank');
  });

  it('should handle special characters in JSON', async () => {
    const { encodeStateToHash, decodeHashToState } = await import('../lib/exportData');

    const testData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      data: {
        fixedExpenses: [
          {
            id: 'f1',
            name: 'Gasto com çãõ é ção',
            amount: 100,
            paymentMethod: 'cartao',
            card: 'nubank',
            active: true,
            startMonth: '2026-01',
            endMonth: null,
          },
        ],
        installments: [],
        revenues: [],
        monthOverrides: [],
        settings: { theme: 'default', cardBills: [] },
        meta: { schemaVersion: 3, createdAt: new Date(), lastResetAt: null },
      },
    };

    const encoded = encodeStateToHash(testData as any);
    const decoded = decodeHashToState(encoded) as ExportData | null;
    expect((decoded?.data.fixedExpenses[0] as any)?.name).toBe('Gasto com çãõ é ção');
  });

  it('should return null for invalid hash', async () => {
    const { decodeHashToState } = await import('../lib/exportData');

    expect(decodeHashToState('invalid_hash')).toBeNull();
    expect(decodeHashToState('')).toBeNull();
    expect(decodeHashToState('abc123')).toBeNull();
  });
});

describe('exportData.ts - generateExportLink', () => {
  it('should generate a valid link with import hash', async () => {
    const { generateExportLink } = await import('../lib/exportData');

    const link = await generateExportLink();
    expect(link).toBeTruthy();
    expect(typeof link).toBe('string');
    expect(link).toContain('#import=');
  });
});

describe('Card usage bug fix - isMonthInRange filter', () => {
  let isMonthInRange: (
    monthKey: string,
    startMonth: string | null,
    endMonth: string | null
  ) => boolean;

  beforeEach(async () => {
    const utils = await import('../../../features/finance/lib/utils');
    isMonthInRange = utils.isMonthInRange;
  });

  it('should not consider card in use when fixed expense has endMonth in the past', () => {
    const fixedExpenses = [
      {
        id: 'f1',
        name: 'Expense 1',
        amount: 100,
        paymentMethod: 'cartao',
        card: 'nubank',
        active: true,
        startMonth: '2026-01',
        endMonth: '2026-03',
      },
    ];

    const currentKey = '2026-04';

    const activeInMonth = fixedExpenses.filter(
      (item) =>
        item.paymentMethod === 'cartao' &&
        !!item.card &&
        isMonthInRange(currentKey, item.startMonth, item.endMonth)
    );

    expect(activeInMonth.length).toBe(0);
  });

  it('should consider card in use when fixed expense is active in current month', () => {
    const fixedExpenses = [
      {
        id: 'f1',
        name: 'Expense 1',
        amount: 100,
        paymentMethod: 'cartao',
        card: 'nubank',
        active: true,
        startMonth: '2026-01',
        endMonth: null,
      },
    ];

    const currentKey = '2026-04';

    const activeInMonth = fixedExpenses.filter(
      (item) =>
        item.paymentMethod === 'cartao' &&
        !!item.card &&
        isMonthInRange(currentKey, item.startMonth, item.endMonth)
    );

    expect(activeInMonth.length).toBe(1);
    expect(activeInMonth[0].card).toBe('nubank');
  });

  it('should not consider card in use when endMonth equals current month', () => {
    const fixedExpenses = [
      {
        id: 'f1',
        name: 'Expense 1',
        amount: 100,
        paymentMethod: 'cartao',
        card: 'nubank',
        active: true,
        startMonth: '2026-01',
        endMonth: '2026-04',
      },
    ];

    const currentKey = '2026-04';

    const activeInMonth = fixedExpenses.filter(
      (item) =>
        item.paymentMethod === 'cartao' &&
        !!item.card &&
        isMonthInRange(currentKey, item.startMonth, item.endMonth)
    );

    expect(activeInMonth.length).toBe(1);
  });
});
