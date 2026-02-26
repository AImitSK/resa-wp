/**
 * Lead form field configuration types.
 *
 * The admin can configure fields via presets or custom settings.
 * This config is passed from PHP → REST API → React.
 */

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
 * Default "Balanced" preset — used on free plan.
 */
export const DEFAULT_FIELDS: FieldConfig[] = [
	{
		slug: 'firstName',
		type: 'text',
		label: 'Vorname',
		placeholder: 'Max',
		status: 'required',
		order: 1,
	},
	{
		slug: 'lastName',
		type: 'text',
		label: 'Nachname',
		placeholder: 'Mustermann',
		hint: '(optional)',
		status: 'optional',
		order: 2,
	},
	{
		slug: 'email',
		type: 'email',
		label: 'E-Mail',
		placeholder: 'max@beispiel.de',
		status: 'required',
		order: 3,
	},
	{
		slug: 'phone',
		type: 'tel',
		label: 'Telefon',
		placeholder: '+49 123 456789',
		hint: 'Für persönliche Beratung',
		status: 'optional',
		order: 4,
	},
	{
		slug: 'newsletter',
		type: 'checkbox',
		label: 'Ja, ich möchte Markt-Updates per E-Mail erhalten.',
		status: 'optional',
		order: 90,
	},
	{
		slug: 'consent',
		type: 'checkbox',
		label: 'Ich stimme der Verarbeitung meiner Daten gemäß der [Datenschutzerklärung] zu.',
		status: 'required',
		order: 99,
	},
];

export const DEFAULT_LEAD_FORM_CONFIG: LeadFormConfig = {
	fields: DEFAULT_FIELDS,
	buttonText: 'Ergebnis anzeigen',
	privacyUrl: '/datenschutz',
	consentLabel: 'Ich stimme der Verarbeitung meiner Daten gemäß der Datenschutzerklärung zu.',
	trustBadgeText: 'Ihre Daten sind sicher und werden nicht an Dritte weitergegeben.',
};
