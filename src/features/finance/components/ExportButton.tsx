import { generateExportLink } from '../lib/exportData';

export function ExportButton() {
  const handleExport = async () => {
    try {
      const link = await generateExportLink();
      console.log('Link gerado (primeiros 100 chars):', link.substring(0, 100) + '...');
      const copiado = await navigator.clipboard
        .writeText(link)
        .then(() => true)
        .catch(() => false);
      if (copiado) {
        alert('Link copiado! Cole em outro navegador/guia para importar.');
      } else {
        prompt('Copie o link abaixo:', link);
      }
      // Abre em nova aba para teste automático
      const testar = window.confirm(
        'Deseja abrir o link em uma nova aba para testar a importação?'
      );
      if (testar) {
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
      className="add-btn"
      title="Exportar dados via link"
    >
      ↗ Exportar Link
    </button>
  );
}
