import { parseCaptureInput } from '../parser';
import type { CaptureContext, CaptureDraft } from '../types';
import type { ParsedReceipt, ReceiptCaptureSource, ReceiptOcrResult } from './types';

const TOTAL_PATTERNS = [/total\s+a\s+pagar/i, /valor\s+total/i, /\btotal\b/i];
const DANFE_TOTAL_PATTERNS = [/valor\s+total\s+da\s+nota/i, /total\s+da\s+nota/i];

function normalizeReceiptAmount(value: string) {
  if (value.includes(',')) return value.replace(/\./g, '').replace(',', '.');
  return value;
}

function parseReceiptAmounts(raw: string): number[] {
  const matches = Array.from(raw.matchAll(/(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+[,.]\d{2})/gi));

  return matches
    .map((match) => Number(normalizeReceiptAmount(match[1])))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function parseReceiptAmount(raw: string): number | null {
  return parseReceiptAmounts(raw)[0] || null;
}

function parseLastReceiptAmount(raw: string): number | null {
  const amounts = parseReceiptAmounts(raw);
  return amounts.length ? amounts[amounts.length - 1] : null;
}

function parseFirstReceiptAmountAfter(text: string, pattern: RegExp, windowSize = 90) {
  const match = pattern.exec(text);
  if (!match || match.index === undefined) return null;

  const snippet = text.slice(
    match.index + match[0].length,
    match.index + match[0].length + windowSize
  );
  return parseReceiptAmount(snippet);
}

function parseReceiptDateAfter(text: string, pattern: RegExp, windowSize = 90) {
  const match = pattern.exec(text);
  if (!match || match.index === undefined) return null;

  const snippet = text.slice(
    match.index + match[0].length,
    match.index + match[0].length + windowSize
  );
  return snippet.match(/\b(\d{2})[/-](\d{2})[/-](\d{2,4})\b/);
}

function dayFromReceiptDate(date: string | null) {
  if (!date) return null;
  const match = date.match(/^(\d{2})\//);
  return match ? Number(match[1]) : null;
}

function isoDateFromReceiptDate(date: string | null) {
  if (!date) return null;
  const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

function extractReceiptTotal(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const pattern of TOTAL_PATTERNS) {
    const line = lines.find((item) => pattern.test(item));
    const amount = line ? parseReceiptAmount(line) : null;
    if (amount) return amount;
  }

  const amounts = lines
    .map(parseReceiptAmount)
    .filter((amount): amount is number => amount !== null);
  return amounts.length ? Math.max(...amounts) : null;
}

function isDanfe(text: string) {
  return /\bdanfe\b|\bnf-e\b|chave\s+de\s+acesso|documento\s+auxiliar\s+da\s+nota\s+fiscal/i.test(
    text
  );
}

function isNfeXml(source: ReceiptCaptureSource) {
  const fileName = source.fileName.toLowerCase();
  if (!fileName.endsWith('.xml') && !/xml/i.test(source.mimeType)) return false;
  return /<\?xml|<nfeProc\b|<NFe\b|<infNFe\b|<CFe\b|<det\b|<ICMSTot\b/i.test(source.text);
}

function decodeXmlValue(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .trim();
}

function extractXmlTag(text: string, tagName: string, fromIndex = 0) {
  const match = text
    .slice(fromIndex)
    .match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? decodeXmlValue(match[1]) : null;
}

function extractXmlSection(text: string, tagName: string) {
  const match = text.match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? match[1] : null;
}

function extractNfeXmlMerchant(text: string) {
  const emit = extractXmlSection(text, 'emit');
  return (emit ? extractXmlTag(emit, 'xNome') : null) || extractReceiptMerchant(text);
}

function extractNfeXmlTotal(text: string) {
  const icmsTotal = extractXmlSection(text, 'ICMSTot');
  const value = (icmsTotal ? extractXmlTag(icmsTotal, 'vNF') : null) || extractXmlTag(text, 'vNF');
  return value ? parseReceiptAmount(value) : null;
}

function extractNfeXmlDate(text: string) {
  const value = extractXmlTag(text, 'dhEmi') || extractXmlTag(text, 'dEmi');
  if (!value) return null;

  const date =
    value.match(/\b(\d{4})-(\d{2})-(\d{2})/) || value.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  if (!date) return null;

  if (date[1].length === 4) {
    const [, year, month, day] = date;
    return `${day}/${month}/${year}`;
  }

  const [, day, month, year] = date;
  return `${day}/${month}/${year}`;
}

function extractNfeXmlAccessKey(text: string) {
  const explicit = extractXmlTag(text, 'chNFe');
  if (explicit) return explicit.replace(/[^\d]/g, '').match(/\d{44}/)?.[0] || null;

  const fromId = text.match(/\bId=["']NFe(\d{44})["']/i);
  return fromId?.[1] || null;
}

function extractNfeXmlProductDescription(text: string) {
  const det = extractXmlSection(text, 'det');
  return (det ? extractXmlTag(det, 'xProd') : null) || extractXmlTag(text, 'xProd');
}

function extractDanfeAccessKey(text: string) {
  const lines = text.split(/\r?\n/);
  const keyHeaderIndex = lines.findIndex((line) => /chave\s+de\s+acesso/i.test(line));
  const candidates = keyHeaderIndex >= 0 ? lines.slice(keyHeaderIndex, keyHeaderIndex + 4) : lines;

  for (const line of candidates) {
    const digits = line.replace(/[^\d]/g, '');
    const match = digits.match(/\d{44}/);
    if (match) return match[0];
  }

  return null;
}

function extractDanfeTotal(text: string) {
  const compactText = text.replace(/\s+/g, ' ');
  for (const pattern of DANFE_TOTAL_PATTERNS) {
    const amount = parseFirstReceiptAmountAfter(compactText, new RegExp(pattern.source, 'i'));
    if (amount) return amount;
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const pattern of DANFE_TOTAL_PATTERNS) {
    const lineIndex = lines.findIndex((item) => pattern.test(item));
    const line = lineIndex >= 0 ? lines[lineIndex] : null;
    const amount = line ? parseLastReceiptAmount(line) : null;
    if (amount) return amount;

    if (lineIndex >= 0) {
      const nearby = lines.slice(lineIndex + 1, lineIndex + 4).map(parseLastReceiptAmount);
      const nextAmount = nearby.find((item): item is number => item !== null);
      if (nextAmount) return nextAmount;
    }
  }

  return extractReceiptTotal(text);
}

function extractDanfeMerchant(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const ignored = /recebemos|danfe|documento auxiliar|nota fiscal|chave de acesso|consulta/i;
  const receivedFrom = lines
    .join(' ')
    .match(/recebemos\s+de\s+(.+?)(?:\s+os\s+produtos|\s+constantes|\s+indicada|$)/i);
  if (receivedFrom?.[1]) return receivedFrom[1].trim();

  const merchant = lines.find((line) => {
    if (ignored.test(line)) return false;
    if (parseReceiptAmount(line)) return false;
    return /\bltda\b|\bs\/a\b|\bcomercial\b|\bmercado\b|\bshop\b/i.test(line);
  });

  return merchant || extractReceiptMerchant(text);
}

function extractDanfeIssueDate(text: string) {
  const compactText = text.replace(/\s+/g, ' ');
  const targetedIssueDate = parseReceiptDateAfter(compactText, /data\s+da\s+emiss[aã]o/i);
  if (targetedIssueDate) {
    const [, day, month, year] = targetedIssueDate;
    return `${day}/${month}/${year.length === 2 ? `20${year}` : year}`;
  }

  const issueLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /data\s+da\s+emiss/i.test(line));
  const fromIssueLine = issueLine?.match(/\b(\d{2})[/-](\d{2})[/-](\d{2,4})\b/);
  const match = fromIssueLine || text.match(/\b(\d{2})[/-](\d{2})[/-](\d{2,4})\b/);
  if (!match) return null;

  const [, day, month, year] = match;
  return `${day}/${month}/${year.length === 2 ? `20${year}` : year}`;
}

function cleanDanfeProductLine(line: string) {
  const withoutCode = line
    .replace(/^[A-Z]{2,}\d+\s+/i, '')
    .replace(/^\d+\s+/, '')
    .trim();
  const ncmIndex = withoutCode.search(/\s\d{8}\s+\d{2,3}\s+\d{4}\s/i);
  const product = (ncmIndex >= 0 ? withoutCode.slice(0, ncmIndex) : withoutCode)
    .replace(/\s+\d{1,3},\d{2}(?:\s+\d{1,3},\d{2})?.*$/, '')
    .trim();

  return product.replace(/\s{2,}/g, ' ') || null;
}

function extractDanfeProductDescription(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const headerIndex = lines.findIndex((line) =>
    /dados\s+do\s+produto|descricao\s+dos\s+produto/i.test(line)
  );
  const candidates = (headerIndex >= 0 ? lines.slice(headerIndex + 1) : lines).filter((line) => {
    if (!/[a-zA-Z]/.test(line)) return false;
    if (/codigo|descri[cç][aã]o|ncm\/sh|valor\s+total|valor\s+unit|icms|ipi/i.test(line)) {
      return false;
    }
    if (/danfe|nf-e|chave|protocolo|transportador|destinatario|calculo/i.test(line)) return false;
    return /[a-zA-Z]{4,}/.test(line) && line.length >= 10;
  });

  for (const candidate of candidates) {
    const product = cleanDanfeProductLine(candidate);
    if (product && product.length >= 4) return product;
  }

  return null;
}

function extractReceiptMerchant(text: string) {
  const line = text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item && !parseReceiptAmount(item) && !/cnpj|cpf|cupom|extrato/i.test(item));

  return line || null;
}

function extractReceiptDate(text: string) {
  const match = text.match(/\b(\d{2})[/-](\d{2})[/-](\d{2,4})\b/);
  if (!match) return null;

  const [, day, month, year] = match;
  return `${day}/${month}/${year.length === 2 ? `20${year}` : year}`;
}

function draftFromReceipt(source: ReceiptCaptureSource, context: CaptureContext): CaptureDraft[] {
  const danfe = isDanfe(source.text);
  const nfeXml = isNfeXml(source);
  const merchant = nfeXml
    ? extractNfeXmlMerchant(source.text)
    : danfe
      ? extractDanfeMerchant(source.text)
      : extractReceiptMerchant(source.text);
  const total = nfeXml
    ? extractNfeXmlTotal(source.text)
    : danfe
      ? extractDanfeTotal(source.text)
      : extractReceiptTotal(source.text);
  const productDescription = nfeXml
    ? extractNfeXmlProductDescription(source.text)
    : danfe
      ? extractDanfeProductDescription(source.text)
      : null;
  if (!total) return [];

  const description = productDescription || merchant || source.fileName;
  const input = `${description} ${total.toFixed(2).replace('.', ',')}`;
  const draft = parseCaptureInput(input, context).draft;
  const receiptDate = nfeXml
    ? extractNfeXmlDate(source.text)
    : danfe
      ? extractDanfeIssueDate(source.text)
      : extractReceiptDate(source.text);
  const day = dayFromReceiptDate(receiptDate);
  const isoDate = isoDateFromReceiptDate(receiptDate);
  const accessKey = nfeXml
    ? extractNfeXmlAccessKey(source.text)
    : danfe
      ? extractDanfeAccessKey(source.text)
      : null;
  const notes = [
    nfeXml ? 'Origem: XML NF-e/NFC-e.' : danfe ? 'Origem: NF-e/DANFE.' : '',
    merchant ? `Emitente: ${merchant}.` : '',
    accessKey ? `Chave NF-e: ${accessKey}.` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return [
    {
      ...draft,
      fields: {
        ...draft.fields,
        description,
        amount: total,
        ...(day ? { day } : {}),
        ...(isoDate ? { date: isoDate } : {}),
        notes,
      },
      confidence: 'medium',
      warnings: [
        ...draft.warnings,
        nfeXml
          ? 'Captura de XML NF-e/NFC-e exige revisao antes de salvar.'
          : danfe
            ? 'Captura de NF-e/DANFE exige revisao antes de salvar.'
            : 'Captura por OCR exige revisao antes de salvar.',
        source.confidence !== null ? `Confianca OCR: ${Math.round(source.confidence)}%.` : '',
      ].filter(Boolean),
    },
  ];
}

export function parseReceiptCaptureSource(
  source: ReceiptCaptureSource,
  context: CaptureContext
): ParsedReceipt {
  const danfe = isDanfe(source.text);
  const nfeXml = isNfeXml(source);
  const total = nfeXml
    ? extractNfeXmlTotal(source.text)
    : danfe
      ? extractDanfeTotal(source.text)
      : extractReceiptTotal(source.text);
  const merchant = nfeXml
    ? extractNfeXmlMerchant(source.text)
    : danfe
      ? extractDanfeMerchant(source.text)
      : extractReceiptMerchant(source.text);
  const date = nfeXml
    ? extractNfeXmlDate(source.text)
    : danfe
      ? extractDanfeIssueDate(source.text)
      : extractReceiptDate(source.text);
  const accessKey = nfeXml
    ? extractNfeXmlAccessKey(source.text)
    : danfe
      ? extractDanfeAccessKey(source.text)
      : null;
  const productDescription = nfeXml
    ? extractNfeXmlProductDescription(source.text)
    : danfe
      ? extractDanfeProductDescription(source.text)
      : null;
  const drafts = draftFromReceipt(source, context);

  return {
    merchant,
    total,
    date,
    documentType: nfeXml
      ? 'nfeXml'
      : danfe
        ? 'danfe'
        : source.mimeType === 'application/pdf'
          ? 'pdf'
          : 'receipt',
    accessKey,
    productDescription,
    drafts,
    warnings: drafts.length ? [] : ['Nao foi possivel encontrar o total do documento.'],
  };
}

export async function extractTextFromReceiptImage(file: File): Promise<ReceiptOcrResult> {
  const { default: Tesseract } = await import('tesseract.js');
  const result = await Tesseract.recognize(file, 'por+eng');

  return {
    text: result.data.text,
    confidence: typeof result.data.confidence === 'number' ? result.data.confidence : null,
  };
}

export async function extractTextFromReceiptPdf(file: File): Promise<ReceiptOcrResult> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .filter(Boolean)
      .join(' ');
    pages.push(text);
  }

  return {
    text: pages.join('\n'),
    confidence: null,
  };
}

export async function readReceiptFile(file: File): Promise<ReceiptCaptureSource> {
  const fileName = file.name.toLowerCase();
  if (
    file.type.startsWith('text/') ||
    /xml/i.test(file.type) ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.xml')
  ) {
    return {
      fileName: file.name,
      mimeType: file.type || (fileName.endsWith('.xml') ? 'application/xml' : 'text/plain'),
      text: await file.text(),
      confidence: null,
    };
  }

  if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) {
    const pdf = await extractTextFromReceiptPdf(file);
    if (!pdf.text.trim()) {
      throw new Error(
        'PDF sem texto extraivel. Envie o XML da NF-e ou uma imagem nitida do DANFE.'
      );
    }

    return {
      fileName: file.name,
      mimeType: 'application/pdf',
      text: pdf.text,
      confidence: null,
    };
  }

  const ocr = await extractTextFromReceiptImage(file);
  return {
    fileName: file.name,
    mimeType: file.type,
    text: ocr.text,
    confidence: ocr.confidence,
  };
}
