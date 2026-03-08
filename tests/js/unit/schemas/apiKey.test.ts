/**
 * Tests für das API-Key Create Schema.
 *
 * @see src/admin/schemas/apiKey.ts
 */

import { describe, it, expect } from 'vitest';
import { apiKeyCreateSchema } from '@/admin/schemas/apiKey';

describe('apiKeyCreateSchema', () => {
	const validData = {
		name: 'Production API Key',
	};

	describe('vollständige gültige Daten', () => {
		it('akzeptiert gültige Daten', () => {
			const result = apiKeyCreateSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('akzeptiert Namen mit verschiedenen Zeichen', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: 'API Key für Büro München (2024)',
			});
			expect(result.success).toBe(true);
		});
	});

	describe('name', () => {
		it('lehnt leeren Namen ab', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: '',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('name');
			}
		});

		it('akzeptiert Namen mit genau 1 Zeichen', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: 'X',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Namen mit genau 100 Zeichen', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: 'A'.repeat(100),
			});
			expect(result.success).toBe(true);
		});

		it('lehnt Namen mit mehr als 100 Zeichen ab', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: 'A'.repeat(101),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('name');
			}
		});

		it('akzeptiert Namen mit Sonderzeichen', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: 'API-Key_Test#1 (Production)',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Namen mit Umlauten', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: 'Schlüssel für München',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Namen mit Emojis', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: 'Production Key 🔑',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Namen mit nur Leerzeichen', () => {
			// Mindestlänge 1 prüft nur Länge, nicht Inhalt
			const result = apiKeyCreateSchema.safeParse({
				name: '   ',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Namen mit Zeilenumbrüchen', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: 'Line 1\nLine 2',
			});
			expect(result.success).toBe(true);
		});

		it('lehnt null als Namen ab', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: null,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt undefined als Namen ab', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: undefined,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt Zahl als Namen ab', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: 12345,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt Array als Namen ab', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: ['Production', 'Key'],
			});
			expect(result.success).toBe(false);
		});

		it('lehnt Objekt als Namen ab', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: { value: 'Production Key' },
			});
			expect(result.success).toBe(false);
		});
	});

	describe('fehlende Pflichtfelder', () => {
		it('lehnt leeres Objekt ab', () => {
			const result = apiKeyCreateSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it('lehnt null ab', () => {
			const result = apiKeyCreateSchema.safeParse(null);
			expect(result.success).toBe(false);
		});

		it('lehnt undefined ab', () => {
			const result = apiKeyCreateSchema.safeParse(undefined);
			expect(result.success).toBe(false);
		});

		it('lehnt String ab (muss Objekt sein)', () => {
			const result = apiKeyCreateSchema.safeParse('Production Key');
			expect(result.success).toBe(false);
		});
	});

	describe('zusätzliche Felder', () => {
		it('akzeptiert zusätzliche Felder (werden ignoriert)', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: 'Production Key',
				extraField: 'should be ignored',
				anotherField: 123,
			});
			expect(result.success).toBe(true);
			if (result.success) {
				// Prüfen, dass das geparste Ergebnis keine zusätzlichen Felder enthält
				expect(result.data).toEqual({ name: 'Production Key' });
			}
		});
	});

	describe('Edge Cases', () => {
		it('akzeptiert Namen mit führenden Leerzeichen', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: '  Production Key',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Namen mit abschließenden Leerzeichen', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: 'Production Key  ',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Namen genau an der Grenze (99 Zeichen)', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: 'A'.repeat(99),
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Unicode-Zeichen (Chinesisch)', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: '生产密钥',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Unicode-Zeichen (Arabisch)', () => {
			const result = apiKeyCreateSchema.safeParse({
				name: 'مفتاح الإنتاج',
			});
			expect(result.success).toBe(true);
		});

		it('zählt Emoji korrekt für Zeichenlimit', () => {
			// Emoji können mehrere UTF-16 Codeunits sein
			const nameWith99Chars = 'A'.repeat(98) + '🔑'; // 98 + Emoji
			const result = apiKeyCreateSchema.safeParse({
				name: nameWith99Chars,
			});
			// String-Länge in JS zählt UTF-16 Codeunits, Emoji ist 2
			expect(result.success).toBe(true);
		});
	});
});
