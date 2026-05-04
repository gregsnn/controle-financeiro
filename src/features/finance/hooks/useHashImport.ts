import { useEffect } from 'react';
import { buildFinanceStateFromBackup, decodeHashToState } from '../lib/exportData';
import type { FinanceState } from '../domain/types';

interface UseHashImportParams {
  onImport: (state: FinanceState) => void;
}

export function useHashImport({ onImport }: UseHashImportParams) {
  useEffect(() => {
    const checkHash = () => {
      const fullUrl = window.location.href;
      const hashIndex = fullUrl.indexOf('#');
      const hash = hashIndex >= 0 ? fullUrl.substring(hashIndex) : '';

      if (!hash.includes('import=')) return;

      const encoded = hash.split('import=')[1]?.split('&')[0];
      if (!encoded) {
        window.location.hash = '';
        return;
      }

      try {
        const decoded = decodeURIComponent(encoded);
        const data = decodeHashToState(decoded);
        if (!data) {
          alert('Link de importação inválido ou expirado.');
          window.location.hash = '';
          return;
        }

        const confirmed = window.confirm(
          'Deseja importar os dados do link? Isso substituirá seus dados atuais.'
        );
        if (confirmed) {
          try {
            const state = buildFinanceStateFromBackup(data);
            onImport(state);
            alert('Dados importados com sucesso! A página será recarregada.');
            setTimeout(() => window.location.reload(), 500);
          } catch (err) {
            console.error('Erro ao importar:', err);
            alert('Erro ao importar dados. Verifique o console (F12).');
          }
        }
      } catch (e) {
        console.error('Erro ao decodificar link:', e);
        alert('Link de importação inválido.');
      }

      window.location.hash = '';
    };

    // Small delay to ensure URL is loaded
    const timer = setTimeout(checkHash, 100);
    return () => clearTimeout(timer);
  }, [onImport]);
}
