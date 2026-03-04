/**
 * Lead form field configuration types.
 *
 * The admin can configure fields via presets or custom settings.
 * This config is passed from PHP → REST API → React.
 */

import { __ } from '@wordpress/i18n';

/**
 * Possible field display states.
 */
export type FieldStatus = 'required' | 'optional' | 'hidden';

/**
 * Single form field configuration.
 */
export interface FieldConfig {
	slug: string;
	type: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox';
	label: string;
	placeholder?: string;
	hint?: string;
	status: FieldStatus;
	options?: { value: string; label: string }[];
	order: number;
}

/**
 * Full lead form configuration.
 */
export interface LeadFormConfig {
	fields: FieldConfig[];
	buttonText: string;
	privacyUrl: string;
	consentLabel?: string;
	trustBadgeText?: string;
}

/**
 * Form submission data sent to the API.
 */
export interface LeadFormData {
	firstName: string;
	lastName?: string;
	email: string;
	phone?: string;
	company?: string;
	salutation?: string;
	message?: string;
	consent: boolean;
	consentText: string;
	[key: string]: unknown;
}

/**
 * Get default fields with translated labels.
 *
 * Returns "Balanced" preset — used on free plan.
 */
export function getDefaultFields(): FieldConfig[] {
	const privacyConfig =
		typeof window !== 'undefined' ? window.resaFrontend?.privacyConfig : undefined;

	return [
		{
			slug: 'firstName',
			type: 'text',
			label: __('Vorname', 'resa'),
			placeholder: 'Max',
			status: 'required',
			order: 1,
		},
		{
			slug: 'lastName',
			type: 'text',
			label: __('Nachname', 'resa'),
			placeholder: 'Mustermann',
			hint: __('(optional)', 'resa'),
			status: 'optional',
			order: 2,
		},
		{
			slug: 'email',
			type: 'email',
			label: __('E-Mail', 'resa'),
			placeholder: 'max@beispiel.de',
			status: 'required',
			order: 3,
		},
		{
			slug: 'phone',
			type: 'tel',
			label: __('Telefon', 'resa'),
			placeholder: '+49 123 456789',
			hint: __('Für persönliche Beratung', 'resa'),
			status: 'optional',
			order: 4,
		},
		{
			slug: 'newsletter',
			type: 'checkbox',
			label:
				privacyConfig?.newsletterText ||
				__('Ja, ich möchte Markt-Updates per E-Mail erhalten.', 'resa'),
			status: 'optional',
			order: 90,
		},
		{
			slug: 'consent',
			type: 'checkbox',
			label:
				privacyConfig?.consentText ||
				__(
					'Ich stimme der Verarbeitung meiner Daten gemäß der [Datenschutzerklärung] zu.',
					'resa',
				),
			status: 'required',
			order: 99,
		},
	];
}

/**
 * Default fields array for backwards compatibility.
 * @deprecated Use getDefaultFields() for i18n support.
 */
export const DEFAULT_FIELDS: FieldConfig[] = getDefaultFields();

/**
 * Get default lead form config with translated labels.
 */
export function getDefaultLeadFormConfig(): LeadFormConfig {
	const privacyConfig =
		typeof window !== 'undefined' ? window.resaFrontend?.privacyConfig : undefined;

	return {
		fields: getDefaultFields(),
		buttonText: __('Ergebnis anzeigen', 'resa'),
		privacyUrl: privacyConfig?.privacyUrl || '/datenschutz',
		consentLabel:
			privacyConfig?.consentText ||
			__(
				'Ich stimme der Verarbeitung meiner Daten gemäß der Datenschutzerklärung zu.',
				'resa',
			),
		trustBadgeText: __(
			'Ihre Daten sind sicher und werden nicht an Dritte weitergegeben.',
			'resa',
		),
	};
}

/**
 * Default config for backwards compatibility.
 * @deprecated Use getDefaultLeadFormConfig() for i18n support.
 */
export const DEFAULT_LEAD_FORM_CONFIG: LeadFormConfig = getDefaultLeadFormConfig();
