import { type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import type { CardBillItem } from '../domain/types';
import { CardBillsSection } from './CardBillsSection';

interface MonthNavProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  theme: 'default' | 'premium';
  onToggleTheme: () => void;
  cardBills: Record<string, number>;
  onSetCardBill: (cardId: string, amount: number | null) => void;
  cardList?: CardBillItem[];
  onSetCardList?: (list: CardBillItem[]) => void;
  cardDeleteReasons?: Record<string, string>;
  headerActions?: ReactNode;
}

export default function MonthNav({
  label,
  onPrev,
  onNext,
  theme,
  onToggleTheme,
  cardBills,
  onSetCardBill,
  cardList,
  onSetCardList,
  cardDeleteReasons,
  headerActions,
}: MonthNavProps) {
  const isDarkTheme = theme === 'premium';
  const nextThemeLabel = isDarkTheme ? 'Claro' : 'Escuro';
  const ThemeIcon = isDarkTheme ? Sun : Moon;

  return (
    <div className="month-nav">
      <div className="month-nav-top">
        <div className="month-stepper" role="group" aria-label="Navegacao de meses">
          <button
            className="month-step-btn month-step-btn--icon"
            type="button"
            onClick={onPrev}
            aria-label="Mes anterior"
          >
            &lt;
          </button>
          <h2>{label}</h2>
          <button
            className="month-step-btn month-step-btn--icon"
            type="button"
            onClick={onNext}
            aria-label="Proximo mes"
          >
            &gt;
          </button>
        </div>
        <div className="month-nav-actions">
          {headerActions}
          <button
            className="theme-btn"
            onClick={onToggleTheme}
            aria-label={`Mudar para tema ${nextThemeLabel}`}
            title={`Mudar para tema ${nextThemeLabel}`}
          >
            <ThemeIcon aria-hidden="true" className="theme-btn-icon" size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      <CardBillsSection
        cardBills={cardBills}
        onSetCardBill={onSetCardBill}
        cardList={cardList}
        onSetCardList={onSetCardList}
        cardDeleteReasons={cardDeleteReasons}
      />
    </div>
  );
}
