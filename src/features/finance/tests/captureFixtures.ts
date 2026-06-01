import { ALLOWED_PAYMENT_METHODS } from '../domain/constants';
import type { CaptureContext } from '../capture/types';
import { CATEGORIES } from '../ui/constants';

export const captureTestContext: CaptureContext = {
  currentMonthKey: '2026-05',
  cards: [
    { id: 'nubank', name: 'Nubank', dueDay: 12 },
    { id: 'itau', name: 'Itau', dueDay: 10 },
    { id: 'sicredi', name: 'Sicredi', dueDay: 5 },
  ],
  categories: CATEGORIES,
  paymentMethods: [...ALLOWED_PAYMENT_METHODS],
};
