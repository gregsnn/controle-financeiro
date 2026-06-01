import type { CaptureConfidence, CaptureFields } from './types';

export function inferBaseConfidence(fields: CaptureFields): CaptureConfidence {
  if (
    fields.amount &&
    (fields.category || fields.paymentMethod || fields.card || fields.recurring)
  ) {
    return 'medium';
  }

  if (fields.amount) {
    return 'low';
  }

  return 'low';
}
