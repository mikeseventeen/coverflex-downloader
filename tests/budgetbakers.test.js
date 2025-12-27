/**
 * Tests for BudgetBakers CSV conversion utilities
 */

import { operationsToBudgetBakersCSV, generateBudgetBakersFilename } from '../utils/budgetbakers.js';
import mockData from './fixtures/mock-operations.json';

describe('BudgetBakers CSV Conversion', () => {
  describe('operationsToBudgetBakersCSV', () => {
    test('should convert operations to BudgetBakers CSV format', () => {
      const csv = operationsToBudgetBakersCSV(mockData);

      expect(csv).toBeTruthy();
      expect(csv).toContain('Date;Amount;Payee;Note;Currency');
    });

    test('should use semicolon as delimiter', () => {
      const csv = operationsToBudgetBakersCSV(mockData);
      const lines = csv.split('\n');

      lines.forEach(line => {
        if (line.trim()) {
          expect(line).toContain(';');
        }
      });
    });

    test('should format dates as DD/MM/YYYY', () => {
      const csv = operationsToBudgetBakersCSV(mockData);

      // 2025-12-21 should become 21/12/2025
      expect(csv).toContain('21/12/2025');
      // 2025-06-12 should become 12/06/2025
      expect(csv).toContain('12/06/2025');
    });

    test('should exclude rejected transactions', () => {
      const csv = operationsToBudgetBakersCSV(mockData);

      // Rejected transaction should not appear
      expect(csv).not.toContain('Example Health Clinic');
      expect(csv).not.toContain('rejected');
      expect(csv).not.toContain('insufficient_funds');
    });

    test('should include only confirmed transactions', () => {
      const csv = operationsToBudgetBakersCSV(mockData);
      const lines = csv.split('\n').filter(line => line.trim() && !line.startsWith('Date'));

      // Should have 4 confirmed transactions (excluding 1 rejected)
      expect(lines.length).toBe(4);
    });

    test('should add negative sign for expenses (debits)', () => {
      const csv = operationsToBudgetBakersCSV(mockData);

      // Expense: 1200 cents = -12.00
      expect(csv).toMatch(/-12\.00/);
    });

    test('should NOT add negative sign for income (topup, refund)', () => {
      const csv = operationsToBudgetBakersCSV(mockData);
      const lines = csv.split('\n');

      // Find topup line: 20000 cents = 200.00 (positive)
      const topupLine = lines.find(line => line.includes('200.00'));
      expect(topupLine).toBeTruthy();
      expect(topupLine).not.toContain('-200.00');

      // Find refund line: 2500 cents = 25.00 (positive)
      const refundLine = lines.find(line => line.includes('25.00'));
      expect(refundLine).toBeTruthy();
      expect(refundLine).not.toContain('-25.00');
    });

    test('should create note with transaction type and category', () => {
      const csv = operationsToBudgetBakersCSV(mockData);

      expect(csv).toContain('Expense - recreation');
      expect(csv).toContain('Topup');
      expect(csv).toContain('Refund - fringe');
    });

    test('should include merchant name as payee', () => {
      const csv = operationsToBudgetBakersCSV(mockData);

      expect(csv).toContain('Example Gym Center');
      expect(csv).toContain('Example Supermarket');
    });

    test('should escape semicolons in fields', () => {
      const dataWithSemicolon = {
        operations: {
          list: [{
            id: "test-1",
            status: "confirmed",
            type: "benefit_expense",
            amount: { currency: "EUR", amount: 1000 },
            is_debit: true,
            executed_at: "2025-01-01T12:00:00Z",
            merchant_name: "Shop; With Semicolon",
            category_slug: "test",
            product_slug: "test"
          }]
        }
      };

      const csv = operationsToBudgetBakersCSV(dataWithSemicolon);
      expect(csv).toContain('"Shop; With Semicolon"');
    });

    test('should handle empty confirmed operations list', () => {
      const rejectedOnly = {
        operations: {
          list: [{
            id: "test-1",
            status: "rejected",
            type: "benefit_expense",
            amount: { currency: "EUR", amount: 1000 },
            is_debit: true,
            executed_at: "2025-01-01T12:00:00Z"
          }]
        }
      };

      const csv = operationsToBudgetBakersCSV(rejectedOnly);
      expect(csv).toBe('');
    });

    test('should handle missing merchant name', () => {
      const noMerchant = {
        operations: {
          list: [{
            id: "test-1",
            status: "confirmed",
            type: "topup",
            amount: { currency: "EUR", amount: 5000 },
            is_debit: false,
            executed_at: "2025-01-01T12:00:00Z",
            description_params: [],
            description_tag: "operations.topup_benefits_label"
          }]
        }
      };

      const csv = operationsToBudgetBakersCSV(noMerchant);
      expect(csv).toBeTruthy();
      // Should have empty payee field
      const lines = csv.split('\n');
      expect(lines[1]).toContain(';;'); // Empty payee between two semicolons
    });

    test('should default to EUR currency', () => {
      const csv = operationsToBudgetBakersCSV(mockData);

      expect(csv).toContain('EUR');
    });
  });

  describe('generateBudgetBakersFilename', () => {
    test('should generate filename with budgetbakers prefix', () => {
      const from = '2025-01-01T00:00:00.000Z';
      const to = '2025-12-31T23:59:59.999Z';

      const filename = generateBudgetBakersFilename(from, to);

      expect(filename).toContain('coverflex-budgetbakers');
      expect(filename).toContain('2025-01-01');
      expect(filename).toContain('2025-12-31');
      expect(filename).toMatch(/\.csv$/);
    });

    test('should use only date portion of ISO strings', () => {
      const from = '2025-06-15T14:30:00.000Z';
      const to = '2025-06-20T18:45:00.000Z';

      const filename = generateBudgetBakersFilename(from, to);

      expect(filename).toBe('coverflex-budgetbakers_2025-06-15_2025-06-20.csv');
    });
  });
});
