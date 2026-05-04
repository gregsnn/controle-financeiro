import type { CardBillItem } from '../../../domain/types';
import { formatMoneyInput, parseMoneyInput } from '../../../lib/moneyInput';
import type { InstallmentFormState } from './InstallmentForm';

export type InstallmentItemLike = {
  id: string;
  name: string;
  installmentValue: number;
  totalInstallments: number;
  startMonth: string;
  card: string;
};

export function createInstallmentEmptyForm(defaultCardId = ''): InstallmentFormState {
  return {
    name: '',
    installmentValue: '',
    totalInstallments: '',
    startMonth: '',
    card: defaultCardId,
  };
}

export function createInstallmentEditForm(item: InstallmentItemLike): InstallmentFormState {
  return {
    name: item.name || '',
    installmentValue: formatMoneyInput(item.installmentValue),
    totalInstallments: String(item.totalInstallments || ''),
    startMonth: item.startMonth || '',
    card: item.card || '',
  };
}

export function buildInstallmentPayload(currentForm: InstallmentFormState): {
  name: string;
  installmentValue: number;
  totalInstallments: number;
  startMonth: string;
  card: string;
} | null {
  const installmentValue = parseMoneyInput(currentForm.installmentValue);
  if (installmentValue === null) return null;

  return {
    name: currentForm.name,
    installmentValue,
    totalInstallments: Number(currentForm.totalInstallments),
    startMonth: currentForm.startMonth,
    card: currentForm.card,
  };
}

export function buildInstallmentCardList(cards: CardBillItem[], selectedCard: string) {
  const options = cards.map((card) => ({ value: card.id, label: card.name }));

  if (selectedCard && !options.some((option) => option.value === selectedCard)) {
    options.unshift({ value: selectedCard, label: `${selectedCard} (removido)` });
  }

  return options;
}
