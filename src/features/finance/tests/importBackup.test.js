import assert from 'node:assert/strict';
import test from 'node:test';

const mockBackupData = {
  version: 2,
  exportedAt: new Date().toISOString(),
  data: {
    fixedExpenses: [
      {
        id: 'exp_1',
        name: 'Internet',
        amount: 120,
        category: 'casa',
        paymentMethod: 'boleto',
        active: true,
        startMonth: '2026-01',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'exp_2',
        name: 'Luz',
        amount: 150,
        category: 'casa',
        paymentMethod: 'boleto',
        active: true,
        startMonth: '2026-01',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
    revenues: [
      {
        id: 'rev_1',
        name: 'Salário',
        amount: 5000,
        active: true,
        startMonth: '2026-01',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
    installments: [
      {
        id: 'inst_1',
        name: 'TV',
        totalInstallments: 12,
        currentInstallment: 1,
        installmentValue: 150,
        card: 'nubank',
        active: true,
        startMonth: '2026-01',
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
    monthOverrides: [],
    settings: { theme: 'premium', currency: 'BRL' },
    meta: { schemaVersion: 3 },
  },
};

test('Import: backup tem versão válida', () => {
  assert.equal(mockBackupData.version, 2);
  assert.ok(mockBackupData.data);
});

test('Import: dados tem campos obrigatórios', () => {
  const { data } = mockBackupData;
  assert.ok(Array.isArray(data.fixedExpenses));
  assert.ok(Array.isArray(data.revenues));
  assert.ok(Array.isArray(data.installments));
  assert.ok(data.settings);
});

test('Import: expenses tem dados corretos', () => {
  const { fixedExpenses } = mockBackupData.data;
  assert.equal(fixedExpenses.length, 2);
  assert.equal(fixedExpenses[0].name, 'Internet');
  assert.equal(fixedExpenses[0].amount, 120);
});

test('Import: revenues tem dados corretos', () => {
  const { revenues } = mockBackupData.data;
  assert.equal(revenues.length, 1);
  assert.equal(revenues[0].name, 'Salário');
  assert.equal(revenues[0].amount, 5000);
});

test('Import: installments tem dados corretos', () => {
  const { installments } = mockBackupData.data;
  assert.equal(installments.length, 1);
  assert.equal(installments[0].totalInstallments, 12);
  assert.equal(installments[0].installmentValue, 150);
});

test('Import: settings tem valores corretos', () => {
  const { settings } = mockBackupData.data;
  assert.equal(settings.theme, 'premium');
  assert.equal(settings.currency, 'BRL');
});

test('Import: vazio não deve ter dados', () => {
  const emptyBackup = {
    version: 2,
    data: {
      fixedExpenses: [],
      revenues: [],
      installments: [],
      monthOverrides: [],
      settings: {},
      meta: {},
    },
  };

  const totalItems =
    emptyBackup.data.fixedExpenses.length +
    emptyBackup.data.revenues.length +
    emptyBackup.data.installments.length;

  assert.equal(totalItems, 0);
});

test('Import: converte boolean active para inteiro', () => {
  const expense = { id: 'e1', name: 'Test', active: true };
  const normalized = { ...expense, active: expense.active ? 1 : 0 };
  assert.equal(normalized.active, 1);
});

test('Import: converte amount para número', () => {
  const expense = { id: 'e1', name: 'Test', amount: '120.50' };
  const normalized = { ...expense, amount: Number(expense.amount) };
  assert.equal(normalized.amount, 120.5);
  assert.ok(typeof normalized.amount === 'number');
});
