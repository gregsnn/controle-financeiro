export const financeSchemaVersion = 3;

export const emptyFinanceState = {
  currentDate: new Date(),
  fixedExpenses: [],
  installments: [],
  revenues: [],
  monthOverrides: [],
  settings: {
    theme: 'default',
  },
  meta: {
    schemaVersion: financeSchemaVersion,
    createdAt: new Date().toISOString(),
    lastResetAt: null,
  },
};
