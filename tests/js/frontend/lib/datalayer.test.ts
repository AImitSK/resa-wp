import { describe, it, expect, beforeEach } from 'vitest';
import { pushToDataLayer, fireGoogleAdsConversion } from '@frontend/lib/datalayer';

beforeEach(() => {
	// Reset dataLayer and tracking config.
	window.dataLayer = undefined;
	window.gtag = undefined;

	window.resaFrontend = {
		restUrl: '/wp-json/resa/v1/',
		module: 'rent-calculator',
		version: '1.0.0',
		trackingConfig: {
			datalayer_enabled: true,
			google_ads: {
				form_view: { id: 'AW-123456789', label: 'abc123' },
				form_submit: { id: 'AW-123456789', label: 'def456' },
			},
			enhanced_conversions: false,
			gclid_capture: true,
			utm_capture: true,
		},
	};
});

describe('pushToDataLayer', () => {
	it('pusht Event in window.dataLayer wenn aktiviert', () => {
		pushToDataLayer('asset_view', 'rent-calculator');

		expect(window.dataLayer).toBeDefined();
		expect(window.dataLayer).toHaveLength(1);
		expect(window.dataLayer![0]).toMatchObject({
			event: 'resa_asset_view',
			resa_event: 'asset_view',
			resa_asset_type: 'rent-calculator',
		});
	});

	it('enthält location_id und step wenn angegeben', () => {
		pushToDataLayer('step_complete', 'rent-calculator', {
			location_id: 42,
			step: 3,
			step_total: 7,
		});

		expect(window.dataLayer![0]).toMatchObject({
			event: 'resa_step_complete',
			resa_location_id: 42,
			resa_step: 3,
			resa_step_total: 7,
		});
	});

	it('pusht nicht wenn datalayer_enabled false', () => {
		window.resaFrontend.trackingConfig!.datalayer_enabled = false;

		pushToDataLayer('asset_view', 'rent-calculator');

		expect(window.dataLayer).toBeUndefined();
	});

	it('pusht nicht wenn trackingConfig fehlt', () => {
		delete window.resaFrontend.trackingConfig;

		pushToDataLayer('asset_view', 'rent-calculator');

		expect(window.dataLayer).toBeUndefined();
	});
});

describe('fireGoogleAdsConversion', () => {
	it('ruft gtag mit korrekter Conversion-Config auf', () => {
		fireGoogleAdsConversion('form_view');

		// gtag sollte durch ensureGtag initialisiert worden sein.
		expect(window.gtag).toBeDefined();
		expect(window.dataLayer).toBeDefined();

		// Da gtag Argumente als Arguments-Objekt pusht, prüfen wir ob dataLayer nicht leer ist.
		expect(window.dataLayer!.length).toBeGreaterThan(0);
	});

	it('feuert nicht wenn Conversion-ID leer', () => {
		window.resaFrontend.trackingConfig!.google_ads.form_view.id = '';

		fireGoogleAdsConversion('form_view');

		expect(window.gtag).toBeUndefined();
	});

	it('feuert nicht wenn Conversion-Label leer', () => {
		window.resaFrontend.trackingConfig!.google_ads.form_submit.label = '';

		fireGoogleAdsConversion('form_submit');

		// gtag sollte nicht geladen werden wenn Label fehlt.
		expect(window.gtag).toBeUndefined();
	});
});
