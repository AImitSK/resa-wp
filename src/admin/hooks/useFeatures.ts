/**
 * Hook to access feature gate data from the localized script.
 *
 * Provides information about the current plan and feature limits.
 */

import type { FeatureGate } from '../types';

const defaultFeatures: FeatureGate = {
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
};

/**
 * Get feature gate data.
 */
export function useFeatures(): FeatureGate {
	return window.resaAdmin?.features ?? defaultFeatures;
}

/**
 * Get current location count.
 */
export function useLocationCount(): number {
	return window.resaAdmin?.locationCount ?? 0;
}

/**
 * Check if a new location can be added.
 */
export function useCanAddLocation(): boolean {
	const features = useFeatures();
	const locationCount = useLocationCount();

	if (features.plan === 'premium' || features.max_locations === null) {
		return true;
	}

	return locationCount < features.max_locations;
}

/**
 * Check if the user is on the premium plan.
 */
export function useIsPremium(): boolean {
	const features = useFeatures();
	return features.plan === 'premium';
}
