import { normalizeCaptureText } from './tokenizer';
import type { CaptureContext } from './types';

export function matchPaymentTarget(input: string, context: CaptureContext) {
  const targets = context.paymentTargets || [];
  const normalizedInput = normalizeCaptureText(input);

  return targets.find((target) => {
    const normalizedLabel = normalizeCaptureText(target.label);
    return normalizedLabel && normalizedInput.includes(normalizedLabel);
  });
}
