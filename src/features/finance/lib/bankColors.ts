/**
 * Bank and credit card brand colors from Latin America, USA, and Western Europe
 * Maps bank/card names (case-insensitive) to their official brand colors
 */

export const BANK_COLORS: Record<string, string> = {
  // Brazilian Banks
  nubank: '#820AD1',
  'nubank crédito': '#820AD1',
  'nu cartão': '#820AD1',
  santander: '#EC0000',
  'banco santander': '#EC0000',
  bradesco: '#CC092F',
  'banco bradesco': '#CC092F',
  'itau unibanco': '#EC7000',
  itau: '#EC7000',
  'banco itau': '#EC7000',
  caixa: '#005CA9',
  'caixa econômica': '#005CA9',
  'banco do brasil': '#FEDD00',
  'bb cartão': '#FEDD00',
  banrisul: '#005BAA',
  'banco banrisul': '#005BAA',
  sicredi: '#00A859',
  'banco sicredi': '#00A859',
  inter: '#FF7A00',
  'banco inter': '#FF7A00',
  c6: '#000000',
  'c6 bank': '#000000',
  votorantim: '#FF7A00',
  'banco votorantim': '#FF7A00',
  safra: '#003A70',
  'banco safra': '#003A70',
  hsbc: '#DF0601',
  'hsbc bank': '#DF0601',
  'banco hsbc': '#DF0601',

  // Colombian Banks
  bancolombia: '#FFC836',
  'banco de bogotá': '#003087',
  davivienda: '#005EB8',
  bbva: '#004687',

  // Mexican Banks
  banamex: '#CE1126',
  citibanamex: '#CE1126',
  scotiabank: '#1B1B1B',
  'scotiabank perú': '#1B1B1B',
  'banco azteca': '#ED1C24',
  'santander méxico': '#ED1C24',

  // Argentine Banks
  bna: '#00A3E0',
  'banco nación': '#00A3E0',
  icbc: '#EC1C24',
  'banco icbc': '#EC1C24',
  galicia: '#E6007E',
  'banco galicia': '#E6007E',

  // Peruvian Banks
  bcp: '#006BB6',
  'banco de crédito': '#006BB6',
  'banco interbank': '#003087',

  // Chilean Banks
  bci: '#003DA5',
  'banco de crédito e inversiones': '#003DA5',
  'banco del estado': '#003B99',
  'banco santander chile': '#ED1C24',

  // US Banks
  'bank of america': '#002868',
  bofa: '#002868',
  chase: '#117DBA',
  jpmorgan: '#117DBA',
  'wells fargo': '#BF0A30',
  citibank: '#003087',
  citi: '#003087',
  'us bank': '#003DA5',
  'capitol one': '#FF5F00',
  'capital one': '#FF5F00',
  amex: '#006FCF',
  'american express': '#006FCF',
  discover: '#FF6000',
  mastercard: '#FF5F00',
  visa: '#1434CB',

  // UK Banks
  barclays: '#00A9CE',
  lloyds: '#00AC41',
  natwest: '#7CB342',
  'santander uk': '#ED1C24',
  'virgin money': '#E60000',
  nationwide: '#00A9CE',

  // German Banks
  'deutsche bank': '#0066B2',
  commerzbank: '#005EB8',
  ubs: '#EB001B',
  allianz: '#00A9CE',
  sparkasse: '#005EB8',
  postbank: '#FFD500',

  // French Banks
  'bnp paribas': '#004B87',
  'société générale': '#1F4788',
  'crédit agricole': '#00A64D',
  'crédit mutuel': '#00A64D',
  natixis: '#004B87',

  // Spanish Banks
  caixabank: '#1D4FA8',
  'banco sabadell': '#003DA5',
  bankia: '#003087',

  // Italian Banks
  unicredit: '#E60000',
  'intesa sanpaolo': '#0066B2',
  mediolanum: '#1434CB',

  // Portuguese Banks
  cgd: '#007AAA',
  'caixa geral de depósitos': '#007AAA',
  'millennium bcp': '#00A64D',
  'novo banco': '#FF6B35',

  // Netherlands Banks
  ing: '#FF6200',
  'ing bank': '#FF6200',
  rabobank: '#FFB812',
  'abn amro': '#003087',

  // Belgian Banks
  'bnp paribas belgium': '#004B87',
  belfius: '#1F4788',

  // Austrian Banks
  'erste bank': '#ED1C24',
  raiffeisen: '#006BB6',

  // Greek Banks
  'alpha bank': '#003087',
  eurobank: '#1434CB',
  'national bank of greece': '#003087',

  // Polish Banks
  pkobp: '#00A64D',
  mbank: '#FF6B35',
  'santander bank polska': '#ED1C24',

  // Czech Banks
  csob: '#1F4788',
  kb: '#FFB812',

  // Hungarian Banks
  otp: '#008C45',

  // Romanian Banks
  bcr: '#004687',
  brd: '#1434CB',

  // Turkish Banks
  akbank: '#00A9CE',
  garanti: '#006BB6',
  'is bank': '#E60000',

  // Generic
  'credit card': '#1434CB',
  elo: '#621E15',
  dinersclub: '#0066B2',
};

/**
 * Detects bank color based on card name
 * @param cardName The name of the card (e.g., "Nubank", "Santander")
 * @returns The hex color code if found, otherwise undefined
 */
export function detectBankColor(cardName: string): string | undefined {
  if (!cardName) return undefined;

  const normalizedName = cardName.trim().toLowerCase();

  // Direct match
  if (BANK_COLORS[normalizedName]) {
    return BANK_COLORS[normalizedName];
  }

  // Partial match (check if the card name contains a known bank name)
  for (const [bankName, color] of Object.entries(BANK_COLORS)) {
    if (normalizedName.includes(bankName) || bankName.includes(normalizedName.split(' ')[0])) {
      return color;
    }
  }

  return undefined;
}

/**
 * Enriches a card with bank color if it doesn't already have one
 * @param card The card to enrich
 * @returns The card with color applied (if available)
 */
export function enrichCardWithColor<T extends { name: string; color?: string }>(card: T): T {
  if (card.color) {
    return card; // Already has a color
  }

  const detectedColor = detectBankColor(card.name);
  if (detectedColor) {
    return {
      ...card,
      color: detectedColor,
    };
  }

  return card;
}

/**
 * Enriches multiple cards with bank colors if they don't already have one
 * @param cards The cards to enrich
 * @returns The cards with colors applied (if available)
 */
export function enrichCardsWithColors<T extends { name: string; color?: string }>(cards: T[]): T[] {
  return cards.map(enrichCardWithColor);
}
