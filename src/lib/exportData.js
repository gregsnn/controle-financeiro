const STORAGE_KEY = 'controle-financeiro-data';

async function exportAllData() {
  const data = localStorage.getItem(STORAGE_KEY);

  const parsed = data
    ? JSON.parse(data)
    : {
        fixedExpenses: [],
        installments: [],
        revenues: [],
        monthOverrides: [],
        settings: {},
        meta: {},
      };

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    data: parsed,
  };
}

async function downloadJSON() {
  const data = await exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `finance-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export { exportAllData, downloadJSON };

if (typeof window !== 'undefined') {
  window.exportFinanceData = downloadJSON;
}
