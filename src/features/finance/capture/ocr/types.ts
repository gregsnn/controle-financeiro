import type { CaptureDraft } from '../types';

export interface ReceiptOcrResult {
  text: string;
  confidence: number | null;
}

export interface ReceiptCaptureSource {
  fileName: string;
  mimeType: string;
  text: string;
  confidence: number | null;
}

export interface ParsedReceipt {
  merchant: string | null;
  total: number | null;
  date: string | null;
  documentType: 'receipt' | 'danfe' | 'nfeXml' | 'pdf';
  accessKey: string | null;
  productDescription: string | null;
  drafts: CaptureDraft[];
  warnings: string[];
}
