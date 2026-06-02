import { describe, expect, it } from 'vitest';
import { parseReceiptCaptureSource } from '../capture/ocr/receiptParser';
import { captureTestContext } from './captureFixtures';

describe('receipt parser', () => {
  it('creates a review-only draft from OCR text with total', () => {
    const parsed = parseReceiptCaptureSource(
      {
        fileName: 'cupom.txt',
        mimeType: 'text/plain',
        confidence: 82,
        text: ['Mercado Central', 'CNPJ 00.000.000/0001-00', 'TOTAL R$ 123,45'].join('\n'),
      },
      captureTestContext
    );

    expect(parsed.merchant).toBe('Mercado Central');
    expect(parsed.total).toBe(123.45);
    expect(parsed.drafts).toHaveLength(1);
    expect(parsed.drafts[0]).toEqual(
      expect.objectContaining({
        intent: 'variableExpense',
        confidence: 'medium',
      })
    );
    expect(parsed.drafts[0].warnings.join(' ')).toContain('OCR exige revisão');
  });

  it('returns a safe warning when OCR text has no total', () => {
    const parsed = parseReceiptCaptureSource(
      {
        fileName: 'cupom.txt',
        mimeType: 'text/plain',
        confidence: null,
        text: 'texto sem valores',
      },
      captureTestContext
    );

    expect(parsed.drafts).toHaveLength(0);
    expect(parsed.warnings).toContain('Não foi possível encontrar o total do documento.');
  });

  it('extracts DANFE/NF-e fields and uses product as expense description', () => {
    const parsed = parseReceiptCaptureSource(
      {
        fileName: 'danfe.txt',
        mimeType: 'text/plain',
        confidence: 77,
        text: [
          'SHOP BORGES COMERCIAL LTDA',
          'DANFE Documento Auxiliar da Nota Fiscal Eletronica',
          'NF-e Nº 001.006.771 SERIE 002',
          'CHAVE DE ACESSO',
          '3526 0533 9512 8200 0161 5500 2001 0067 7113 7096 7009',
          'DATA DA EMISSAO 29/05/2026',
          'VALOR TOTAL DOS PRODUTOS 193,90',
          'VALOR TOTAL DA NOTA 193,90',
          'DADOS DO PRODUTO / SERVICOS',
          'CODIGO DESCRICAO DOS PRODUTOS / SERVICOS NCM/SH CST CFOP UNID QTD VLR UNIT VALOR TOTAL',
          'MLB4290216645 Mouse pad Poron SPEED 49x42x4mm - Rigel 40161090 200 6106 UNID 1 193,90 193,90',
        ].join('\n'),
      },
      captureTestContext
    );

    expect(parsed.documentType).toBe('danfe');
    expect(parsed.merchant).toBe('SHOP BORGES COMERCIAL LTDA');
    expect(parsed.total).toBe(193.9);
    expect(parsed.date).toBe('29/05/2026');
    expect(parsed.accessKey).toBe('35260533951282000161550020010067711370967009');
    expect(parsed.productDescription).toBe('Mouse pad Poron SPEED 49x42x4mm - Rigel');
    expect(parsed.drafts[0]).toEqual(
      expect.objectContaining({
        intent: 'variableExpense',
        confidence: 'medium',
      })
    );
    expect(parsed.drafts[0].fields.description).toBe('Mouse pad Poron SPEED 49x42x4mm - Rigel');
    expect(parsed.drafts[0].fields.amount).toBe(193.9);
    expect(parsed.drafts[0].fields.day).toBe(29);
    expect(parsed.drafts[0].fields.date).toBe('2026-05-29');
    expect(parsed.drafts[0].fields.notes).toContain('Origem: NF-e/DANFE.');
    expect(parsed.drafts[0].fields.notes).toContain('SHOP BORGES COMERCIAL LTDA');
    expect(parsed.drafts[0].fields.notes).toContain('35260533951282000161550020010067711370967009');
  });

  it('extracts structured NF-e XML without OCR heuristics', () => {
    const parsed = parseReceiptCaptureSource(
      {
        fileName: 'nfe.xml',
        mimeType: 'application/xml',
        confidence: null,
        text: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<nfeProc>',
          '<NFe>',
          '<infNFe Id="NFe35260533951282000161550020010067711370967009">',
          '<emit><xNome>SHOP BORGES COMERCIAL LTDA</xNome></emit>',
          '<ide><dhEmi>2026-05-29T10:32:25-03:00</dhEmi></ide>',
          '<det nItem="1"><prod><xProd>Mouse pad Poron SPEED 49x42x4mm - Rigel</xProd></prod></det>',
          '<total><ICMSTot><vProd>193.90</vProd><vNF>193.90</vNF></ICMSTot></total>',
          '</infNFe>',
          '</NFe>',
          '<protNFe><infProt><chNFe>35260533951282000161550020010067711370967009</chNFe></infProt></protNFe>',
          '</nfeProc>',
        ].join(''),
      },
      captureTestContext
    );

    expect(parsed.documentType).toBe('nfeXml');
    expect(parsed.merchant).toBe('SHOP BORGES COMERCIAL LTDA');
    expect(parsed.total).toBe(193.9);
    expect(parsed.date).toBe('29/05/2026');
    expect(parsed.accessKey).toBe('35260533951282000161550020010067711370967009');
    expect(parsed.productDescription).toBe('Mouse pad Poron SPEED 49x42x4mm - Rigel');
    expect(parsed.drafts[0].fields.description).toBe('Mouse pad Poron SPEED 49x42x4mm - Rigel');
    expect(parsed.drafts[0].fields.amount).toBe(193.9);
    expect(parsed.drafts[0].fields.day).toBe(29);
    expect(parsed.drafts[0].fields.notes).toContain('Origem: XML NF-e/NFC-e.');
  });

  it('prefers total da nota and generic product lines in DANFE text', () => {
    const parsed = parseReceiptCaptureSource(
      {
        fileName: 'danfe-ocr.txt',
        mimeType: 'text/plain',
        confidence: 58,
        text: [
          'RECEBEMOS DE SHOP BORGES COMERCIAL LTDA OS PRODUTOS CONSTANTES DA NOTA FISCAL',
          'DANFE',
          'VALOR TOTAL DOS PRODUTOS',
          '120,00',
          'VALOR TOTAL DA NOTA',
          '193,90',
          'DADOS DO PRODUTO / SERVICOS',
          'ABC123 Produto especial importado tamanho unico 40161090 200 6106 UNID 1 193,90 193,90',
        ].join('\n'),
      },
      captureTestContext
    );

    expect(parsed.merchant).toBe('SHOP BORGES COMERCIAL LTDA');
    expect(parsed.total).toBe(193.9);
    expect(parsed.productDescription).toBe('Produto especial importado tamanho unico');
    expect(parsed.drafts[0].fields.description).toBe('Produto especial importado tamanho unico');
  });

  it('extracts DANFE total and issue date from compact PDF text', () => {
    const parsed = parseReceiptCaptureSource(
      {
        fileName: 'danfe.pdf',
        mimeType: 'application/pdf',
        confidence: null,
        text: [
          'RECEBEMOS DE SHOP BORGES COMERCIAL LTDA OS PRODUTOS CONSTANTES DA NOTA FISCAL',
          'DANFE NF-e No 001.006.771 SERIE 002 CHAVE DE ACESSO 35260533951282000161550020010067711370967009',
          'DATA DA EMISSAO 29/05/2026 DATA DA ENTRADA / SAIDA 29/05/2026',
          'VALOR TOTAL DOS PRODUTOS 193,90 VALOR TOTAL DA NOTA 193,90',
          'DADOS DO PRODUTO / SERVICOS MLB4290216645 Mouse pad Poron SPEED 49x42x4mm - Rigel 40161090 200 6106 UNID 1 193,90 193,90',
        ].join(' '),
      },
      captureTestContext
    );

    expect(parsed.total).toBe(193.9);
    expect(parsed.date).toBe('29/05/2026');
    expect(parsed.drafts[0].fields.amount).toBe(193.9);
    expect(parsed.drafts[0].fields.day).toBe(29);
    expect(parsed.drafts[0].fields.date).toBe('2026-05-29');
  });
});
