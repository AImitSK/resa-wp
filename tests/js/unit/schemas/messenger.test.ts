/**
 * Tests für das Messenger Form Schema.
 *
 * @see src/admin/schemas/messenger.ts
 */

import { describe, it, expect } from 'vitest';
import { messengerFormSchema, messengerPlatformSchema } from '@/admin/schemas/messenger';

describe('messengerPlatformSchema', () => {
	it('akzeptiert "slack"', () => {
		const result = messengerPlatformSchema.safeParse('slack');
		expect(result.success).toBe(true);
	});

	it('akzeptiert "teams"', () => {
		const result = messengerPlatformSchema.safeParse('teams');
		expect(result.success).toBe(true);
	});

	it('akzeptiert "discord"', () => {
		const result = messengerPlatformSchema.safeParse('discord');
		expect(result.success).toBe(true);
	});

	it('lehnt ungültige Plattform ab', () => {
		const result = messengerPlatformSchema.safeParse('telegram');
		expect(result.success).toBe(false);
	});

	it('lehnt leeren String ab', () => {
		const result = messengerPlatformSchema.safeParse('');
		expect(result.success).toBe(false);
	});

	it('lehnt Großschreibung ab', () => {
		const result = messengerPlatformSchema.safeParse('Slack');
		expect(result.success).toBe(false);
	});
});

describe('messengerFormSchema', () => {
	describe('Slack', () => {
		const validSlackData = {
			name: 'Slack Benachrichtigungen',
			platform: 'slack' as const,
			webhookUrl: 'https://hooks.example.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXX',
			isActive: true,
		};

		it('akzeptiert gültige Slack-Daten', () => {
			const result = messengerFormSchema.safeParse(validSlackData);
			expect(result.success).toBe(true);
		});

		it('lehnt ungültige Slack-Webhook-URL ab', () => {
			const result = messengerFormSchema.safeParse({
				...validSlackData,
				webhookUrl: 'https://example.com/webhook',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const webhookIssue = result.error.issues.find((i) => i.path.includes('webhookUrl'));
				expect(webhookIssue).toBeDefined();
			}
		});

		it('lehnt HTTP (nicht HTTPS) Slack-URL ab', () => {
			const result = messengerFormSchema.safeParse({
				...validSlackData,
				webhookUrl:
					'http://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('Microsoft Teams', () => {
		const validTeamsData = {
			name: 'Teams Benachrichtigungen',
			platform: 'teams' as const,
			webhookUrl:
				'https://company.webhook.office.com/webhookb2/guid1/IncomingWebhook/guid2/guid3',
			isActive: true,
		};

		it('akzeptiert gültige Teams-Daten', () => {
			const result = messengerFormSchema.safeParse(validTeamsData);
			expect(result.success).toBe(true);
		});

		it('lehnt ungültige Teams-Webhook-URL ab', () => {
			const result = messengerFormSchema.safeParse({
				...validTeamsData,
				webhookUrl: 'https://example.com/webhook',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const webhookIssue = result.error.issues.find((i) => i.path.includes('webhookUrl'));
				expect(webhookIssue).toBeDefined();
			}
		});

		it('lehnt Slack-URL für Teams ab', () => {
			const result = messengerFormSchema.safeParse({
				...validTeamsData,
				webhookUrl:
					'https://hooks.example.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXX',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('Discord', () => {
		const validDiscordData = {
			name: 'Discord Benachrichtigungen',
			platform: 'discord' as const,
			webhookUrl: 'https://discord.com/api/webhooks/123456789/abcdefghijklmnop',
			isActive: true,
		};

		it('akzeptiert gültige Discord-Daten', () => {
			const result = messengerFormSchema.safeParse(validDiscordData);
			expect(result.success).toBe(true);
		});

		it('lehnt ungültige Discord-Webhook-URL ab', () => {
			const result = messengerFormSchema.safeParse({
				...validDiscordData,
				webhookUrl: 'https://example.com/webhook',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const webhookIssue = result.error.issues.find((i) => i.path.includes('webhookUrl'));
				expect(webhookIssue).toBeDefined();
			}
		});

		it('lehnt Teams-URL für Discord ab', () => {
			const result = messengerFormSchema.safeParse({
				...validDiscordData,
				webhookUrl:
					'https://company.webhook.office.com/webhookb2/guid1/IncomingWebhook/guid2/guid3',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('name', () => {
		const baseData = {
			platform: 'slack' as const,
			webhookUrl: 'https://hooks.example.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXX',
			isActive: true,
		};

		it('lehnt leeren Namen ab', () => {
			const result = messengerFormSchema.safeParse({
				...baseData,
				name: '',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('name');
			}
		});

		it('akzeptiert Namen mit genau 1 Zeichen', () => {
			const result = messengerFormSchema.safeParse({
				...baseData,
				name: 'X',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert Namen mit genau 100 Zeichen', () => {
			const result = messengerFormSchema.safeParse({
				...baseData,
				name: 'A'.repeat(100),
			});
			expect(result.success).toBe(true);
		});

		it('lehnt Namen mit mehr als 100 Zeichen ab', () => {
			const result = messengerFormSchema.safeParse({
				...baseData,
				name: 'A'.repeat(101),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('name');
			}
		});

		it('akzeptiert Namen mit Umlauten', () => {
			const result = messengerFormSchema.safeParse({
				...baseData,
				name: 'Büro München Benachrichtigungen',
			});
			expect(result.success).toBe(true);
		});
	});

	describe('webhookUrl Basis-Validierung', () => {
		const baseData = {
			name: 'Test',
			platform: 'slack' as const,
			isActive: true,
		};

		it('lehnt leere webhookUrl ab', () => {
			const result = messengerFormSchema.safeParse({
				...baseData,
				webhookUrl: '',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('webhookUrl');
			}
		});

		it('lehnt ungültige URL-Syntax ab', () => {
			const result = messengerFormSchema.safeParse({
				...baseData,
				webhookUrl: 'nicht-eine-url',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt URL ohne Protokoll ab', () => {
			const result = messengerFormSchema.safeParse({
				...baseData,
				webhookUrl: 'hooks.slack.com/services/xxx',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('isActive', () => {
		const baseData = {
			name: 'Test',
			platform: 'slack' as const,
			webhookUrl: 'https://hooks.example.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXX',
		};

		it('akzeptiert true', () => {
			const result = messengerFormSchema.safeParse({
				...baseData,
				isActive: true,
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert false', () => {
			const result = messengerFormSchema.safeParse({
				...baseData,
				isActive: false,
			});
			expect(result.success).toBe(true);
		});

		it('lehnt String "true" ab', () => {
			const result = messengerFormSchema.safeParse({
				...baseData,
				isActive: 'true',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt Zahl 1 ab', () => {
			const result = messengerFormSchema.safeParse({
				...baseData,
				isActive: 1,
			});
			expect(result.success).toBe(false);
		});
	});

	describe('platform', () => {
		const baseData = {
			name: 'Test',
			webhookUrl: 'https://hooks.example.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXX',
			isActive: true,
		};

		it('lehnt fehlende Plattform ab', () => {
			const result = messengerFormSchema.safeParse(baseData);
			expect(result.success).toBe(false);
		});

		it('lehnt ungültige Plattform ab', () => {
			const result = messengerFormSchema.safeParse({
				...baseData,
				platform: 'whatsapp',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('fehlende Pflichtfelder', () => {
		it('lehnt leeres Objekt ab', () => {
			const result = messengerFormSchema.safeParse({});
			expect(result.success).toBe(false);
		});

		it('lehnt fehlendes name ab', () => {
			const result = messengerFormSchema.safeParse({
				platform: 'slack',
				webhookUrl:
					'https://hooks.example.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXX',
				isActive: true,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende webhookUrl ab', () => {
			const result = messengerFormSchema.safeParse({
				name: 'Test',
				platform: 'slack',
				isActive: true,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt fehlendes isActive ab', () => {
			const result = messengerFormSchema.safeParse({
				name: 'Test',
				platform: 'slack',
				webhookUrl:
					'https://hooks.example.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXX',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('Edge Cases', () => {
		it('validiert Slack-URL mit langem Pfad', () => {
			const result = messengerFormSchema.safeParse({
				name: 'Test',
				platform: 'slack',
				webhookUrl:
					'https://hooks.slack.com/services/T00000000000000/B00000000000000/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
				isActive: true,
			});
			expect(result.success).toBe(true);
		});

		it('validiert Teams-URL mit verschiedenen Subdomains', () => {
			const result = messengerFormSchema.safeParse({
				name: 'Test',
				platform: 'teams',
				webhookUrl:
					'https://contoso.webhook.office.com/webhookb2/abc123/IncomingWebhook/def456/ghi789',
				isActive: true,
			});
			expect(result.success).toBe(true);
		});

		it('validiert Discord-URL mit numerischer Webhook-ID', () => {
			const result = messengerFormSchema.safeParse({
				name: 'Test',
				platform: 'discord',
				webhookUrl:
					'https://discord.com/api/webhooks/9876543210/aBcDeFgHiJkLmNoPqRsTuVwXyZ',
				isActive: true,
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert inaktive Verbindung', () => {
			const result = messengerFormSchema.safeParse({
				name: 'Deaktivierte Verbindung',
				platform: 'slack',
				webhookUrl:
					'https://hooks.example.com/services/TXXXXXXXX/BXXXXXXXX/XXXXXXXXXXXXXXX',
				isActive: false,
			});
			expect(result.success).toBe(true);
		});

		it('Fehlermeldung enthält Plattformnamen', () => {
			const result = messengerFormSchema.safeParse({
				name: 'Test',
				platform: 'slack',
				webhookUrl: 'https://example.com/webhook',
				isActive: true,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				const webhookIssue = result.error.issues.find((i) => i.path.includes('webhookUrl'));
				expect(webhookIssue?.message).toContain('Slack');
			}
		});
	});
});
