import { describe, it, expect } from 'vitest';
import { pdfTemplateSchema } from '@/admin/schemas/pdfTemplate';

describe('pdfTemplateSchema', () => {
	const validData = {
		headerText: 'Immobilienbewertung',
		footerText: '© 2024 Mustermann Immobilien',
		showDate: true,
		showAgents: true,
		logoPosition: 'left' as const,
		logoSize: 48,
		margins: {
			top: 20,
			bottom: 20,
			left: 15,
			right: 15,
		},
	};

	describe('gültige Daten', () => {
		it('akzeptiert vollständige gültige Daten', () => {
			const result = pdfTemplateSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it('akzeptiert alle logoPosition Werte', () => {
			const positions = ['left', 'center', 'right'] as const;

			positions.forEach((position) => {
				const result = pdfTemplateSchema.safeParse({
					...validData,
					logoPosition: position,
				});
				expect(result.success).toBe(true);
			});
		});

		it('akzeptiert leere Strings für headerText und footerText', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				headerText: '',
				footerText: '',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert showDate und showAgents als false', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				showDate: false,
				showAgents: false,
			});
			expect(result.success).toBe(true);
		});
	});

	describe('Pflichtfelder', () => {
		it('lehnt fehlenden headerText ab', () => {
			const { headerText: _headerText, ...data } = validData;
			const result = pdfTemplateSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlenden footerText ab', () => {
			const { footerText: _footerText, ...data } = validData;
			const result = pdfTemplateSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende showDate ab', () => {
			const { showDate: _showDate, ...data } = validData;
			const result = pdfTemplateSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende showAgents ab', () => {
			const { showAgents: _showAgents, ...data } = validData;
			const result = pdfTemplateSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende logoPosition ab', () => {
			const { logoPosition: _logoPosition, ...data } = validData;
			const result = pdfTemplateSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende logoSize ab', () => {
			const { logoSize: _logoSize, ...data } = validData;
			const result = pdfTemplateSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende margins ab', () => {
			const { margins: _margins, ...data } = validData;
			const result = pdfTemplateSchema.safeParse(data);
			expect(result.success).toBe(false);
		});
	});

	describe('ungültige Daten', () => {
		it('lehnt ungültige logoPosition ab', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				logoPosition: 'top',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt nicht-boolean showDate ab', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				showDate: 'true',
			});
			expect(result.success).toBe(false);
		});

		it('lehnt nicht-number logoSize ab', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				logoSize: '48',
			});
			expect(result.success).toBe(false);
		});
	});

	describe('headerText/footerText Grenzwerte', () => {
		it('akzeptiert headerText mit genau 200 Zeichen', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				headerText: 'a'.repeat(200),
			});
			expect(result.success).toBe(true);
		});

		it('lehnt headerText mit mehr als 200 Zeichen ab', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				headerText: 'a'.repeat(201),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('headerText');
			}
		});

		it('akzeptiert footerText mit genau 200 Zeichen', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				footerText: 'a'.repeat(200),
			});
			expect(result.success).toBe(true);
		});

		it('lehnt footerText mit mehr als 200 Zeichen ab', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				footerText: 'a'.repeat(201),
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('footerText');
			}
		});
	});

	describe('logoSize Grenzwerte', () => {
		it('akzeptiert minimale logoSize von 16', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				logoSize: 16,
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert maximale logoSize von 80', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				logoSize: 80,
			});
			expect(result.success).toBe(true);
		});

		it('lehnt logoSize unter 16 ab', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				logoSize: 15,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('logoSize');
			}
		});

		it('lehnt logoSize über 80 ab', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				logoSize: 81,
			});
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].path).toContain('logoSize');
			}
		});

		it('lehnt nicht-ganzzahlige logoSize ab', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				logoSize: 48.5,
			});
			expect(result.success).toBe(false);
		});
	});

	describe('margins Schema', () => {
		it('akzeptiert alle Ränder mit 0', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				margins: {
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
				},
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert alle Ränder mit 50', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				margins: {
					top: 50,
					bottom: 50,
					left: 50,
					right: 50,
				},
			});
			expect(result.success).toBe(true);
		});

		it('lehnt negative Ränder ab', () => {
			const marginFields = ['top', 'bottom', 'left', 'right'] as const;

			marginFields.forEach((field) => {
				const result = pdfTemplateSchema.safeParse({
					...validData,
					margins: {
						...validData.margins,
						[field]: -1,
					},
				});
				expect(result.success).toBe(false);
			});
		});

		it('lehnt Ränder über 50 ab', () => {
			const marginFields = ['top', 'bottom', 'left', 'right'] as const;

			marginFields.forEach((field) => {
				const result = pdfTemplateSchema.safeParse({
					...validData,
					margins: {
						...validData.margins,
						[field]: 51,
					},
				});
				expect(result.success).toBe(false);
			});
		});

		it('lehnt nicht-ganzzahlige Ränder ab', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				margins: {
					...validData.margins,
					top: 20.5,
				},
			});
			expect(result.success).toBe(false);
		});

		it('lehnt fehlende Rand-Felder ab', () => {
			const marginFields = ['top', 'bottom', 'left', 'right'] as const;

			marginFields.forEach((field) => {
				const { [field]: _, ...incompleteMargins } = validData.margins;
				const result = pdfTemplateSchema.safeParse({
					...validData,
					margins: incompleteMargins,
				});
				expect(result.success).toBe(false);
			});
		});
	});

	describe('Edge Cases', () => {
		it('akzeptiert headerText mit Sonderzeichen', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				headerText: 'Müller & Partner GmbH - "Beste Immobilien" ®',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert footerText mit Zeilenumbruch', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				footerText: 'Zeile 1\nZeile 2',
			});
			expect(result.success).toBe(true);
		});

		it('akzeptiert verschiedene gültige Rand-Kombinationen', () => {
			const result = pdfTemplateSchema.safeParse({
				...validData,
				margins: {
					top: 0,
					bottom: 50,
					left: 25,
					right: 10,
				},
			});
			expect(result.success).toBe(true);
		});
	});

	describe('Typ-Inferenz', () => {
		it('gibt geparste Daten mit korrektem Typ zurück', () => {
			const result = pdfTemplateSchema.safeParse(validData);
			if (result.success) {
				expect(typeof result.data.headerText).toBe('string');
				expect(typeof result.data.footerText).toBe('string');
				expect(typeof result.data.showDate).toBe('boolean');
				expect(typeof result.data.showAgents).toBe('boolean');
				expect(typeof result.data.logoPosition).toBe('string');
				expect(typeof result.data.logoSize).toBe('number');
				expect(typeof result.data.margins).toBe('object');
				expect(typeof result.data.margins.top).toBe('number');
				expect(typeof result.data.margins.bottom).toBe('number');
				expect(typeof result.data.margins.left).toBe('number');
				expect(typeof result.data.margins.right).toBe('number');
			}
		});
	});
});
