import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { CARD_ICONS } from '../../../ui/constants';
import type { CardBillItem } from '../../../domain/types';
import { applyMoneyMask } from '../../../lib/moneyInput';
import { Input, SelectWithIcon } from '../../inputs';

export type InstallmentFormState = {
  name: string;
  installmentValue: string;
  totalInstallments: string;
  startMonth: string;
  card: string;
};

interface InstallmentFormProps {
  form: InstallmentFormState;
  setForm: Dispatch<SetStateAction<InstallmentFormState>>;
  cards: CardBillItem[];
}

function buildCardOptions(cards: CardBillItem[], selectedCard: string) {
  const options = cards.map((card) => ({ value: card.id, label: card.name }));

  if (selectedCard && !options.some((option) => option.value === selectedCard)) {
    options.unshift({ value: selectedCard, label: `${selectedCard} (removido)` });
  }

  return options;
}

function buildCardIconMap(cards: CardBillItem[]): Record<string, string> {
  const map: Record<string, string> = { ...CARD_ICONS };
  // Adicionar ícones dos cartões dinâmicos, se houver
  cards.forEach((card) => {
    if (card.icon && !map[card.id]) {
      map[card.id] = card.icon;
    }
  });
  return map;
}

export function InstallmentForm({ form, setForm, cards }: InstallmentFormProps) {
  const cardOptions = buildCardOptions(cards, form.card);
  const cardIconMap = buildCardIconMap(cards);

  return (
    <>
      <div className="form-grid tri">
        <Input
          label="Nome"
          value={form.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="HBO, Teclado, Kit PC..."
        />
        <Input
          label="Valor da parcela"
          type="text"
          value={form.installmentValue}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, installmentValue: applyMoneyMask(e.target.value) }))
          }
          inputMode="numeric"
          autoComplete="off"
          placeholder="0,00"
        />
        <Input
          label="Total de parcelas"
          type="number"
          value={form.totalInstallments}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, totalInstallments: e.target.value }))
          }
          placeholder="12"
        />
      </div>
      <div className="form-grid">
        <Input
          label="Mês de início"
          type="month"
          value={form.startMonth}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, startMonth: e.target.value }))
          }
        />
        <label className="field">
          <span>Cartão</span>
          <SelectWithIcon
            value={form.card}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setForm((prev) => ({ ...prev, card: e.target.value }))
            }
            options={cardOptions}
            iconMap={cardIconMap}
            ariaLabel="Cartão"
          />
        </label>
      </div>
    </>
  );
}
