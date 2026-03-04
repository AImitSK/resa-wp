/**
 * Fire-and-forget tracking helper for funnel events.
 *
 * Sends events to the REST API and pushes to dataLayer / Google Ads.
 * Failures are silently ignored — tracking must never
 * block the user experience.
 */

import { api } from './api-client';
import { getSessionId } from './session';
import { pushToDataLayer, fireGoogleAdsConversion, pushEnhancedConversion } from './datalayer';

export type TrackingEvent =
	| 'asset_view'
	| 'asset_start'
	| 'step_complete'
	| 'form_view'
	| 'form_interact'
	| 'form_submit'
	| 'result_view';

interface TrackingPayload {
	event: TrackingEvent;
	assetType: string;
	sessionId: string;
	locationId?: number;
	step?: number;
	stepTotal?: number;
	[key: string]: unknown;
}

interface TrackExtra {
	location_id?: number;
	step?: number;
	step_total?: number;
	data?: Record<string, unknown>;
	/** Lead value in EUR (for Google Ads conversion value). */
	value?: number;
	/** Email for Enhanced Conversions (hashed before sending). */
	email?: string;
}

export function trackEvent(event: TrackingEvent, assetType: string, extra?: TrackExtra): void {
	const payload: TrackingPayload = {
		event,
		assetType,
		sessionId: getSessionId(),
		locationId: extra?.location_id,
		step: extra?.step,
		stepTotal: extra?.step_total,
		...extra?.data,
	};

	// 1. Send to REST API.
	api.post('tracking', payload).catch(() => {
		// Silently ignore tracking failures.
	});

	// 2. Push to GTM dataLayer.
	pushToDataLayer(event, assetType, {
		location_id: extra?.location_id,
		step: extra?.step,
		step_total: extra?.step_total,
	});

	// 3. Fire Google Ads conversions for key funnel events.
	if (event === 'form_view') {
		fireGoogleAdsConversion('form_view', extra?.value);
	}
	if (event === 'form_submit') {
		fireGoogleAdsConversion('form_submit', extra?.value);

		// Enhanced Conversions — hash email and push to dataLayer.
		if (extra?.email) {
			pushEnhancedConversion(extra.email).catch(() => {
				// Silently ignore.
			});
		}
	}
}
