import { downloadJSON } from '../../../lib/exportData';

export function ExportButton() {
  const handleExport = async () => {
    try {
      await downloadJSON();
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Erro ao exportar dados. Verifique o console.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="add-btn"
      title="Exportar dados para JSON"
    >
      ↓ Exportar
    </button>
  );
}
