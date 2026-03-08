/**
 * Tests für das Webhook Schema.
 *
 * @see src/admin/schemas/webhook.ts
 */

import { describe, it, expect } from 'vitest';
import { webhookSchema } from '@/admin/schemas/webhook';

describe('webhookSchema', () => {
	const validData = {
		name: 'CRM Integration',
		url: 'https://api.example.com/webhook',
		secret: 'super-secret-hmac-key-12345',
		events: ['lead.created', 'lead.updated'],
		isActive: true,
	};

	describe('vollständige gültige Daten', () => {
		it('akzeptiert gültige Daten', () => {
			const result = webhookSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('akzeptiert HTTP-URL', () => {
			const result = webhookSchema.safeParse({
				...validData,
				url: 'http://localhost:3000/webhook',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert inaktiven Webhook', () => {
			const result = webhookSchema.safeParse({
				...validData,
				isActive: false,
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert einzelnes Event', () => {
			const result = webhookSchema.safeParse({
				...validData,
				events: ['lead.created'],
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert viele Events', () => {
			const result = webhookSchema.safeParse({
				...validData,
				events: ['lead.created', 'lead.updated', 'lead.deleted', 'lead.assigned'],
			});
			expect(result.success).toBe(true);
		});
	});

	describe('name', () => {
		it('lehnt leeren Namen ab', () => {
			const result = webhookSchema.safeParse({
				...validData,
				name: '',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('name');
			}
		});

		it('akzeptiert Namen mit genau 1 Zeichen', () => {
			const result = webhookSchema.safeParse({
				...validData,
				name: 'X',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Namen mit genau 100 Zeichen', () => {
			const result = webhookSchema.safeParse({
				...validData,
				name: 'A'.repeat(100),
			});
			expect(result.success).toBe(true);
		});

		it('lehnt Namen mit mehr als 100 Zeichen ab', () => {
			const result = webhookSchema.safeParse({
				...validData,
				name: 'A'.repeat(101),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('name');
			}
		});

		it('akzeptiert Namen mit Sonderzeichen', () => {
			const result = webhookSchema.safeParse({
				...validData,
				name: 'CRM-Integration (Production) #1',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Namen mit Umlauten', () => {
			const result = webhookSchema.safeParse({
				...validData,
				name: 'Büro München - Webhook',
			});
			expect(result.success).toBe(true);
		});
	});

	describe('url', () => {
		it('lehnt leere URL ab', () => {
			const result = webhookSchema.safeParse({
				...validData,
				url: '',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('url');
			}
		});

		it('lehnt ungültige URL ab (keine URL-Syntax)', () => {
			const result = webhookSchema.safeParse({
				...validData,
				url: 'nicht-eine-url',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt URL ohne Protokoll ab', () => {
			const result = webhookSchema.safeParse({
				...validData,
				url: 'www.example.com/webhook',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt FTP-URL ab', () => {
			const result = webhookSchema.safeParse({
				...validData,
				url: 'ftp://example.com/webhook',
			});
			expect(result.success).toBe(false);
		});

		it('akzeptiert URL mit Port', () => {
			const result = webhookSchema.safeParse({
				...validData,
				url: 'https://api.example.com:8443/webhook',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert URL mit Query-Parametern', () => {
			const result = webhookSchema.safeParse({
				...validData,
				url: 'https://api.example.com/webhook?token=abc123&source=resa',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert localhost URL', () => {
			const result = webhookSchema.safeParse({
				...validData,
				url: 'http://localhost:3000/api/webhook',
			});
			expect(result.success).toBe(true);
		});
	});

	describe('secret', () => {
		it('lehnt leeres Secret ab', () => {
			const result = webhookSchema.safeParse({
				...validData,
				secret: '',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('secret');
			}
		});

		it('akzeptiert Secret mit 1 Zeichen', () => {
			const result = webhookSchema.safeParse({
				...validData,
				secret: 'x',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert langes Secret', () => {
			const result = webhookSchema.safeParse({
				...validData,
				secret: 'a'.repeat(256),
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Secret mit Sonderzeichen', () => {
			const result = webhookSchema.safeParse({
				...validData,
				secret: 'abc123!@#$%^&*()_+-=[]{}|;:,.<>?',
			});
			expect(result.success).toBe(true);
		});
	});

	describe('events', () => {
		it('lehnt leeres Events-Array ab', () => {
			const result = webhookSchema.safeParse({
				...validData,
				events: [],
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('events');
			}
		});

		it('akzeptiert Array mit einem Event', () => {
			const result = webhookSchema.safeParse({
				...validData,
				events: ['lead.created'],
			});
			expect(result.success).toBe(true);
		});

		it('lehnt fehlendes events-Feld ab', () => {
			const { events: _events, ...withoutEvents } = validData;
			const result = webhookSchema.safeParse(withoutEvents);
			expect(result.success).toBe(false);
		});

		it('lehnt events als String (nicht Array) ab', () => {
			const result = webhookSchema.safeParse({
				...validData,
				events: 'lead.created',
			});
			expect(result.success).toBe(false);
		});

		it('akzeptiert Events mit beliebigen Strings', () => {
			const result = webhookSchema.safeParse({
				...validData,
				events: ['custom.event', 'another.event'],
			});
			expect(result.success).toBe(true);
		});
	});

	describe('isActive', () => {
		it('akzeptiert true', () => {
			const result = webhookSchema.safeParse({
				...validData,
				isActive: true,
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert false', () => {
			const result = webhookSchema.safeParse({
				...validData,
				isActive: false,
			});
			expect(result.success).toBe(true);
		});

		it('lehnt String "true" ab', () => {
			const result = webhookSchema.safeParse({
				...validData,
				isActive: 'true',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt Zahl 1 ab', () => {
			const result = webhookSchema.safeParse({
				...validData,
				isActive: 1,
			});
			expect(result.success).toBe(false);
		});
	});

	describe('fehlende Pflichtfelder', () => {
		it('lehnt leeres Objekt ab', () => {
			const result = webhookSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it('lehnt fehlendes name ab', () => {
			const { name: _name, ...withoutName } = validData;
			const result = webhookSchema.safeParse(withoutName);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende url ab', () => {
			const { url: _url, ...withoutUrl } = validData;
			const result = webhookSchema.safeParse(withoutUrl);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlendes secret ab', () => {
			const { secret: _secret, ...withoutSecret } = validData;
			const result = webhookSchema.safeParse(withoutSecret);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlendes isActive ab', () => {
			const { isActive: _isActive, ...withoutIsActive } = validData;
			const result = webhookSchema.safeParse(withoutIsActive);
			expect(result.success).toBe(false);
		});
	});

	describe('Edge Cases', () => {
		it('akzeptiert URL mit IP-Adresse', () => {
			const result = webhookSchema.safeParse({
				...validData,
				url: 'https://192.168.1.100:8080/webhook',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Events mit leeren Strings im Array', () => {
			// Dies sollte akzeptiert werden, da z.array(z.string()) keine min-Validierung hat
			const result = webhookSchema.safeParse({
				...validData,
				events: ['lead.created', ''],
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Name mit nur Leerzeichen', () => {
			// Mindestlänge 1 prüft nur Länge, nicht Inhalt
			const result = webhookSchema.safeParse({
				...validData,
				name: '   ',
			});
			expect(result.success).toBe(true);
		});
	});
});
