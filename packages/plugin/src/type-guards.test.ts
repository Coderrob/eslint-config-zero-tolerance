import { isDefined, isNullOrUndefined, isString, isBoolean, isNumber } from './type-guards';

describe('type-guards', () => {
  // ── isDefined ────────────────────────────────────────────────────────────

  describe('isDefined', () => {
    it('should return true for a non-null, non-undefined value', () => {
      expect(isDefined('hello')).toBe(true);
    });

    it('should return true for zero', () => {
      expect(isDefined(0)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isDefined('')).toBe(true);
    });

    it('should return true for false', () => {
      expect(isDefined(false)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isDefined(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isDefined(undefined)).toBe(false);
    });
  });

  // ── isNullOrUndefined ────────────────────────────────────────────────────

  describe('isNullOrUndefined', () => {
    it('should return true for null', () => {
      expect(isNullOrUndefined(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isNullOrUndefined(undefined)).toBe(true);
    });

    it('should return false for a string', () => {
      expect(isNullOrUndefined('hello')).toBe(false);
    });

    it('should return false for zero', () => {
      expect(isNullOrUndefined(0)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isNullOrUndefined('')).toBe(false);
    });

    it('should return false for false', () => {
      expect(isNullOrUndefined(false)).toBe(false);
    });
  });

  // ── isString ─────────────────────────────────────────────────────────────

  describe('isString', () => {
    it('should return true for a string value', () => {
      expect(isString('test')).toBe(true);
    });

    it('should return false for a number', () => {
      expect(isString(42)).toBe(false);
    });
  });

  // ── isBoolean ────────────────────────────────────────────────────────────

  describe('isBoolean', () => {
    it('should return true for true', () => {
      expect(isBoolean(true)).toBe(true);
    });

    it('should return false for a string', () => {
      expect(isBoolean('true')).toBe(false);
    });
  });

  // ── isNumber ─────────────────────────────────────────────────────────────

  describe('isNumber', () => {
    it('should return true for a number', () => {
      expect(isNumber(42)).toBe(true);
    });

    it('should return false for a string', () => {
      expect(isNumber('42')).toBe(false);
    });
  });
});
