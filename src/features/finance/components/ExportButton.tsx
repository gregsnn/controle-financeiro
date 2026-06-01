import { Link } from 'lucide-react';
import { generateExportLink } from '../lib/exportData';

export function ExportButton() {
  const handleExport = async () => {
    try {
      const link = await generateExportLink();
      const copied = await navigator.clipboard
        .writeText(link)
        .then(() => true)
        .catch(() => false);

      if (copied) {
        alert('Link copiado! Cole em outro navegador/guia para importar.');
      } else {
        prompt('Copie o link abaixo:', link);
      }

      const shouldTest = window.confirm(
        'Deseja abrir o link em uma nova aba para testar a importacao?'
      );
      if (shouldTest) {
        window.open(link, '_blank');
      }
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Erro ao exportar. Verifique o console (F12).');
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="export-link-btn"
      title="Exportar dados via link"
    >
      <Link size={13} strokeWidth={2.2} aria-hidden />
      Exportar Link
    </button>
  );
}
