/**
 * Unit-Tests für useFeatures Hook.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

import {
	useFeatures,
	useLocationCount,
	useCanAddLocation,
	useIsPremium,
} from '@/admin/hooks/useFeatures';
import type { FeatureGate } from '@/admin/types';

// Default Features für Free-Plan
const freeFeatures: FeatureGate = {
	plan: 'free',
	is_trial: false,
	max_modules: 2,
	max_locations: 1,
	max_leads: 50,
	can_export_leads: false,
	can_use_pdf_designer: false,
	can_use_smtp: false,
	can_remove_branding: false,
	can_use_webhooks: false,
	can_use_api_keys: false,
	can_use_messenger: false,
	can_use_advanced_tracking: false,
};

// Premium Features
const premiumFeatures: FeatureGate = {
	plan: 'premium',
	is_trial: false,
	max_modules: null,
	max_locations: null,
	max_leads: 10000,
	can_export_leads: true,
	can_use_pdf_designer: true,
	can_use_smtp: true,
	can_remove_branding: true,
	can_use_webhooks: true,
	can_use_api_keys: true,
	can_use_messenger: true,
	can_use_advanced_tracking: true,
};

// Trial Features
const trialFeatures: FeatureGate = {
	plan: 'premium',
	is_trial: true,
	max_modules: null,
	max_locations: null,
	max_leads: 10000,
	can_export_leads: true,
	can_use_pdf_designer: true,
	can_use_smtp: true,
	can_remove_branding: true,
	can_use_webhooks: true,
	can_use_api_keys: true,
	can_use_messenger: true,
	can_use_advanced_tracking: true,
};

describe('useFeatures', () => {
	const originalWindow = { ...window };

	beforeEach(() => {
		// Reset window.resaAdmin
		Object.defineProperty(window, 'resaAdmin', {
			value: undefined,
			writable: true,
			configurable: true,
		});
	});

	afterEach(() => {
		// Restore window
		Object.defineProperty(window, 'resaAdmin', {
			value: originalWindow.resaAdmin,
			writable: true,
			configurable: true,
		});
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useFeatures Hook
	// ──────────────────────────────────────────────────────────────────────────

	it('gibt Default-Features zurück wenn resaAdmin nicht definiert ist', () => {
		const { result } = renderHook(() => useFeatures());

		expect(result.current.plan).toBe('free');
		expect(result.current.max_modules).toBe(2);
		expect(result.current.max_locations).toBe(1);
		expect(result.current.max_leads).toBe(50);
		expect(result.current.can_export_leads).toBe(false);
	});

	it('gibt Free-Plan Features korrekt zurück', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: freeFeatures,
				locationCount: 0,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useFeatures());

		expect(result.current.plan).toBe('free');
		expect(result.current.is_trial).toBe(false);
		expect(result.current.max_modules).toBe(2);
		expect(result.current.max_locations).toBe(1);
		expect(result.current.max_leads).toBe(50);
		expect(result.current.can_export_leads).toBe(false);
		expect(result.current.can_use_pdf_designer).toBe(false);
		expect(result.current.can_use_smtp).toBe(false);
		expect(result.current.can_remove_branding).toBe(false);
		expect(result.current.can_use_webhooks).toBe(false);
		expect(result.current.can_use_api_keys).toBe(false);
		expect(result.current.can_use_messenger).toBe(false);
		expect(result.current.can_use_advanced_tracking).toBe(false);
	});

	it('gibt Premium-Plan Features korrekt zurück', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: premiumFeatures,
				locationCount: 5,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useFeatures());

		expect(result.current.plan).toBe('premium');
		expect(result.current.is_trial).toBe(false);
		expect(result.current.max_modules).toBeNull();
		expect(result.current.max_locations).toBeNull();
		expect(result.current.max_leads).toBe(10000);
		expect(result.current.can_export_leads).toBe(true);
		expect(result.current.can_use_pdf_designer).toBe(true);
		expect(result.current.can_use_smtp).toBe(true);
		expect(result.current.can_remove_branding).toBe(true);
		expect(result.current.can_use_webhooks).toBe(true);
		expect(result.current.can_use_api_keys).toBe(true);
		expect(result.current.can_use_messenger).toBe(true);
		expect(result.current.can_use_advanced_tracking).toBe(true);
	});

	it('gibt Trial-Features korrekt zurück', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: trialFeatures,
				locationCount: 2,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useFeatures());

		expect(result.current.plan).toBe('premium');
		expect(result.current.is_trial).toBe(true);
		expect(result.current.can_export_leads).toBe(true);
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useLocationCount Hook
	// ──────────────────────────────────────────────────────────────────────────

	it('gibt 0 zurück wenn resaAdmin nicht definiert ist', () => {
		const { result } = renderHook(() => useLocationCount());

		expect(result.current).toBe(0);
	});

	it('gibt Location-Count korrekt zurück', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: freeFeatures,
				locationCount: 1,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useLocationCount());

		expect(result.current).toBe(1);
	});

	it('gibt hohen Location-Count für Premium zurück', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: premiumFeatures,
				locationCount: 25,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useLocationCount());

		expect(result.current).toBe(25);
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useCanAddLocation Hook
	// ──────────────────────────────────────────────────────────────────────────

	it('gibt true zurück wenn Location-Limit nicht erreicht ist (Free)', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: freeFeatures,
				locationCount: 0,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useCanAddLocation());

		expect(result.current).toBe(true);
	});

	it('gibt false zurück wenn Location-Limit erreicht ist (Free)', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: freeFeatures,
				locationCount: 1,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useCanAddLocation());

		expect(result.current).toBe(false);
	});

	it('gibt true zurück für Premium-Plan (unbegrenzt)', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: premiumFeatures,
				locationCount: 100,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useCanAddLocation());

		expect(result.current).toBe(true);
	});

	it('gibt true zurück wenn max_locations null ist', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: {
					...freeFeatures,
					max_locations: null,
				},
				locationCount: 50,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useCanAddLocation());

		expect(result.current).toBe(true);
	});

	it('gibt false zurück wenn genau am Limit', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: {
					...freeFeatures,
					max_locations: 3,
				},
				locationCount: 3,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useCanAddLocation());

		expect(result.current).toBe(false);
	});

	it('gibt true zurück wenn unter dem Limit', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: {
					...freeFeatures,
					max_locations: 5,
				},
				locationCount: 3,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useCanAddLocation());

		expect(result.current).toBe(true);
	});

	// ──────────────────────────────────────────────────────────────────────────
	// useIsPremium Hook
	// ──────────────────────────────────────────────────────────────────────────

	it('gibt false zurück für Free-Plan', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: freeFeatures,
				locationCount: 0,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useIsPremium());

		expect(result.current).toBe(false);
	});

	it('gibt true zurück für Premium-Plan', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: premiumFeatures,
				locationCount: 0,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useIsPremium());

		expect(result.current).toBe(true);
	});

	it('gibt true zurück für Trial (ist technisch Premium)', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: trialFeatures,
				locationCount: 0,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useIsPremium());

		expect(result.current).toBe(true);
	});

	it('gibt false zurück wenn resaAdmin nicht definiert ist', () => {
		const { result } = renderHook(() => useIsPremium());

		expect(result.current).toBe(false);
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Edge Cases
	// ──────────────────────────────────────────────────────────────────────────

	it('behandelt fehlende features Property', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				locationCount: 0,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useFeatures());

		// Sollte Default-Features zurückgeben
		expect(result.current.plan).toBe('free');
		expect(result.current.max_modules).toBe(2);
	});

	it('kombiniert alle Hooks korrekt für Free-User am Limit', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: freeFeatures,
				locationCount: 1,
			},
			writable: true,
			configurable: true,
		});

		const { result: featuresResult } = renderHook(() => useFeatures());
		const { result: locationCountResult } = renderHook(() => useLocationCount());
		const { result: canAddResult } = renderHook(() => useCanAddLocation());
		const { result: isPremiumResult } = renderHook(() => useIsPremium());

		expect(featuresResult.current.plan).toBe('free');
		expect(locationCountResult.current).toBe(1);
		expect(canAddResult.current).toBe(false);
		expect(isPremiumResult.current).toBe(false);
	});

	it('kombiniert alle Hooks korrekt für Premium-User', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: premiumFeatures,
				locationCount: 50,
			},
			writable: true,
			configurable: true,
		});

		const { result: featuresResult } = renderHook(() => useFeatures());
		const { result: locationCountResult } = renderHook(() => useLocationCount());
		const { result: canAddResult } = renderHook(() => useCanAddLocation());
		const { result: isPremiumResult } = renderHook(() => useIsPremium());

		expect(featuresResult.current.plan).toBe('premium');
		expect(locationCountResult.current).toBe(50);
		expect(canAddResult.current).toBe(true);
		expect(isPremiumResult.current).toBe(true);
	});

	// ──────────────────────────────────────────────────────────────────────────
	// Feature-Capability Tests
	// ──────────────────────────────────────────────────────────────────────────

	it('prüft can_export_leads Feature', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: freeFeatures,
				locationCount: 0,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useFeatures());
		expect(result.current.can_export_leads).toBe(false);

		// Wechsel zu Premium
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: premiumFeatures,
				locationCount: 0,
			},
			writable: true,
			configurable: true,
		});

		const { result: premiumResult } = renderHook(() => useFeatures());
		expect(premiumResult.current.can_export_leads).toBe(true);
	});

	it('prüft can_use_webhooks Feature', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: freeFeatures,
				locationCount: 0,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useFeatures());
		expect(result.current.can_use_webhooks).toBe(false);

		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: premiumFeatures,
				locationCount: 0,
			},
			writable: true,
			configurable: true,
		});

		const { result: premiumResult } = renderHook(() => useFeatures());
		expect(premiumResult.current.can_use_webhooks).toBe(true);
	});

	it('prüft max_leads Limit', () => {
		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: freeFeatures,
				locationCount: 0,
			},
			writable: true,
			configurable: true,
		});

		const { result } = renderHook(() => useFeatures());
		expect(result.current.max_leads).toBe(50);

		Object.defineProperty(window, 'resaAdmin', {
			value: {
				features: premiumFeatures,
				locationCount: 0,
			},
			writable: true,
			configurable: true,
		});

		const { result: premiumResult } = renderHook(() => useFeatures());
		expect(premiumResult.current.max_leads).toBe(10000);
	});
});
