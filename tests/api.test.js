/**
 * Tests for API utilities
 */

import { formatDateRange } from '../utils/api.js';

describe('API Utilities', () => {
  describe('formatDateRange', () => {
    test('should return ISO 8601 formatted strings', () => {
      const { from, to } = formatDateRange('2025-01-15', '2025-01-20');

      // ISO format should contain 'T' and 'Z'
      expect(from).toContain('T');
      expect(from).toContain('Z');
      expect(to).toContain('T');
      expect(to).toContain('Z');
    });

    test('should produce valid Date objects', () => {
      const { from, to } = formatDateRange('2025-03-15', '2025-03-20');

      const fromDate = new Date(from);
      const toDate = new Date(to);

      expect(fromDate).toBeInstanceOf(Date);
      expect(toDate).toBeInstanceOf(Date);
      expect(fromDate.getTime()).toBeLessThan(toDate.getTime());
    });

    test('should handle same day range', () => {
      const { from, to } = formatDateRange('2025-07-20', '2025-07-20');

      const fromDate = new Date(from);
      const toDate = new Date(to);

      // From should be earlier than To even on same day
      expect(fromDate.getTime()).toBeLessThan(toDate.getTime());
    });

    test('should return different times for start and end of day', () => {
      const { from, to } = formatDateRange('2025-06-10', '2025-06-10');

      const fromDate = new Date(from);
      const toDate = new Date(to);

      // There should be almost 24 hours difference
      const hoursDiff = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeGreaterThan(23);
      expect(hoursDiff).toBeLessThan(24);
    });
  });
});
