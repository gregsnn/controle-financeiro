import type { CardBillItem } from '../domain/types';

export type CaptureIntent =
  | 'variableExpense'
  | 'fixedExpense'
  | 'installment'
  | 'revenue'
  | 'cardBill'
  | 'markAsPaid'
  | 'unknown';

export type CaptureConfidence = 'high' | 'medium' | 'low';

export type CaptureFieldValue = string | number | boolean | null | undefined;

export type CaptureFields = Record<string, CaptureFieldValue>;

export interface CaptureContext {
  currentMonthKey: string;
  cards: CardBillItem[];
  categories: Record<string, string>;
  paymentMethods: string[];
  paymentTargets?: CapturePaymentTarget[];
}

export interface CapturePaymentTarget {
  id: string;
  label: string;
  type: 'fixedExpense' | 'installment' | 'cardBill' | 'revenue';
}

export interface CaptureDraft {
  id: string;
  rawText: string;
  intent: CaptureIntent;
  confidence: CaptureConfidence;
  warnings: string[];
  fields: CaptureFields;
  missingFields: string[];
  alternatives: CaptureIntent[];
}

export interface CaptureResult {
  draft: CaptureDraft;
  executable: boolean;
  destinationLabel: string;
}

export interface CapturePreviewField {
  key: string;
  label: string;
  value: CaptureFieldValue;
  required?: boolean;
}

export interface CapturePreview {
  intent: CaptureIntent;
  title: string;
  summary: string;
  fields: CapturePreviewField[];
  canExecute: boolean;
  warnings: string[];
}

export interface CaptureExample {
  input: string;
  expectedIntent: CaptureIntent;
  description: string;
  requiresReview?: boolean;
}
