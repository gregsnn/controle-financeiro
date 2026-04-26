import { useEffect, useState, useRef } from 'react';
import { applyMoneyMask, formatMoneyInput, parseMoneyInput } from '../lib/moneyInput';
import { DEFAULT_CARD_BILLS } from '../lib/schema';
import type { CardBillItem } from '../domain/types';

interface MonthNavProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  theme: 'default' | 'premium';
  onToggleTheme: () => void;
  cardBills: Record<string, number>;
  onSetCardBill: (cardId: string, amount: number | null) => void;
}

function BillCard({ card, value, onChange }: { card: CardBillItem; value: string; onChange: (value: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [hasValue, setHasValue] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
    setHasValue(!!value && value !== 'R$ 0,00');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseMoneyInput(inputValue, { allowZero: true });
    if (parsed !== null && parsed > 0) {
      onChange(inputValue);
      setHasValue(true);
    } else {
      setInputValue(value);
      setHasValue(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') inputRef.current?.blur();
    if (e.key === 'Escape') {
      setInputValue(value);
      setIsEditing(false);
    }
  };

  const getCardStyle = () => {
    if (isEditing) {
      return {
        background: 'var(--color-background-primary)',
        border: '2px solid var(--color-accent)',
      };
    }
    if (card.id === 'nubank') {
      return { background: 'var(--color-pill-nub-bg)', border: '2px solid var(--color-pill-nub-text)' };
    }
    if (card.id === 'santander') {
      return { background: 'var(--color-pill-san-bg)', border: '2px solid var(--color-pill-san-text)' };
    }
    return { background: 'var(--color-card-bg)', border: '2px solid var(--color-card-border)' };
  };

  const cardStyle = getCardStyle();

  return (
    <div
      className="bill-card"
      onClick={() => setIsEditing(true)}
      style={{
        ...cardStyle,
        borderRadius: '8px',
        padding: '10px 12px',
        cursor: 'pointer',
        minWidth: '120px',
        flex: '1 1 140px',
        maxWidth: '160px',
        transition: 'all 0.2s ease',
        transform: isEditing ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '18px' }}>{card.icon || '•'}</span>
        <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{card.name}</span>
      </div>
      {isEditing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>R$</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => setInputValue(applyMoneyMask(e.target.value))}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-primary)',
              fontSize: '14px',
              fontWeight: 600,
              width: '100%',
              outline: 'none',
            }}
          />
        </div>
      ) : (
        <div
          style={{
            fontSize: hasValue ? '16px' : '12px',
            fontWeight: hasValue ? 600 : 400,
            color: hasValue ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
          }}
        >
          {hasValue ? value : '+ add'}
        </div>
      )}
    </div>
  );
}

export default function MonthNav({ label, onPrev, onNext, theme, onToggleTheme, cardBills, onSetCardBill }: MonthNavProps) {
  const isDarkTheme = theme === 'premium';
  const nextThemeIcon = isDarkTheme ? '☀' : '🌙';
  const nextThemeLabel = isDarkTheme ? 'Claro' : 'Escuro';
  const cards = DEFAULT_CARD_BILLS;

  const [billInputs, setBillInputs] = useState(() =>
    cards.reduce((acc, c) => {
      acc[c.id] = formatMoneyInput(cardBills?.[c.id], { hideNonPositive: true });
      return acc;
    }, {} as Record<string, string>)
  );

  useEffect(() => {
    setBillInputs(cards.reduce((acc, c) => {
      acc[c.id] = formatMoneyInput(cardBills?.[c.id], { hideNonPositive: true });
      return acc;
    }, {} as Record<string, string>));
  }, [cardBills, cards]);

  const handleBillInputChange = (cardId: string, rawValue: string) => {
    const masked = applyMoneyMask(rawValue);
    setBillInputs(prev => ({ ...prev, [cardId]: masked }));
    onSetCardBill(cardId, parseMoneyInput(masked, { allowZero: false }));
  };

  return (
    <div className="month-nav">
      <div className="month-nav-top">
        <div className="month-stepper" role="group" aria-label="Navegacao de meses">
          <button className="month-step-btn month-step-btn--icon" type="button" onClick={onPrev} aria-label="Mes anterior">←</button>
          <h2>{label}</h2>
          <button className="month-step-btn month-step-btn--icon" type="button" onClick={onNext} aria-label="Proximo mes">→</button>
        </div>
        <button className="theme-btn" onClick={onToggleTheme} aria-label={`Mudar para tema ${nextThemeLabel}`} title={`Mudar para tema ${nextThemeLabel}`}>
          <span aria-hidden="true" className="theme-btn-icon">{nextThemeIcon}</span>
          <span className="theme-btn-label">{nextThemeLabel}</span>
        </button>
      </div>

      <div className="card-bill-panel" style={{ paddingBottom: '8px' }}>
        <p className="card-bill-title" style={{ marginBottom: '8px', fontSize: '13px' }}>Faturas do mês</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {cards.map(c => <BillCard key={c.id} card={c} value={billInputs?.[c.id] || ''} onChange={v => handleBillInputChange(c.id, v)} />)}
        </div>
      </div>
    </div>
  );
}