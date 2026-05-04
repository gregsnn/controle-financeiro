import { useEffect, useMemo, useRef, useState } from 'react';
import type { CardBillItem } from '../domain/types';
import { detectBankColor } from '../lib/bankColors';
import { applyMoneyMask, formatMoneyInput, parseMoneyInput } from '../lib/moneyInput';
import { EmptyBillsState } from './EmptyBillsState';
import { ConfirmModal } from './modals';

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
}

function BillCard({
  card,
  value,
  onChange,
  onDelete,
  _canDelete,
  deleteReason,
}: {
  card: CardBillItem;
  value: string;
  onChange: (value: string) => void;
  onDelete: () => void;
  _canDelete: boolean;
  deleteReason?: string;
}) {
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
      onChange('');
      setInputValue('');
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

  const getCardStyle = (): React.CSSProperties => {
    if (isEditing) {
      return {
        background: 'var(--color-background-primary)',
        border: '2px solid var(--color-accent)',
      };
    }
    if (card.color) {
      return {
        background: `color-mix(in srgb, ${card.color} 18%, transparent)`,
        border: `1px solid ${card.color}`,
      };
    }
    return {};
  };

  return (
    <div
      className="bill-card"
      style={getCardStyle()}
      onClick={() => {
        if (!isEditing && hasValue) setIsEditing(true);
      }}
    >
      <div className="bill-card-ident">
        <span className="bill-card-icon">{card.icon || '💳'}</span>
        <span className="bill-card-name">{card.name}</span>
        <button
          type="button"
          className="bill-card-delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title={
            deleteReason ? `Não é possível apagar: ${deleteReason}` : `Apagar cartão ${card.name}`
          }
          disabled={!!deleteReason}
          aria-label={deleteReason ? `Cartão ${card.name} em uso` : `Apagar cartão ${card.name}`}
        >
          {deleteReason ? 'Em uso' : 'Apagar'}
        </button>
      </div>
      {isEditing ? (
        <div className="bill-input-shell" onClick={(e) => e.stopPropagation()}>
          <span className="bill-currency">R$</span>
          <input
            ref={inputRef}
            className="bill-card-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(applyMoneyMask(e.target.value))}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            inputMode="numeric"
            autoComplete="off"
            placeholder="0,00"
          />
        </div>
      ) : hasValue ? (
        <p
          className="bill-card-value"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          style={{ cursor: 'pointer' }}
        >
          {value}
        </p>
      ) : (
        <button
          type="button"
          className="bill-card-add-value"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          + Incluir fatura
        </button>
      )}
    </div>
  );
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
}: MonthNavProps) {
  const isDarkTheme = theme === 'premium';
  const nextThemeIcon = isDarkTheme ? '☀' : '🌙';
  const nextThemeLabel = isDarkTheme ? 'Claro' : 'Escuro';
  const cards = useMemo(() => cardList ?? [], [cardList]);
  const hasCards = cards.length > 0;

  // Memoize the computation of billInputs to avoid redundant calculations
  const computedBillInputs = useMemo(
    () =>
      cards.reduce(
        (acc, c) => {
          acc[c.id] = formatMoneyInput(cardBills?.[c.id], { hideNonPositive: true });
          return acc;
        },
        {} as Record<string, string>
      ),
    [cardBills, cards]
  );

  const [billInputs, setBillInputs] = useState(computedBillInputs);

  // Keep local state in sync with computed values
  useEffect(() => {
    setBillInputs(computedBillInputs);
  }, [computedBillInputs]);

  const handleBillInputChange = (cardId: string, rawValue: string) => {
    const masked = applyMoneyMask(rawValue);
    setBillInputs((prev) => ({ ...prev, [cardId]: masked }));
    onSetCardBill(cardId, parseMoneyInput(masked, { allowZero: false }));
  };

  const [isAdding, setIsAdding] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardIcon, setNewCardIcon] = useState('💳');
  const [newCardColor, setNewCardColor] = useState('#000000');
  const [deleteTarget, setDeleteTarget] = useState<CardBillItem | null>(null);

  const iconOptions = ['💳', '🔴', '💙', '💚', '💜', '🖤', '🏦', '🏠', '💰', '🪙'];

  const handleAddCard = () => {
    if (!onSetCardList) return;
    const id = newCardName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!id) return;

    // Auto-detect bank color if not manually chosen
    let cardColor = newCardColor;
    if (newCardColor === '#000000') {
      const detectedColor = detectBankColor(newCardName);
      if (detectedColor) {
        cardColor = detectedColor;
      }
    }

    const newCard: CardBillItem = {
      id,
      name: newCardName.trim(),
      icon: newCardIcon,
    };
    if (cardColor !== '#000000') {
      newCard.color = cardColor;
    }
    const next = [...(cardList || []), newCard];
    onSetCardList(next);
    setNewCardName('');
    setNewCardIcon('💳');
    setNewCardColor('#000000');
    setIsAdding(false);
  };

  const handleDeleteCard = (cardId: string) => {
    if (!onSetCardList) return;
    const target = cards.find((card) => card.id === cardId);
    if (!target) return;
    setDeleteTarget(target);
  };

  useEffect(() => {
    if (!hasCards) setIsAdding(false);
  }, [hasCards]);

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
            ←
          </button>
          <h2>{label}</h2>
          <button
            className="month-step-btn month-step-btn--icon"
            type="button"
            onClick={onNext}
            aria-label="Proximo mes"
          >
            →
          </button>
        </div>
        <button
          className="theme-btn"
          onClick={onToggleTheme}
          aria-label={`Mudar para tema ${nextThemeLabel}`}
          title={`Mudar para tema ${nextThemeLabel}`}
        >
          <span aria-hidden="true" className="theme-btn-icon">
            {nextThemeIcon}
          </span>
          <span className="theme-btn-label">{nextThemeLabel}</span>
        </button>
      </div>
      <div className="card-bill-panel">
        <div className="card-bill-panel-head">
          <p className="card-bill-title">Faturas do mês</p>
          {hasCards && onSetCardList ? (
            <button
              type="button"
              className="card-bill-add-btn"
              onClick={() => setIsAdding((prev) => !prev)}
            >
              {isAdding ? 'Fechar' : '+ Novo cartão'}
            </button>
          ) : null}
        </div>

        {isAdding ? (
          <div className="card-bill-add-form">
            <input
              className="card-bill-add-input"
              type="text"
              placeholder="Nome do cartão"
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
            />
            <div className="icon-selector">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`icon-option ${newCardIcon === icon ? 'selected' : ''}`}
                  onClick={() => setNewCardIcon(icon)}
                >
                  {icon}
                </button>
              ))}
            </div>
            <div className="color-picker-section">
              {newCardName && detectBankColor(newCardName) && newCardColor === '#000000' ? (
                <div className="color-detection-info">
                  <p className="color-detection-label">
                    🎨 Cor detectada automaticamente: <strong>{newCardName}</strong>
                  </p>
                  <div
                    className="color-preview"
                    style={{
                      background: `color-mix(in srgb, ${detectBankColor(newCardName)} 18%, transparent)`,
                      border: `2px solid ${detectBankColor(newCardName)}`,
                    }}
                    title="Cor do cartão"
                  >
                    <span style={{ fontSize: '20px' }}>{newCardIcon}</span>
                  </div>
                </div>
              ) : null}
              <div className="color-picker-wrapper">
                <label htmlFor="card-color-picker">Cor do cartão:</label>
                <input
                  id="card-color-picker"
                  type="color"
                  className="color-picker"
                  value={newCardColor}
                  onChange={(e) => setNewCardColor(e.target.value)}
                  title="Clique para escolher uma cor personalizada"
                />
                {newCardColor !== '#000000' ? (
                  <span className="color-custom-label">(Personalizado)</span>
                ) : null}
              </div>
            </div>
            <button type="button" className="card-bill-add-confirm" onClick={handleAddCard}>
              Adicionar
            </button>
          </div>
        ) : null}

        {hasCards ? (
          <div className="card-bill-grid">
            {cards.map((c) => (
              <BillCard
                key={c.id}
                card={c}
                value={billInputs?.[c.id] || ''}
                onChange={(v) => handleBillInputChange(c.id, v)}
                onDelete={() => handleDeleteCard(c.id)}
                _canDelete={!cardDeleteReasons?.[c.id]}
                deleteReason={cardDeleteReasons?.[c.id]}
              />
            ))}
          </div>
        ) : (
          <EmptyBillsState canAdd={!!onSetCardList} onAddCard={() => setIsAdding(true)} />
        )}
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        title="Apagar cartão"
        message={`Tem certeza que deseja apagar o cartão "${deleteTarget?.name || ''}"?`}
        confirmLabel="Apagar"
        onConfirm={() => {
          if (!deleteTarget || !onSetCardList) return;
          onSetCardList(cards.filter((card) => card.id !== deleteTarget.id));
          onSetCardBill(deleteTarget.id, null);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
