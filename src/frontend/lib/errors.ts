/**
 * Central error messages for frontend.
 *
 * All user-facing error messages in one place for
 * consistency and easy translation management.
 * Uses lazy evaluation for i18n compatibility.
 */

import { __ } from '@wordpress/i18n';

/**
 * Central error messages.
 *
 * Each property is a function that returns the translated string.
 * This ensures translations are evaluated at runtime, not module load.
 */
export const ErrorMessages = {
	// Network/API
	CONFIG_LOAD: () => __('Konfiguration konnte nicht geladen werden.', 'resa'),
	CALCULATION_FAILED: () =>
		__('Berechnung fehlgeschlagen. Bitte versuchen Sie es erneut.', 'resa'),
	FORM_SUBMIT_FAILED: () => __('Formular konnte nicht gesendet werden.', 'resa'),
	NETWORK_ERROR: () => __('Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.', 'resa'),

	// Validation
	FIELD_REQUIRED: () => __('Dieses Feld ist erforderlich.', 'resa'),
	INVALID_EMAIL: () => __('Bitte geben Sie eine gültige E-Mail-Adresse ein.', 'resa'),
	INVALID_PHONE: () => __('Bitte geben Sie eine gültige Telefonnummer ein.', 'resa'),
	CONSENT_REQUIRED: () => __('Die Datenschutz-Einwilligung ist erforderlich.', 'resa'),
	MIN_FIELD: () => __('Bitte füllen Sie dieses Feld aus.', 'resa'),
	MAX_LENGTH: () => __('Maximal 500 Zeichen.', 'resa'),

	// Property validation
	PROPERTY_TYPE_REQUIRED: () => __('Bitte wählen Sie eine Immobilienart.', 'resa'),
	SIZE_REQUIRED: () => __('Wohnfläche ist erforderlich.', 'resa'),
	SIZE_MIN: () => __('Mindestens 10 m².', 'resa'),
	SIZE_MAX: () => __('Maximal 10.000 m².', 'resa'),
	CITY_REQUIRED: () => __('Bitte wählen Sie einen Standort.', 'resa'),
	CONDITION_REQUIRED: () => __('Bitte wählen Sie den Zustand.', 'resa'),
} as const;

/**
 * Type for ErrorMessages keys.
 */
export type ErrorMessageKey = keyof typeof ErrorMessages;
