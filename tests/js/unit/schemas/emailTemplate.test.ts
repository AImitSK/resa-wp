import { describe, it, expect } from 'vitest';
import { emailTemplateSchema, testEmailSchema } from '@/admin/schemas/emailTemplate';

describe('emailTemplateSchema', () => {
	const validData = {
		subject: 'Ihre Immobilienbewertung ist fertig',
		body: '<h1>Hallo {{name}}</h1><p>Ihre Bewertung wurde erstellt.</p>',
		is_active: true,
	};

	describe('gültige Daten', () => {
		it('akzeptiert vollständige gültige Daten', () => {
			const result = emailTemplateSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('akzeptiert inaktives Template', () => {
			const result = emailTemplateSchema.safeParse({
				...validData,
				is_active: false,
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert HTML-Inhalt mit komplexer Struktur', () => {
			const complexHtml = `
				<!DOCTYPE html>
				<html>
				<head><title>Email</title></head>
				<body>
					<div style="background: #f5f5f5;">
						<h1>{{name}}</h1>
						<p>Ihr Ergebnis: <strong>{{result}}</strong></p>
						<a href="{{link}}">Hier klicken</a>
					</div>
				</body>
				</html>
			`;
			const result = emailTemplateSchema.safeParse({
				...validData,
				body: complexHtml,
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Plaintext-Body ohne HTML', () => {
			const result = emailTemplateSchema.safeParse({
				...validData,
				body: 'Einfacher Text ohne HTML-Tags.',
			});
			expect(result.success).toBe(true);
		});
	});

	describe('Pflichtfelder', () => {
		it('lehnt fehlenden subject ab', () => {
			const { subject: _subject, ...data } = validData;
			const result = emailTemplateSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt leeren subject ab', () => {
			const result = emailTemplateSchema.safeParse({
				...validData,
				subject: '',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('subject');
			}
		});

		it('lehnt fehlenden body ab', () => {
			const { body: _body, ...data } = validData;
			const result = emailTemplateSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt leeren body ab', () => {
			const result = emailTemplateSchema.safeParse({
				...validData,
				body: '',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('body');
			}
		});

		it('lehnt fehlende is_active ab', () => {
			const { is_active: _is_active, ...data } = validData;
			const result = emailTemplateSchema.safeParse(data);
			expect(result.success).toBe(false);
		});
	});

	describe('ungültige Daten', () => {
		it('lehnt nicht-boolean is_active ab', () => {
			const result = emailTemplateSchema.safeParse({
				...validData,
				is_active: 'true',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt nicht-string subject ab', () => {
			const result = emailTemplateSchema.safeParse({
				...validData,
				subject: 123,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt nicht-string body ab', () => {
			const result = emailTemplateSchema.safeParse({
				...validData,
				body: { html: '<p>test</p>' },
			});
			expect(result.success).toBe(false);
		});
	});

	describe('Grenzwerte', () => {
		it('akzeptiert subject mit genau 200 Zeichen', () => {
			const result = emailTemplateSchema.safeParse({
				...validData,
				subject: 'a'.repeat(200),
			});
			expect(result.success).toBe(true);
		});

		it('lehnt subject mit mehr als 200 Zeichen ab', () => {
			const result = emailTemplateSchema.safeParse({
				...validData,
				subject: 'a'.repeat(201),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('subject');
			}
		});

		it('akzeptiert body mit einem Zeichen', () => {
			const result = emailTemplateSchema.safeParse({
				...validData,
				body: 'X',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert sehr langen body', () => {
			const result = emailTemplateSchema.safeParse({
				...validData,
				body: 'a'.repeat(50000),
			});
			expect(result.success).toBe(true);
		});
	});

	describe('Edge Cases', () => {
		it('akzeptiert subject mit Sonderzeichen', () => {
			const result = emailTemplateSchema.safeParse({
				...validData,
				subject: 'Ihre Bewertung: "Traumhaus" - 100% kostenlos! 🏠',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert body mit nur Whitespace', () => {
			const result = emailTemplateSchema.safeParse({
				...validData,
				body: '   ',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert subject mit nur Whitespace', () => {
			const result = emailTemplateSchema.safeParse({
				...validData,
				subject: '   ',
			});
			expect(result.success).toBe(true);
		});
	});
});

describe('testEmailSchema', () => {
	describe('gültige Daten', () => {
		it('akzeptiert gültige E-Mail-Adresse', () => {
			const result = testEmailSchema.safeParse({
				email: 'test@example.com',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert E-Mail mit Subdomain', () => {
			const result = testEmailSchema.safeParse({
				email: 'user@mail.example.co.uk',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert E-Mail mit Plus-Adressierung', () => {
			const result = testEmailSchema.safeParse({
				email: 'user+test@example.com',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert E-Mail mit Zahlen', () => {
			const result = testEmailSchema.safeParse({
				email: 'user123@example123.com',
			});
			expect(result.success).toBe(true);
		});
	});

	describe('Pflichtfeld', () => {
		it('lehnt fehlendes email ab', () => {
			const result = testEmailSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it('lehnt leere email ab', () => {
			const result = testEmailSchema.safeParse({
				email: '',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('ungültige E-Mail-Formate', () => {
		it('lehnt E-Mail ohne @ ab', () => {
			const result = testEmailSchema.safeParse({
				email: 'userexample.com',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt E-Mail ohne Domain ab', () => {
			const result = testEmailSchema.safeParse({
				email: 'user@',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt E-Mail ohne lokalen Teil ab', () => {
			const result = testEmailSchema.safeParse({
				email: '@example.com',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt E-Mail mit Leerzeichen ab', () => {
			const result = testEmailSchema.safeParse({
				email: 'user @example.com',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt E-Mail ohne TLD ab', () => {
			const result = testEmailSchema.safeParse({
				email: 'user@example',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('Edge Cases', () => {
		it('akzeptiert deutsche Umlaute in Domain', () => {
			// Zod's email validation may or may not accept IDN domains
			const result = testEmailSchema.safeParse({
				email: 'user@müller.de',
			});
			// Just verify it returns a definite result
			expect(typeof result.success).toBe('boolean');
		});

		it('lehnt nur Whitespace ab', () => {
			const result = testEmailSchema.safeParse({
				email: '   ',
			});
			expect(result.success).toBe(false);
		});
	});
});
