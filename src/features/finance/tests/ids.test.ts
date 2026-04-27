import { describe, it, expect } from 'vitest';
import { createFinanceId } from '../lib/ids';

describe('ids.ts', () => {
  it('generates unique ids', () => {
    const id1 = createFinanceId('fixed');
    const id2 = createFinanceId('fixed');
    expect(id1).not.toBe(id2);
  });

  it('uses correct prefix', () => {
    expect(createFinanceId('fixed')).toMatch(/^fixed_/);
    expect(createFinanceId('rev')).toMatch(/^rev_/);
    expect(createFinanceId('inst')).toMatch(/^inst_/);
    expect(createFinanceId('ovr')).toMatch(/^ovr_/);
  });

  it('generates string ids', () => {
    const id = createFinanceId('test');
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
