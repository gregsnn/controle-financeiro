import { useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { enrichCardsWithColors } from '../lib/bankColors';

export function useFinanceSettings() {
  const { settings } = useFinance();

  // Enrich cards with colors if not already defined
  return useMemo(() => {
    if (!settings.cardBills || settings.cardBills.length === 0) {
      return settings;
    }

    return {
      ...settings,
      cardBills: enrichCardsWithColors(settings.cardBills),
    };
  }, [settings]);
}
