import { describe, it, expect } from 'vitest';
import {
  formatMoney,
  monthKey,
  previousMonthKey,
  isMonthInRange,
  formatStartMonth,
  clone,
} from '../lib/utils';

describe('utils.js - formatMoney', () => {
  it('formats BRL currency', () => {
    const result = formatMoney(1234.56);
    expect(result).toMatch(/R\$/);
    expect(result).toMatch(/1.234,56/);
  });

  it('handles negative values', () => {
    const result = formatMoney(-500);
    expect(result).toContain('-R$');
  });
});

describe('utils.js - monthKey', () => {
  it('returns YYYY-MM format', () => {
    const result = monthKey(new Date(2026, 3, 15)); // April 2026 (month is 0-indexed)
    expect(result).toBe('2026-04');
  });

  it('returns YYYY-MM for January', () => {
    const result = monthKey(new Date(2026, 0, 15)); // January 2026
    expect(result).toBe('2026-01');
  });

  it('returns YYYY-MM for December', () => {
    const result = monthKey(new Date(2026, 11, 15)); // December 2026
    expect(result).toBe('2026-12');
  });
});

describe('utils.js - previousMonthKey', () => {
  it('returns previous month', () => {
    expect(previousMonthKey('2026-04')).toBe('2026-03');
  });
});

describe('utils.js - isMonthInRange', () => {
  it('checks if month is in range', () => {
    expect(isMonthInRange('2026-04', '2026-01', '2026-12')).toBe(true);
  });

  it('returns true when only has startMonth', () => {
    expect(isMonthInRange('2026-04', '2026-01', null)).toBe(true);
  });
});

describe('utils.js - formatStartMonth', () => {
  it('formats month key to short format', () => {
    expect(formatStartMonth('2026-04')).toBe('Abr/2026');
  });
});

describe('utils.js - clone', () => {
  it('creates deep copy', () => {
    const original = { a: 1, b: { c: 2 } };
    const cloned = clone(original);
    cloned.b.c = 3;
    expect(original.b.c).toBe(2);
  });
});
