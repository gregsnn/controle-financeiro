import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { CardBillItem } from '../domain/types';
import { useCardList } from '../hooks/useCardList';
import { detectBankColor } from '../lib/bankColors';
import { useI18n } from '../lib/i18n';
import { applyMoneyMask, formatMoneyInput, parseMoneyInput } from '../lib/moneyInput';
import { EmptyBillsState } from './EmptyBillsState';
import { ConfirmModal, RuleModal } from './modals';

interface CardBillsSectionProps {
  cardBills: Record<string, number>;
  onSetCardBill: (cardId: string, amount: number | null) => void;
  cardList?: CardBillItem[];
  onSetCardList?: (list: CardBillItem[]) => void;
  cardDeleteReasons?: Record<string, string>;
}

function BillCard({
  card,
  displayName,
  value,
  onChange,
  onDelete,
  onEdit,
  _canDelete,
  deleteReason,
}: {
  card: CardBillItem;
  displayName: string;
  value: string;
  onChange: (value: string) => void;
  onDelete: () => void;
  onEdit: () => void;
  _canDelete: boolean;
  deleteReason?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [hasValue, setHasValue] = useState(false);
  const inputShellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasCommittedRef = useRef(false);
  const displayValue = value.replace(/^R\$\s*/, '');

  useEffect(() => {
    if (!isEditing) {
      setInputValue(value);
    }
    setHasValue(!!value && value !== 'R$ 0,00');
  }, [isEditing, value]);

  useLayoutEffect(() => {
    if (!isEditing) return;

    hasCommittedRef.current = false;
    inputRef.current?.focus();
    const frameId = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [isEditing]);

  const commitInputValue = useCallback(() => {
    if (hasCommittedRef.current) return;
    hasCommittedRef.current = true;
    setIsEditing(false);
    const parsed = parseMoneyInput(inputValue, { allowZero: true });
    if (parsed !== null && parsed > 0) {
      const formatted = formatMoneyInput(parsed);
      onChange(formatted);
      setInputValue(formatted);
      setHasValue(true);
    } else {
      onChange('');
      setInputValue('');
      setHasValue(false);
    }
  }, [inputValue, onChange]);

  useEffect(() => {
    if (!isEditing) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (inputShellRef.current?.contains(event.target as Node)) return;
      inputRef.current?.blur();
      commitInputValue();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [commitInputValue, isEditing]);

  const handleBlur = () => {
    commitInputValue();
  };

  const startEditing = () => {
    setIsEditing(true);
    window.setTimeout(() => {
      inputRef.current?.focus();
      const length = inputRef.current?.value.length || 0;
      inputRef.current?.setSelectionRange(length, length);
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') inputRef.current?.blur();
    if (e.key === 'Escape') {
      setInputValue(value);
      setIsEditing(false);
    }
  };

  const getCardStyle = (): React.CSSProperties => {
    if (card.color) {
      const style: React.CSSProperties & Record<string, string | undefined> = {
        border: `1px solid color-mix(in srgb, ${card.color} 75%, #0b2b57 20%)`,
      };
      style['--bill-card-color'] = card.color;
      return style;
    }
    return {};
  };

  return (
    <div
      className={`bill-card ${hasValue ? 'bill-card--has-value' : 'bill-card--empty'} ${
        deleteReason ? 'bill-card--locked' : ''
      }`}
      style={getCardStyle()}
    >
      <div className="bill-card-top">
        <button
          type="button"
          className="bill-card-name-btn"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label={`Editar cartao ${displayName}`}
          title={`Editar cartao ${displayName}`}
        >
          <span className="bill-card-name">{displayName}</span>
          <Pencil size={11} strokeWidth={2.4} aria-hidden />
        </button>
        <div className="bill-card-actions">
          {deleteReason ? (
            <span className="bill-card-status">EM USO</span>
          ) : (
            <button
              type="button"
              className="bill-card-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label={`Apagar cartao ${displayName}`}
              title={`Apagar cartao ${displayName}`}
            >
              <Trash2 size={11} strokeWidth={2} aria-hidden />
              Excluir
            </button>
          )}
        </div>
      </div>

      <div className="bill-card-divider" />

      <div className="bill-card-bottom">
        <span className="bill-card-label">FATURA</span>
        {card.dueDay ? <span className="bill-card-due">Vence dia {card.dueDay}</span> : null}
      </div>

      <div className={`bill-display${isEditing ? ' editing' : ''}`}>
        <span className="bill-currency">R$</span>
        <p
          className="bill-card-value"
          onPointerDown={(e) => {
            if (hasValue) e.preventDefault();
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isEditing && hasValue) startEditing();
          }}
          style={{ cursor: hasValue && !isEditing ? 'pointer' : 'default' }}
        >
          {displayValue}
        </p>
        {!hasValue && !isEditing && (
          <button
            type="button"
            className="bill-card-add-value"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              startEditing();
            }}
          >
            + Incluir fatura
          </button>
        )}
        <div
          ref={inputShellRef}
          className={`bill-input-shell${isEditing ? ' visible' : ''}`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            className="bill-card-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(applyMoneyMask(e.target.value))}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            inputMode="decimal"
            autoComplete="off"
            aria-label={`Valor da fatura ${displayName}`}
            placeholder="0,00"
          />
        </div>
      </div>
    </div>
  );
}

export function CardBillsSection({
  cardBills,
  onSetCardBill,
  cardList,
  onSetCardList,
  cardDeleteReasons,
}: CardBillsSectionProps) {
  const { normalizeCardName } = useI18n();
  const cards = useCardList(cardList);
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

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardDueDay, setNewCardDueDay] = useState('');
  const [newCardBillInput, setNewCardBillInput] = useState('');
  const [editTarget, setEditTarget] = useState<CardBillItem | null>(null);
  const [editCardName, setEditCardName] = useState('');
  const [editCardDueDay, setEditCardDueDay] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CardBillItem | null>(null);

  const resetAddCardForm = () => {
    setNewCardName('');
    setNewCardDueDay('');
    setNewCardBillInput('');
  };

  const openAddCardModal = () => {
    resetAddCardForm();
    setIsAddModalOpen(true);
  };

  const closeAddCardModal = () => {
    setIsAddModalOpen(false);
    resetAddCardForm();
  };

  const handleAddCard = () => {
    if (!onSetCardList) return;
    const id = newCardName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!id) return;

    const cardColor = detectBankColor(newCardName);
    const initialBill = parseMoneyInput(newCardBillInput, { allowZero: false });
    const dueDay = newCardDueDay ? Number(newCardDueDay) : null;

    const newCard: CardBillItem = {
      id,
      name: newCardName.trim(),
    };
    if (cardColor) {
      newCard.color = cardColor;
    }
    if (dueDay !== null) {
      newCard.dueDay = dueDay;
    }
    const next = [...(cardList || []), newCard];
    onSetCardList(next);
    if (initialBill !== null) {
      onSetCardBill(id, initialBill);
    }
    closeAddCardModal();
  };

  const handleDeleteCard = (cardId: string) => {
    if (!onSetCardList) return;
    const target = cards.find((card) => card.id === cardId);
    if (!target) return;
    setDeleteTarget(target);
  };

  const openEditCardModal = (card: CardBillItem) => {
    setEditTarget(card);
    setEditCardName(card.name);
    setEditCardDueDay(card.dueDay ? String(card.dueDay) : '');
  };

  const closeEditCardModal = () => {
    setEditTarget(null);
    setEditCardName('');
    setEditCardDueDay('');
  };

  const handleEditCard = () => {
    if (!onSetCardList || !editTarget) return;
    const name = editCardName.trim();
    if (!name) return;
    const dueDay = editCardDueDay ? Number(editCardDueDay) : null;
    const detectedColor = detectBankColor(name);
    onSetCardList(
      (cardList || []).map((card) => {
        if (card.id !== editTarget.id) return card;
        const nextCard: CardBillItem = {
          ...card,
          name,
          dueDay,
        };
        if (!card.color && detectedColor) {
          nextCard.color = detectedColor;
        }
        return nextCard;
      })
    );
    closeEditCardModal();
  };

  useEffect(() => {
    if (!hasCards) {
      setIsAddModalOpen(false);
      setNewCardName('');
      setNewCardBillInput('');
    }
  }, [hasCards]);

  return (
    <div className="month-nav">
      <div className="card-bill-panel">
        <div className="card-bill-panel-head">
          <p className="card-bill-title">Faturas do mes</p>
          {hasCards && onSetCardList ? (
            <button type="button" className="card-bill-add-btn" onClick={openAddCardModal}>
              <Plus size={13} strokeWidth={2.4} aria-hidden />
              Novo cartao
            </button>
          ) : null}
        </div>

        {hasCards ? (
          <div className="card-bill-grid">
            {cards.map((c) => (
              <BillCard
                key={c.id}
                card={c}
                displayName={normalizeCardName(c.name)}
                value={billInputs?.[c.id] || ''}
                onChange={(v) => handleBillInputChange(c.id, v)}
                onDelete={() => handleDeleteCard(c.id)}
                onEdit={() => openEditCardModal(c)}
                _canDelete={!cardDeleteReasons?.[c.id]}
                deleteReason={cardDeleteReasons?.[c.id]}
              />
            ))}
          </div>
        ) : (
          <EmptyBillsState canAdd={!!onSetCardList} onAddCard={openAddCardModal} />
        )}
      </div>

      <RuleModal
        open={isAddModalOpen}
        title="Adicionar cartao"
        submitLabel="Adicionar"
        onClose={closeAddCardModal}
        onSubmit={(event) => {
          event.preventDefault();
          handleAddCard();
        }}
      >
        <div className="card-bill-add-form">
          <label className="field card-bill-add-field">
            <span>Nome do cartao</span>
            <input
              className="card-bill-add-input"
              type="text"
              placeholder="Ex.: Sicredi"
              value={newCardName}
              onChange={(e) => setNewCardName(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="field card-bill-add-field">
            <span>Fatura deste mes</span>
            <input
              className="card-bill-add-input"
              type="text"
              placeholder="0,00"
              value={newCardBillInput}
              onChange={(e) => setNewCardBillInput(applyMoneyMask(e.target.value))}
              inputMode="decimal"
              autoComplete="off"
            />
          </label>
          <label className="field card-bill-add-field">
            <span>Dia de vencimento</span>
            <input
              className="card-bill-add-input"
              type="number"
              min="1"
              max="31"
              placeholder="Opcional"
              value={newCardDueDay}
              onChange={(e) => setNewCardDueDay(e.target.value)}
              autoComplete="off"
            />
          </label>
          <p className="card-bill-add-hint">
            Fatura e vencimento sao opcionais. Voce pode preencher depois.
          </p>
          {newCardName && detectBankColor(newCardName) ? (
            <div className="color-detection-info">
              <p className="color-detection-label">
                Cor detectada automaticamente para <strong>{newCardName}</strong>
              </p>
              <div
                className="color-preview"
                style={{
                  background: `color-mix(in srgb, ${detectBankColor(newCardName)} 18%, transparent)`,
                  border: `2px solid ${detectBankColor(newCardName)}`,
                }}
                title="Cor do cartao"
              />
            </div>
          ) : null}
        </div>
      </RuleModal>

      <RuleModal
        open={!!editTarget}
        title="Editar cartao"
        submitLabel="Salvar alteracoes"
        onClose={closeEditCardModal}
        onSubmit={(event) => {
          event.preventDefault();
          handleEditCard();
        }}
      >
        <div className="card-bill-add-form">
          <label className="field card-bill-add-field">
            <span>Nome do cartao</span>
            <input
              className="card-bill-add-input"
              type="text"
              placeholder="Ex.: Sicredi"
              value={editCardName}
              onChange={(e) => setEditCardName(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="field card-bill-add-field">
            <span>Dia de vencimento</span>
            <input
              className="card-bill-add-input"
              type="number"
              min="1"
              max="31"
              placeholder="Opcional"
              value={editCardDueDay}
              onChange={(e) => setEditCardDueDay(e.target.value)}
              autoComplete="off"
            />
          </label>
        </div>
      </RuleModal>

      <ConfirmModal
        open={!!deleteTarget}
        title="Apagar cartao"
        message={`Tem certeza que deseja apagar o cartao "${deleteTarget?.name || ''}"?`}
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
