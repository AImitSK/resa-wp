import { describe, it, expect } from 'vitest';
import { buildLeadSchema } from '@frontend/lib/validation';
import type { FieldConfig } from '@frontend/types/lead-form';

const REQUIRED_FIELDS: FieldConfig[] = [
	{
		slug: 'first_name',
		type: 'text',
		label: 'Vorname',
		status: 'required',
		order: 1,
	},
	{
		slug: 'email',
		type: 'email',
		label: 'E-Mail',
		status: 'required',
		order: 2,
	},
	{
		slug: 'consent',
		type: 'checkbox',
		label: 'DSGVO',
		status: 'required',
		order: 99,
	},
];

describe('buildLeadSchema', () => {
	it('validiert gültige Pflichtfelder', () => {
		const schema = buildLeadSchema(REQUIRED_FIELDS);
		const result = schema.safeParse({
			first_name: 'Max',
			email: 'max@test.de',
			consent: true,
		});

		expect(result.success).toBe(true);
	});

	it('lehnt leeren Vornamen ab', () => {
		const schema = buildLeadSchema(REQUIRED_FIELDS);
		const result = schema.safeParse({
			first_name: '',
			email: 'max@test.de',
			consent: true,
		});

		expect(result.success).toBe(false);
	});

	it('lehnt ungültige E-Mail ab', () => {
		const schema = buildLeadSchema(REQUIRED_FIELDS);
		const result = schema.safeParse({
			first_name: 'Max',
			email: 'invalid',
			consent: true,
		});

		expect(result.success).toBe(false);
	});

	it('erfordert consent=true', () => {
		const schema = buildLeadSchema(REQUIRED_FIELDS);
		const result = schema.safeParse({
			first_name: 'Max',
			email: 'max@test.de',
			consent: false,
		});

		expect(result.success).toBe(false);
	});

	it('ignoriert versteckte Felder', () => {
		const fields: FieldConfig[] = [
			...REQUIRED_FIELDS,
			{
				slug: 'phone',
				type: 'tel',
				label: 'Telefon',
				status: 'hidden',
				order: 3,
			},
		];

		const schema = buildLeadSchema(fields);
		// Phone should not be in the schema — valid without it.
		const result = schema.safeParse({
			first_name: 'Max',
			email: 'max@test.de',
			consent: true,
		});

		expect(result.success).toBe(true);
	});

	it('erlaubt leere optionale Text-Felder', () => {
		const fields: FieldConfig[] = [
			...REQUIRED_FIELDS,
			{
				slug: 'last_name',
				type: 'text',
				label: 'Nachname',
				status: 'optional',
				order: 2,
			},
		];

		const schema = buildLeadSchema(fields);
		const result = schema.safeParse({
			first_name: 'Max',
			email: 'max@test.de',
			consent: true,
			last_name: '',
		});

		expect(result.success).toBe(true);
	});

	it('validiert Telefonnummern-Format', () => {
		const fields: FieldConfig[] = [
			...REQUIRED_FIELDS,
			{
				slug: 'phone',
				type: 'tel',
				label: 'Telefon',
				status: 'required',
				order: 3,
			},
		];

		const schema = buildLeadSchema(fields);

		// Valid phone.
		const valid = schema.safeParse({
			first_name: 'Max',
			email: 'max@test.de',
			consent: true,
			phone: '+49 123 456789',
		});
		expect(valid.success).toBe(true);

		// Invalid phone.
		const invalid = schema.safeParse({
			first_name: 'Max',
			email: 'max@test.de',
			consent: true,
			phone: 'abc',
		});
		expect(invalid.success).toBe(false);
	});

	it('validiert Select-Felder mit Optionen', () => {
		const fields: FieldConfig[] = [
			...REQUIRED_FIELDS,
			{
				slug: 'salutation',
				type: 'select',
				label: 'Anrede',
				status: 'required',
				options: [
					{ value: 'mr', label: 'Herr' },
					{ value: 'mrs', label: 'Frau' },
				],
				order: 0,
			},
		];

		const schema = buildLeadSchema(fields);

		const valid = schema.safeParse({
			first_name: 'Max',
			email: 'max@test.de',
			consent: true,
			salutation: 'mr',
		});
		expect(valid.success).toBe(true);

		const invalid = schema.safeParse({
			first_name: 'Max',
			email: 'max@test.de',
			consent: true,
			salutation: 'unknown',
		});
		expect(invalid.success).toBe(false);
	});

	it('begrenzt Textarea auf 500 Zeichen', () => {
		const fields: FieldConfig[] = [
			...REQUIRED_FIELDS,
			{
				slug: 'message',
				type: 'textarea',
				label: 'Nachricht',
				status: 'required',
				order: 5,
			},
		];

		const schema = buildLeadSchema(fields);

		const tooLong = schema.safeParse({
			first_name: 'Max',
			email: 'max@test.de',
			consent: true,
			message: 'x'.repeat(501),
		});

		expect(tooLong.success).toBe(false);
	});
});
