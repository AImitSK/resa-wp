/**
 * Vitest-Tests für das Propstack-Settings-Schema.
 *
 * @see src/admin/schemas/propstack.ts
 */

import { describe, it, expect } from 'vitest';
import { propstackSettingsSchema, type PropstackSettingsFormData } from '@admin/schemas/propstack';

describe('propstackSettingsSchema', () => {
	const validData: PropstackSettingsFormData = {
		enabled: true,
		api_key: 'pk_test_1234567890abcdef',
		city_broker_mapping: { 1: 100, 2: 200 },
		default_broker_id: 100,
		contact_source_id: 5,
		activity_enabled: true,
		activity_type_id: 10,
		activity_create_task: true,
		activity_task_due_days: 3,
		sync_newsletter_only: false,
		newsletter_broker_id: null,
	};

	// --- Valid Data Tests ---

	it('akzeptiert vollstaendige gueltige Daten', () => {
		const result = propstackSettingsSchema.safeParse(validData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual(validData);
		}
	});

	it('akzeptiert Daten mit deaktivierter Integration', () => {
		const data = {
			...validData,
			enabled: false,
			api_key: '',
		};
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert null-Werte fuer nullable Felder', () => {
		const data = {
			...validData,
			default_broker_id: null,
			contact_source_id: null,
			activity_type_id: null,
			newsletter_broker_id: null,
		};
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert leeres city_broker_mapping', () => {
		const data = {
			...validData,
			city_broker_mapping: {},
		};
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	// --- Required Fields Tests ---

	it('erfordert enabled-Feld', () => {
		const { enabled: _enabled, ...incomplete } = validData;
		const result = propstackSettingsSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert api_key-Feld', () => {
		const { api_key: _api_key, ...incomplete } = validData;
		const result = propstackSettingsSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert city_broker_mapping-Feld', () => {
		const { city_broker_mapping: _city_broker_mapping, ...incomplete } = validData;
		const result = propstackSettingsSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	it('erfordert activity_enabled-Feld', () => {
		const { activity_enabled: _activity_enabled, ...incomplete } = validData;
		const result = propstackSettingsSchema.safeParse(incomplete);
		expect(result.success).toBe(false);
	});

	// --- activity_task_due_days Range Tests ---

	it('akzeptiert activity_task_due_days = 1 (Minimum)', () => {
		const data = { ...validData, activity_task_due_days: 1 };
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert activity_task_due_days = 30 (Maximum)', () => {
		const data = { ...validData, activity_task_due_days: 30 };
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('lehnt activity_task_due_days = 0 ab', () => {
		const data = { ...validData, activity_task_due_days: 0 };
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].path).toContain('activity_task_due_days');
		}
	});

	it('lehnt activity_task_due_days = 31 ab', () => {
		const data = { ...validData, activity_task_due_days: 31 };
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt activity_task_due_days als Dezimalzahl ab', () => {
		const data = { ...validData, activity_task_due_days: 3.5 };
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt negative activity_task_due_days ab', () => {
		const data = { ...validData, activity_task_due_days: -1 };
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	// --- Type Validation Tests ---

	it('lehnt enabled als String ab', () => {
		const data = { ...validData, enabled: 'true' };
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	it('lehnt api_key als Zahl ab', () => {
		const data = { ...validData, api_key: 12345 };
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	// --- city_broker_mapping Tests ---

	it('koerziert String-Keys zu Zahlen im Mapping', () => {
		const data = {
			...validData,
			city_broker_mapping: { '1': 100, '2': 200 },
		};
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.city_broker_mapping).toEqual({ 1: 100, 2: 200 });
		}
	});

	it('akzeptiert mehrere Eintraege im city_broker_mapping', () => {
		const data = {
			...validData,
			city_broker_mapping: { 1: 100, 2: 200, 3: 300, 4: 400 },
		};
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('lehnt nicht-numerische Broker-IDs im Mapping ab', () => {
		const data = {
			...validData,
			city_broker_mapping: { 1: 'abc' },
		};
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(false);
	});

	// --- Boolean Fields Tests ---

	it.each(['activity_enabled', 'activity_create_task', 'sync_newsletter_only'] as const)(
		'akzeptiert true/false fuer %s',
		(field) => {
			const dataTrue = { ...validData, [field]: true };
			const dataFalse = { ...validData, [field]: false };

			expect(propstackSettingsSchema.safeParse(dataTrue).success).toBe(true);
			expect(propstackSettingsSchema.safeParse(dataFalse).success).toBe(true);
		},
	);

	// --- Edge Cases ---

	it('akzeptiert leeren api_key String', () => {
		const data = { ...validData, api_key: '' };
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert sehr langen api_key', () => {
		const data = { ...validData, api_key: 'a'.repeat(500) };
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});

	it('akzeptiert api_key mit Sonderzeichen', () => {
		const data = { ...validData, api_key: 'pk_live_ABC123!@#$%^&*()' };
		const result = propstackSettingsSchema.safeParse(data);
		expect(result.success).toBe(true);
	});
});
