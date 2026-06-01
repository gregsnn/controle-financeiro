import type { CardBillItem } from '../../../domain/types';
import { formatMoneyInput, parseMoneyInput } from '../../../lib/moneyInput';
import { createFormHelpers } from '../shared/createFormHelpers';
import type { InstallmentFormState } from './InstallmentForm';

export type InstallmentItemLike = {
  id: string;
  name: string;
  installmentValue: number;
  totalInstallments: number;
  startMonth: string;
  card: string;
};

type InstallmentPayload = {
  name: string;
  installmentValue: number;
  totalInstallments: number;
  startMonth: string;
  card: string;
};

const installmentFormHelpers = createFormHelpers<
  InstallmentFormState,
  InstallmentItemLike,
  InstallmentPayload,
  [defaultCardId?: string]
>({
  createEmptyForm: (defaultCardId = '') => ({
    name: '',
    installmentValue: '',
    totalInstallments: '',
    startMonth: '',
    card: defaultCardId,
  }),
  createEditForm: (item) => ({
    name: item.name || '',
    installmentValue: formatMoneyInput(item.installmentValue),
    totalInstallments: String(item.totalInstallments || ''),
    startMonth: item.startMonth || '',
    card: item.card || '',
  }),
  buildPayload: (currentForm) => {
    const installmentValue = parseMoneyInput(currentForm.installmentValue);
    if (installmentValue === null) return null;

    return {
      name: currentForm.name,
      installmentValue,
      totalInstallments: Number(currentForm.totalInstallments),
      startMonth: currentForm.startMonth,
      card: currentForm.card,
    };
  },
});

export const createInstallmentEmptyForm = installmentFormHelpers.createEmptyForm;
export const createInstallmentEditForm = installmentFormHelpers.createEditForm;
export const buildInstallmentPayload = installmentFormHelpers.buildPayload;

export function buildInstallmentCardList(cards: CardBillItem[], selectedCard: string) {
  const options = cards.map((card) => ({ value: card.id, label: card.name }));

  if (selectedCard && !options.some((option) => option.value === selectedCard)) {
    options.unshift({ value: selectedCard, label: `${selectedCard} (removido)` });
  }

  return options;
}
