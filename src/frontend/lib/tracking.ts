/**
 * Fire-and-forget tracking helper for funnel events.
 *
 * Sends events to the existing tracking endpoint.
 * Failures are silently ignored — tracking must never
 * block the user experience.
 */

import { api } from './api-client';
import { getSessionId } from './session';

export type TrackingEvent =
	| 'asset_view'
	| 'asset_start'
	| 'step_complete'
	| 'form_view'
	| 'form_submit'
	| 'result_view';

interface TrackingPayload {
	event: TrackingEvent;
	assetType: string;
	sessionId: string;
	locationId?: number;
	data?: Record<string, unknown>;
}

export function trackEvent(
	event: TrackingEvent,
	assetType: string,
	extra?: { location_id?: number; data?: Record<string, unknown> },
): void {
	const payload: TrackingPayload = {
		event,
		assetType,
		sessionId: getSessionId(),
		locationId: extra?.location_id,
		...extra?.data,
	};

	api.post('tracking', payload).catch(() => {
		// Silently ignore tracking failures.
	});
}
