import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import type { CardBillItem } from '../../../domain/types';
import { useI18n } from '../../../lib/i18n';
import { applyMoneyMask } from '../../../lib/moneyInput';
import { CATEGORIES } from '../../../ui/constants';
import { Input } from '../../inputs';

export type FixedExpenseFormState = {
  name: string;
  amount: string;
  dueDay: string;
  startMonth: string;
  paymentMethod: string;
  card: string;
  category: string;
};

interface FixedExpenseFormProps {
  form: FixedExpenseFormState;
  setForm: Dispatch<SetStateAction<FixedExpenseFormState>>;
  cards: CardBillItem[];
}

function buildPaymentOptions(
  cards: CardBillItem[],
  selectedPaymentMethod: string,
  normalizeCardName: (name: string) => string
) {
  const options = [
    { value: 'boleto', label: 'Boleto' },
    { value: 'pix', label: 'Pix' },
    ...cards.map((card) => ({ value: card.id, label: normalizeCardName(card.name) })),
  ];

  if (selectedPaymentMethod && !options.some((option) => option.value === selectedPaymentMethod)) {
    options.unshift({
      value: selectedPaymentMethod,
      label: `${selectedPaymentMethod} (removido)`,
    });
  }

  return options;
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
export function FixedExpenseForm({ form, setForm, cards }: FixedExpenseFormProps) {
  const { normalizeCardName } = useI18n();
  const paymentOptions = buildPaymentOptions(cards, form.paymentMethod, normalizeCardName);
  const cardOptions = buildCardOptions(cards, form.card, normalizeCardName);

  return (
    <>
      <div className="form-grid">
        <Input
          label="Nome"
          value={form.name}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="Internet, luz, aluguel..."
        />
        <Input
          label="Valor"
          type="text"
          value={form.amount}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, amount: applyMoneyMask(e.target.value) }))
          }
          inputMode="numeric"
          autoComplete="off"
          placeholder="0,00"
        />
      </div>
      <div className="form-grid">
        <Input
          label="Dia de vencimento"
          type="number"
          value={form.dueDay}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, dueDay: e.target.value }))
          }
          placeholder="10"
        />
        <Input
          label="Mês de início"
          type="month"
          value={form.startMonth}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setForm((prev) => ({ ...prev, startMonth: e.target.value }))
          }
          placeholder=""
        />
      </div>
      <div className="form-grid">
        <label className="field">
          <span>Forma de pagamento</span>
          <select
            value={form.paymentMethod}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setForm((prev) => ({ ...prev, paymentMethod: e.target.value }))
            }
            aria-label="Forma de pagamento"
          >
            {paymentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {form.paymentMethod === 'cartao' ? (
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
        ) : null}
        <label className="field">
          <span>Categoria</span>
          <select
            value={form.category}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setForm((prev) => ({ ...prev, category: e.target.value }))
            }
          >
            {Object.entries(CATEGORIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}
