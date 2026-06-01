import { tokenizeCaptureText } from './tokenizer';

export interface ParsedCaptureDate {
  day?: number;
  date?: string;
}

const MONTH_BY_NAME: Record<string, string> = {
  janeiro: '01',
  jan: '01',
  fevereiro: '02',
  fev: '02',
  marco: '03',
  mar: '03',
  abril: '04',
  abr: '04',
  maio: '05',
  mai: '05',
  junho: '06',
  jun: '06',
  julho: '07',
  jul: '07',
  agosto: '08',
  ago: '08',
  setembro: '09',
  set: '09',
  outubro: '10',
  out: '10',
  novembro: '11',
  nov: '11',
  dezembro: '12',
  dez: '12',
};

function explicitYearAfter(tokens: ReturnType<typeof tokenizeCaptureText>, monthIndex: number) {
  const nextToken = tokens[monthIndex + 1]?.normalized;
  const yearToken = nextToken === 'de' ? tokens[monthIndex + 2]?.normalized : nextToken;
  const year = Number(yearToken?.replace(/[^\d]/g, ''));
  return Number.isInteger(year) && year >= 2000 && year <= 2100 ? String(year) : null;
}

function isValidMonthDay(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 31;
}

export function parseCaptureDate(input: string, monthKey: string): ParsedCaptureDate | null {
  const tokens = tokenizeCaptureText(input);
  const currentYear = monthKey.slice(0, 4);

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const next = tokens[index + 1]?.normalized;

    if ((token.normalized === 'dia' || token.normalized === 'vence') && next) {
      const day = Number(next.replace(/[^\d]/g, ''));
      if (isValidMonthDay(day)) {
        const explicitMonthToken =
          tokens[index + 2]?.normalized === 'de'
            ? tokens[index + 3]?.normalized
            : tokens[index + 2]?.normalized;
        const explicitMonthIndex = tokens[index + 2]?.normalized === 'de' ? index + 3 : index + 2;
        const explicitMonth = explicitMonthToken
          ? MONTH_BY_NAME[explicitMonthToken.replace(/[^\w]/g, '')]
          : null;
        const explicitYear = explicitMonth ? explicitYearAfter(tokens, explicitMonthIndex) : null;

        return {
          day,
          date: `${explicitYear || currentYear}-${explicitMonth || monthKey.slice(5, 7)}-${String(day).padStart(2, '0')}`,
        };
      }
    }

    const day = Number(token.normalized.replace(/[^\d]/g, ''));
    const monthToken = next === 'de' ? tokens[index + 2]?.normalized : next;
    const normalizedMonthToken = monthToken?.replace(/[^\w]/g, '');
    const month = normalizedMonthToken ? MONTH_BY_NAME[normalizedMonthToken] : null;
    if (month && isValidMonthDay(day)) {
      const monthIndex = next === 'de' ? index + 2 : index + 1;
      const explicitYear = explicitYearAfter(tokens, monthIndex);
      return {
        day,
        date: `${explicitYear || currentYear}-${month}-${String(day).padStart(2, '0')}`,
      };
    }
  }

  return null;
}
