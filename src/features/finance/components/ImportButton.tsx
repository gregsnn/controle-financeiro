import { useRef, useState, type ChangeEvent } from 'react';
import { importFinanceBackupFile } from '../lib/exportData';
import { useFinanceActions } from '../hooks/useFinanceActions';

export function ImportButton() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { importFinanceState } = useFinanceActions();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImporting(true);
    try {
      const nextState = await importFinanceBackupFile(file);
      importFinanceState(nextState);
    } catch (err) {
      console.error('Erro ao importar:', err);
      alert('Erro ao importar dados. Verifique o arquivo JSON.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleImportClick}
        className="add-btn"
        title="Importar dados de um JSON"
        disabled={isImporting}
      >
        ↑ Importar
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileChange}
        aria-label="Importar dados"
        style={{ display: 'none' }}
      />
    </>
  );
}
