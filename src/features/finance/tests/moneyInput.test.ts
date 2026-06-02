import { describe, it, expect, vi } from 'vitest';
import {
  formatMoneyInput,
  applyMoneyMask,
  parseMoneyInput,
  applyMoneyMaskPreservingCaret,
} from '../lib/moneyInput';

describe('moneyInput.ts', () => {
  describe('formatMoneyInput', () => {
    it('formats positive number', () => {
      expect(formatMoneyInput(1234.56)).toBe('1.234,56');
    });

    it('formats zero', () => {
      expect(formatMoneyInput(0)).toBe('0,00');
    });

    it('returns empty for non-finite numbers', () => {
      expect(formatMoneyInput(Infinity)).toBe('');
      expect(formatMoneyInput(NaN)).toBe('');
    });

    it('respects hideNonPositive option', () => {
      expect(formatMoneyInput(0, { hideNonPositive: true })).toBe('');
      expect(formatMoneyInput(-100, { hideNonPositive: true })).toBe('');
      expect(formatMoneyInput(100, { hideNonPositive: true })).toBe('100,00');
    });

    it('handles string input', () => {
      expect(formatMoneyInput('1234.56')).toBe('1.234,56');
    });

    it('handles null/undefined', () => {
      expect(formatMoneyInput(null)).toBe('0,00');
      expect(formatMoneyInput(undefined)).toBe('');
    });
  });

  describe('applyMoneyMask', () => {
    it('applies mask to digits', () => {
      expect(applyMoneyMask('123456')).toBe('1.234,56');
    });

    it('returns empty for empty input', () => {
      expect(applyMoneyMask('')).toBe('');
      expect(applyMoneyMask(null)).toBe('');
      expect(applyMoneyMask(undefined)).toBe('');
    });

    it('ignores non-digit characters', () => {
      expect(applyMoneyMask('abc123def')).toBe('1,23');
    });

    it('keeps caret near the edited digit after masking', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.value = '3.200,00';
      input.setSelectionRange(3, 3);
      input.focus();
      const animationSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
        cb(0);
        return 0;
      });

      expect(applyMoneyMaskPreservingCaret(input)).toBe('3.200,00');
      expect(input.selectionStart).toBe(3);

      animationSpy.mockRestore();
      input.remove();
    });
  });

  describe('parseMoneyInput', () => {
    it('parses BRL formatted string', () => {
      expect(parseMoneyInput('1.234,56')).toBe(1234.56);
    });

    it('handles null/undefined/empty', () => {
      expect(parseMoneyInput(null)).toBeNull();
      expect(parseMoneyInput(undefined)).toBeNull();
      expect(parseMoneyInput('')).toBeNull();
    });

    it('returns null for non-finite', () => {
      expect(parseMoneyInput('abc')).toBeNull();
    });

    it('respects allowZero option', () => {
      expect(parseMoneyInput('0', { allowZero: false })).toBeNull();
      expect(parseMoneyInput('0', { allowZero: true })).toBe(0);
    });

    it('returns null for negative when not allowed', () => {
      expect(parseMoneyInput('-100', { allowZero: true })).toBeNull();
    });
  });
});
