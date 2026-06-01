import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import type { CardBillItem } from '../../../domain/types';
import { useI18n } from '../../../lib/i18n';
import { applyMoneyMask } from '../../../lib/moneyInput';
import { Input } from '../../inputs';

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

function buildCardOptions(
  cards: CardBillItem[],
  selectedCard: string,
  normalizeCardName: (name: string) => string
) {
  const options = cards.map((card) => ({ value: card.id, label: normalizeCardName(card.name) }));

  if (selectedCard && !options.some((option) => option.value === selectedCard)) {
    options.unshift({ value: selectedCard, label: `${selectedCard} (removido)` });
  }

  return options;
}

export function InstallmentForm({ form, setForm, cards }: InstallmentFormProps) {
  const { normalizeCardName } = useI18n();
  const cardOptions = buildCardOptions(cards, form.card, normalizeCardName);

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
          <select
            value={form.card}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setForm((prev) => ({ ...prev, card: e.target.value }))
            }
            aria-label="Cartão"
          >
            {cardOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}
