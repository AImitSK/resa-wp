/**
 * Dynamic Zod schema builder for lead form fields.
 *
 * Generates a validation schema from the field configuration,
 * respecting required/optional/hidden states.
 */

import { z, type ZodTypeAny } from 'zod';
import type { FieldConfig } from '../types/lead-form';

/**
 * Build a Zod schema from the active field configuration.
 *
 * Hidden fields are excluded. Optional fields accept empty strings.
 * The consent checkbox must be `true`.
 */
export function buildLeadSchema(fields: FieldConfig[]): z.ZodObject<Record<string, ZodTypeAny>> {
	const shape: Record<string, ZodTypeAny> = {};

	for (const field of fields) {
		if (field.status === 'hidden') continue;

		let validator: ZodTypeAny;

		switch (field.type) {
			case 'email':
				validator = z.string().email('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
				break;

			case 'tel':
				validator = z
					.string()
					.regex(
						/^[+\d\s\-()]{6,20}$/,
						'Bitte geben Sie eine gültige Telefonnummer ein.',
					);
				break;

			case 'checkbox':
				if (field.slug === 'consent') {
					validator = z.literal(true, {
						errorMap: () => ({
							message: 'Die Datenschutz-Einwilligung ist erforderlich.',
						}),
					});
				} else {
					validator = z.boolean().default(false);
				}
				break;

			case 'textarea':
				validator = z.string().max(500, 'Maximal 500 Zeichen.');
				break;

			case 'select': {
				const values = field.options?.map((o) => o.value) ?? [];
				if (values.length > 0) {
					validator = z.enum(values as [string, ...string[]]);
				} else {
					validator = z.string();
				}
				break;
			}

			default:
				validator = z.string().min(2, 'Bitte füllen Sie dieses Feld aus.');
		}

		// Optional non-checkbox fields accept empty strings.
		if (field.status === 'optional' && field.type !== 'checkbox') {
			validator = z.union([validator, z.literal('')]);
		}

		shape[field.slug] = validator;
	}

	return z.object(shape);
}
