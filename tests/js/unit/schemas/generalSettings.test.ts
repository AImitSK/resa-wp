import { describe, it, expect } from 'vitest';
import {
	agentDataSchema,
	brandingSchema,
	generalSettingsSchema,
} from '@/admin/schemas/generalSettings';

describe('agentDataSchema', () => {
	const validAgentData = {
		name: 'Max Mustermann',
		company: 'Mustermann Immobilien GmbH',
		email: 'max@mustermann-immobilien.de',
		phone: '+49 89 123456789',
		address: 'Musterstraße 1\n80331 München',
		website: 'https://mustermann-immobilien.de',
		imprintUrl: 'https://mustermann-immobilien.de/impressum',
	};

	describe('gültige Daten', () => {
		it('akzeptiert vollständige gültige Daten', () => {
			const result = agentDataSchema.safeParse(validAgentData);
			expect(result.success).toBe(true);
		});

		it('akzeptiert minimale erforderliche Felder', () => {
			const result = agentDataSchema.safeParse({
				name: 'Max Mustermann',
				company: '',
				email: 'max@example.com',
				phone: '',
				address: '',
				website: '',
				imprintUrl: '',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert leere optionale Felder', () => {
			const result = agentDataSchema.safeParse({
				...validAgentData,
				company: '',
				phone: '',
				address: '',
				website: '',
				imprintUrl: '',
			});
			expect(result.success).toBe(true);
		});
	});

	describe('Pflichtfelder', () => {
		it('lehnt fehlenden name ab', () => {
			const { name: _name, ...data } = validAgentData;
			const result = agentDataSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt leeren name ab', () => {
			const result = agentDataSchema.safeParse({
				...validAgentData,
				name: '',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('name');
			}
		});

		it('lehnt fehlende email ab', () => {
			const { email: _email, ...data } = validAgentData;
			const result = agentDataSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt leere email ab', () => {
			const result = agentDataSchema.safeParse({
				...validAgentData,
				email: '',
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('email');
			}
		});
	});

	describe('E-Mail-Validierung', () => {
		it('akzeptiert gültige E-Mail-Adressen', () => {
			const validEmails = [
				'test@example.com',
				'user.name@example.co.uk',
				'user+tag@example.com',
				'user123@example123.de',
			];

			validEmails.forEach((email) => {
				const result = agentDataSchema.safeParse({
					...validAgentData,
					email,
				});
				expect(result.success).toBe(true);
			});
		});

		it('lehnt ungültige E-Mail-Adressen ab', () => {
			const invalidEmails = ['invalid', 'user@', '@example.com', 'user@example'];

			invalidEmails.forEach((email) => {
				const result = agentDataSchema.safeParse({
					...validAgentData,
					email,
				});
				expect(result.success).toBe(false);
			});
		});
	});

	describe('URL-Validierung', () => {
		it('akzeptiert gültige HTTP URLs für website', () => {
			const result = agentDataSchema.safeParse({
				...validAgentData,
				website: 'http://example.com',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert gültige HTTPS URLs für website', () => {
			const result = agentDataSchema.safeParse({
				...validAgentData,
				website: 'https://example.com',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert leeren String für website', () => {
			const result = agentDataSchema.safeParse({
				...validAgentData,
				website: '',
			});
			expect(result.success).toBe(true);
		});

		it('lehnt ungültige URL für website ab', () => {
			const result = agentDataSchema.safeParse({
				...validAgentData,
				website: 'www.example.com',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt URL ohne Protokoll für website ab', () => {
			const result = agentDataSchema.safeParse({
				...validAgentData,
				website: 'example.com',
			});
			expect(result.success).toBe(false);
		});

		it('akzeptiert gültige URL für imprintUrl', () => {
			const result = agentDataSchema.safeParse({
				...validAgentData,
				imprintUrl: 'https://example.com/impressum',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert leeren String für imprintUrl', () => {
			const result = agentDataSchema.safeParse({
				...validAgentData,
				imprintUrl: '',
			});
			expect(result.success).toBe(true);
		});

		it('lehnt ungültige URL für imprintUrl ab', () => {
			const result = agentDataSchema.safeParse({
				...validAgentData,
				imprintUrl: 'impressum',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('Edge Cases', () => {
		it('akzeptiert Sonderzeichen im Namen', () => {
			const result = agentDataSchema.safeParse({
				...validAgentData,
				name: "Dr. Hans-Peter Müller-Schmidt's",
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert mehrzeilige Adresse', () => {
			const result = agentDataSchema.safeParse({
				...validAgentData,
				address: 'Musterstraße 1\n80331 München\nDeutschland',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert internationale Telefonnummer', () => {
			const result = agentDataSchema.safeParse({
				...validAgentData,
				phone: '+49 (0) 89 / 123 456 789-0',
			});
			expect(result.success).toBe(true);
		});
	});
});

describe('brandingSchema', () => {
	const validBrandingData = {
		logoUrl: 'https://example.com/logo.png',
		logoId: 123,
		primaryColor: '#a9e43f',
		secondaryColor: '#2d3748',
		emailHeaderBg: '#ffffff',
		showPoweredBy: true,
	};

	describe('gültige Daten', () => {
		it('akzeptiert vollständige gültige Daten', () => {
			const result = brandingSchema.safeParse(validBrandingData);
			expect(result.success).toBe(true);
		});

		it('akzeptiert leere logoUrl', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				logoUrl: '',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert logoId von 0', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				logoId: 0,
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert showPoweredBy als false', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				showPoweredBy: false,
			});
			expect(result.success).toBe(true);
		});
	});

	describe('Pflichtfelder', () => {
		it('lehnt fehlende primaryColor ab', () => {
			const { primaryColor: _primaryColor, ...data } = validBrandingData;
			const result = brandingSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende secondaryColor ab', () => {
			const { secondaryColor: _secondaryColor, ...data } = validBrandingData;
			const result = brandingSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende logoId ab', () => {
			const { logoId: _logoId, ...data } = validBrandingData;
			const result = brandingSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende showPoweredBy ab', () => {
			const { showPoweredBy: _showPoweredBy, ...data } = validBrandingData;
			const result = brandingSchema.safeParse(data);
			expect(result.success).toBe(false);
		});
	});

	describe('Hex-Farbwert Validierung', () => {
		it('akzeptiert 6-stellige Hex-Farbe in Großbuchstaben', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				primaryColor: '#AABBCC',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert 6-stellige Hex-Farbe in Kleinbuchstaben', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				primaryColor: '#aabbcc',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert 3-stellige Hex-Farbe', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				primaryColor: '#abc',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert gemischte Groß-/Kleinschreibung', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				primaryColor: '#AaBbCc',
			});
			expect(result.success).toBe(true);
		});

		it('lehnt Farbe ohne # ab', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				primaryColor: 'aabbcc',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt ungültige Hex-Zeichen ab', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				primaryColor: '#gghhii',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt 4-stellige Hex-Farbe ab', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				primaryColor: '#abcd',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt 5-stellige Hex-Farbe ab', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				primaryColor: '#abcde',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt RGB-Format ab', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				primaryColor: 'rgb(255, 255, 255)',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt benannte Farbe ab', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				primaryColor: 'red',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt leere Farbe ab', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				primaryColor: '',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('logoId Validierung', () => {
		it('akzeptiert positive Integer', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				logoId: 999999,
			});
			expect(result.success).toBe(true);
		});

		it('lehnt negative logoId ab', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				logoId: -1,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt nicht-ganzzahlige logoId ab', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				logoId: 123.5,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt nicht-numerische logoId ab', () => {
			const result = brandingSchema.safeParse({
				...validBrandingData,
				logoId: '123',
			});
			expect(result.success).toBe(false);
		});
	});
});

describe('generalSettingsSchema', () => {
	const validData = {
		agent: {
			name: 'Max Mustermann',
			company: 'Mustermann Immobilien GmbH',
			email: 'max@mustermann-immobilien.de',
			phone: '+49 89 123456789',
			address: 'Musterstraße 1\n80331 München',
			website: 'https://mustermann-immobilien.de',
			imprintUrl: 'https://mustermann-immobilien.de/impressum',
		},
		branding: {
			logoUrl: 'https://example.com/logo.png',
			logoId: 123,
			primaryColor: '#a9e43f',
			secondaryColor: '#2d3748',
			emailHeaderBg: '#ffffff',
			showPoweredBy: true,
		},
	};

	describe('gültige Daten', () => {
		it('akzeptiert vollständige gültige Daten', () => {
			const result = generalSettingsSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('akzeptiert minimale gültige Daten', () => {
			const result = generalSettingsSchema.safeParse({
				agent: {
					name: 'Test',
					company: '',
					email: 'test@test.de',
					phone: '',
					address: '',
					website: '',
					imprintUrl: '',
				},
				branding: {
					logoUrl: '',
					logoId: 0,
					primaryColor: '#000',
					secondaryColor: '#fff',
					emailHeaderBg: '#fff',
					showPoweredBy: false,
				},
			});
			expect(result.success).toBe(true);
		});
	});

	describe('Pflichtfelder', () => {
		it('lehnt fehlendes agent Objekt ab', () => {
			const { agent: _agent, ...data } = validData;
			const result = generalSettingsSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlendes branding Objekt ab', () => {
			const { branding: _branding, ...data } = validData;
			const result = generalSettingsSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt leeres Objekt ab', () => {
			const result = generalSettingsSchema.safeParse({});
			expect(result.success).toBe(false);
		});
	});

	describe('Verschachtelte Validierung', () => {
		it('validiert agent Felder', () => {
			const result = generalSettingsSchema.safeParse({
				...validData,
				agent: {
					...validData.agent,
					email: 'invalid-email',
				},
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('agent');
				expect(result.error.issues[0].path).toContain('email');
			}
		});

		it('validiert branding Felder', () => {
			const result = generalSettingsSchema.safeParse({
				...validData,
				branding: {
					...validData.branding,
					primaryColor: 'invalid-color',
				},
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('branding');
				expect(result.error.issues[0].path).toContain('primaryColor');
			}
		});
	});

	describe('Typ-Inferenz', () => {
		it('gibt geparste Daten mit korrektem Typ zurück', () => {
			const result = generalSettingsSchema.safeParse(validData);
			if (result.success) {
				expect(typeof result.data.agent).toBe('object');
				expect(typeof result.data.branding).toBe('object');
				expect(typeof result.data.agent.name).toBe('string');
				expect(typeof result.data.agent.email).toBe('string');
				expect(typeof result.data.branding.primaryColor).toBe('string');
				expect(typeof result.data.branding.logoId).toBe('number');
				expect(typeof result.data.branding.showPoweredBy).toBe('boolean');
			}
		});
	});

	describe('Edge Cases', () => {
		it('lehnt null für agent ab', () => {
			const result = generalSettingsSchema.safeParse({
				agent: null,
				branding: validData.branding,
			});
			expect(result.success).toBe(false);
		});

		it('lehnt Array für branding ab', () => {
			const result = generalSettingsSchema.safeParse({
				agent: validData.agent,
				branding: [],
			});
			expect(result.success).toBe(false);
		});

		it('akzeptiert zusätzliche Felder nicht im strict mode', () => {
			// Default ist kein strict mode, daher werden zusätzliche Felder ignoriert
			const result = generalSettingsSchema.safeParse({
				...validData,
				extraField: 'should be ignored',
			});
			expect(result.success).toBe(true);
		});
	});
});
